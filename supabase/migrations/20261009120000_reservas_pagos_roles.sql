-- ════════════════════════════════════════════════════════════════════════
-- KoreManager · Migración 2026-10-09 (2)
-- Roles, reservas atómicas, cancelaciones con historial y pagos fiables.
-- Requiere la migración 20261008120000_seguridad_rate_limit_chatbot.sql.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────────
-- 1. ROLES · el panel de admin no aparecía porque el rol no se podía leer
--    (si `roles` tiene RLS activado sin políticas, el join devuelve null y
--    la app trataba a todo el mundo como "ciudadano").
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read" ON public.roles;
CREATE POLICY "roles_read" ON public.roles FOR SELECT TO authenticated USING (true);

-- user_role() ya existe (SECURITY DEFINER): la app la usa como fuente fiable
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated;


-- ────────────────────────────────────────────────────────────────────────
-- 2. INSTALACIONES · precio por hora editable por el administrador
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.instalaciones
  ADD COLUMN IF NOT EXISTS precio_hora_cents INT NOT NULL DEFAULT 500;
ALTER TABLE public.instalaciones DROP CONSTRAINT IF EXISTS instalaciones_precio_chk;
ALTER TABLE public.instalaciones ADD CONSTRAINT instalaciones_precio_chk CHECK (precio_hora_cents BETWEEN 0 AND 100000);


-- ────────────────────────────────────────────────────────────────────────
-- 3. UNA FRANJA SOLO ESTÁ OCUPADA SI LA RESERVA ESTÁ ACTIVA
--    Antes la restricción UNIQUE contaba también las canceladas, así que
--    para liberar una pista había que BORRAR la reserva (y con ella su pago).
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS reservas_installation_id_fecha_hora_key;
CREATE UNIQUE INDEX IF NOT EXISTS reservas_franja_activa_uniq
  ON public.reservas (installation_id, fecha, hora)
  WHERE payment_status IN ('pending', 'paid');

-- Inicio de una reserva en hora peninsular
CREATE OR REPLACE FUNCTION public.reserva_inicio(f DATE, h TIME)
RETURNS TIMESTAMPTZ LANGUAGE sql IMMUTABLE AS $$
  SELECT (f + h) AT TIME ZONE 'Europe/Madrid';
$$;


-- ────────────────────────────────────────────────────────────────────────
-- 4. GUARDA DE RESERVAS · las funciones de este archivo marcan la sesión
--    como "de confianza" (kore.trusted) para poder fijar precio y estado.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.kore_trusted()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('kore.trusted', true), '') = 'on';
$$;

CREATE OR REPLACE FUNCTION public.guard_reserva_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_id     INT;
  parent_status TEXT;
  rl            RECORD;
BEGIN
  IF public.is_privileged() OR public.kore_trusted() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT * INTO rl FROM public.hit_rate_limit('reservas:' || auth.uid()::TEXT, 30, 600);
    IF NOT rl.allowed THEN
      RAISE EXCEPTION 'Has creado demasiadas reservas seguidas. Inténtalo de nuevo en unos minutos.' USING ERRCODE = 'P0429';
    END IF;
    IF NEW.fecha < CURRENT_DATE THEN
      RAISE EXCEPTION 'No se puede reservar en una fecha pasada.' USING ERRCODE = '23514';
    END IF;
    NEW.user_id := auth.uid();
    NEW.payment_status := 'pending';
    NEW.paid_at := NULL;
    NEW.stripe_checkout_session_id := NULL;
    NEW.stripe_payment_intent_id := NULL;
    -- El precio lo fija el servidor (precio por hora de la instalación)
    NEW.precio_cents := CASE WHEN NEW.currency LIKE 'linked\_%' THEN 0
      ELSE coalesce((SELECT precio_hora_cents FROM instalaciones WHERE id = NEW.installation_id), 500) END;
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.installation_id IS DISTINCT FROM OLD.installation_id
     OR NEW.fecha IS DISTINCT FROM OLD.fecha
     OR NEW.hora IS DISTINCT FROM OLD.hora
     OR NEW.precio_cents IS DISTINCT FROM OLD.precio_cents
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
     OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id THEN
    RAISE EXCEPTION 'No puedes modificar estos datos de la reserva.' USING ERRCODE = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'cancelled' AND OLD.payment_status = 'pending' THEN
      RETURN NEW;
    END IF;
    IF OLD.currency LIKE 'linked\_%' THEN
      parent_id := nullif(substring(OLD.currency FROM 8), '')::INT;
      SELECT payment_status INTO parent_status FROM reservas WHERE id = parent_id AND user_id = OLD.user_id;
      IF parent_status IS NOT NULL AND NEW.payment_status = parent_status THEN
        RETURN NEW;
      END IF;
    END IF;
    RAISE EXCEPTION 'El estado del pago solo lo puede cambiar el sistema de cobros.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────────────────
-- 5. STOCK · al cancelar/expirar/reembolsar una reserva se devuelve el
--    material (antes solo ocurría al borrarla).
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_restore_inventory_on_reserva_end()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.payment_status IN ('pending', 'paid')
     AND NEW.payment_status IN ('cancelled', 'refunded', 'failed') THEN
    PERFORM public.restore_inventory_for_reserva(NEW.id);
    DELETE FROM reserva_material WHERE reserva_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservas_restore_inventory_on_end ON public.reservas;
CREATE TRIGGER reservas_restore_inventory_on_end
  AFTER UPDATE OF payment_status ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.trg_restore_inventory_on_reserva_end();


-- ────────────────────────────────────────────────────────────────────────
-- 6. CADUCIDAD DE RESERVAS SIN PAGAR (se marcan como canceladas, no se borran)
--    · 3 h desde que se crearon, o
--    · 15 min si la reserva empieza en menos de 3 h.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_pending_reservas()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INT;
BEGIN
  PERFORM set_config('kore.trusted', 'on', true);
  UPDATE reservas
  SET payment_status = 'cancelled'
  WHERE payment_status = 'pending'
    AND (
      created_at < now() - INTERVAL '3 hours'
      OR (public.reserva_inicio(fecha, hora) < now() + INTERVAL '3 hours' AND created_at < now() - INTERVAL '15 minutes')
      OR public.reserva_inicio(fecha, hora) < now()
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('kore.trusted', '', true);
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_pending_reservas() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_pending_reservas() TO authenticated, service_role;

-- Franjas ocupadas: solo reservas activas (antes contaba también las canceladas)
CREATE OR REPLACE FUNCTION public.get_occupied_slots(inst_id INT, date_in DATE)
RETURNS TABLE (hora TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.expire_pending_reservas();
  RETURN QUERY
  SELECT to_char(r.hora::time, 'HH24:MI')
  FROM reservas r
  WHERE r.installation_id = inst_id
    AND r.fecha = date_in
    AND r.payment_status IN ('pending', 'paid');
END;
$$;
REVOKE ALL ON FUNCTION public.get_occupied_slots(INT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(INT, DATE) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────
-- 7. CREAR RESERVA (atómica: o se crea todo, o nada)
--    p_material: [{"id": 3, "qty": 2}, ...]
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_booking(
  p_inst INT,
  p_fecha DATE,
  p_horas TEXT[],
  p_material JSONB DEFAULT '[]'::JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid        UUID := auth.uid();
  inst       RECORD;
  horas      TEXT[];
  h          TEXT;
  parent_id  BIGINT;
  item       JSONB;
  allowed    TEXT[] := ARRAY['09:00','10:00','11:00','12:00','13:00','16:00','17:00','18:00','19:00','20:00','21:00'];
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Inicia sesión para reservar.' USING ERRCODE = '42501';
  END IF;

  PERFORM public.expire_pending_reservas();

  IF EXISTS (SELECT 1 FROM reservas WHERE user_id = uid AND payment_status = 'pending') THEN
    RAISE EXCEPTION 'Ya tienes una reserva pendiente de pago. Págala o cancélala antes de hacer otra.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO inst FROM instalaciones WHERE id = p_inst;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La pista no existe.' USING ERRCODE = 'P0002';
  END IF;
  IF coalesce(inst.estado, 'disponible') <> 'disponible' THEN
    RAISE EXCEPTION 'Esta pista no se puede reservar ahora mismo (%).', inst.estado USING ERRCODE = 'P0001';
  END IF;

  SELECT array_agg(DISTINCT x ORDER BY x) INTO horas FROM unnest(p_horas) AS x;
  IF horas IS NULL OR array_length(horas, 1) = 0 THEN
    RAISE EXCEPTION 'Elige al menos una franja.' USING ERRCODE = '22023';
  END IF;
  IF array_length(horas, 1) > 6 THEN
    RAISE EXCEPTION 'Puedes reservar como máximo 6 franjas a la vez.' USING ERRCODE = '22023';
  END IF;
  IF p_fecha > CURRENT_DATE + 60 THEN
    RAISE EXCEPTION 'Solo se puede reservar con 60 días de antelación como máximo.' USING ERRCODE = '22023';
  END IF;
  FOREACH h IN ARRAY horas LOOP
    IF NOT (h = ANY (allowed)) THEN
      RAISE EXCEPTION 'Franja no válida: %', h USING ERRCODE = '22023';
    END IF;
    IF public.reserva_inicio(p_fecha, h::TIME) <= now() THEN
      RAISE EXCEPTION 'La franja de las % ya ha pasado.', h USING ERRCODE = '22023';
    END IF;
  END LOOP;

  PERFORM set_config('kore.trusted', 'on', true);
  BEGIN
    INSERT INTO reservas (user_id, installation_id, fecha, hora, precio_cents, currency, payment_status)
    VALUES (uid, p_inst, p_fecha, horas[1]::TIME, inst.precio_hora_cents * array_length(horas, 1), 'eur', 'pending')
    RETURNING id INTO parent_id;

    IF array_length(horas, 1) > 1 THEN
      INSERT INTO reservas (user_id, installation_id, fecha, hora, precio_cents, currency, payment_status)
      SELECT uid, p_inst, p_fecha, x::TIME, 0, 'linked_' || parent_id, 'pending'
      FROM unnest(horas[2:]) AS x;
    END IF;
  EXCEPTION WHEN unique_violation THEN
    PERFORM set_config('kore.trusted', '', true);
    RAISE EXCEPTION 'Alguna de las franjas se acaba de ocupar. Elige otra hora.' USING ERRCODE = '23505';
  END;

  FOR item IN SELECT * FROM jsonb_array_elements(coalesce(p_material, '[]'::JSONB)) LOOP
    IF (item ->> 'qty')::INT > 0 THEN
      INSERT INTO reserva_material (reserva_id, inventario_id, cantidad)
      VALUES (parent_id, (item ->> 'id')::INT, LEAST((item ->> 'qty')::INT, 20));
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM reserva_material WHERE reserva_id = parent_id) THEN
    PERFORM public.reserve_inventory_for_reserva(parent_id);
  END IF;

  PERFORM set_config('kore.trusted', '', true);
  RETURN parent_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_booking(INT, DATE, TEXT[], JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(INT, DATE, TEXT[], JSONB) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────
-- 8. CANCELAR RESERVA PENDIENTE (las pagadas se cancelan con reembolso
--    desde la edge function cancel-booking)
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_booking(p_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r        RECORD;
  staff    BOOLEAN := coalesce(public.user_role(), '') IN ('admin', 'conserje');
  pid      BIGINT;
BEGIN
  SELECT * INTO r FROM reservas WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva no encontrada.' USING ERRCODE = 'P0002';
  END IF;
  -- Si es una franja enlazada, se cancela la reserva completa
  IF r.currency LIKE 'linked\_%' THEN
    pid := substring(r.currency FROM 8)::BIGINT;
    SELECT * INTO r FROM reservas WHERE id = pid;
  END IF;
  IF r.user_id <> auth.uid() AND NOT staff THEN
    RAISE EXCEPTION 'Reserva no encontrada.' USING ERRCODE = '42501';
  END IF;
  IF r.payment_status = 'paid' THEN
    RAISE EXCEPTION 'requires_refund' USING ERRCODE = 'P0001';
  END IF;
  IF r.payment_status <> 'pending' THEN
    RETURN r.payment_status; -- ya estaba cancelada
  END IF;

  PERFORM set_config('kore.trusted', 'on', true);
  UPDATE reservas SET payment_status = 'cancelled'
  WHERE (id = r.id OR currency = 'linked_' || r.id) AND payment_status = 'pending';
  UPDATE payments SET status = 'cancelled', updated_at = now()
  WHERE reserva_id = r.id AND status IN ('created', 'pending');
  PERFORM set_config('kore.trusted', '', true);
  RETURN 'cancelled';
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_booking(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking(BIGINT) TO authenticated;


-- ────────────────────────────────────────────────────────────────────────
-- 9. PAGO CONFIRMADO / REEMBOLSO (solo backend: webhook y edge functions)
--    Marca la reserva principal y todas sus franjas enlazadas a la vez.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_booking_paid(p_id BIGINT, p_intent TEXT, p_session TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  st TEXT;
BEGIN
  SELECT payment_status INTO st FROM reservas WHERE id = p_id FOR UPDATE;
  IF st = 'paid' THEN RETURN TRUE; END IF;      -- idempotente
  IF st IS DISTINCT FROM 'pending' THEN RETURN FALSE; END IF; -- caducada/cancelada: hay que reembolsar

  PERFORM set_config('kore.trusted', 'on', true);
  UPDATE reservas
  SET payment_status = 'paid',
      paid_at = now(),
      stripe_payment_intent_id = coalesce(p_intent, stripe_payment_intent_id),
      stripe_checkout_session_id = coalesce(p_session, stripe_checkout_session_id)
  WHERE id = p_id;
  UPDATE reservas SET payment_status = 'paid', paid_at = now()
  WHERE currency = 'linked_' || p_id AND payment_status = 'pending';
  UPDATE payments SET status = 'paid', updated_at = now()
  WHERE reserva_id = p_id AND (payment_intent_id = p_intent OR checkout_session_id = p_session OR status IN ('created', 'pending'));
  PERFORM set_config('kore.trusted', '', true);
  RETURN TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_booking_paid(BIGINT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_booking_paid(BIGINT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_booking_refunded(p_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('kore.trusted', 'on', true);
  UPDATE reservas SET payment_status = 'refunded'
  WHERE (id = p_id OR currency = 'linked_' || p_id) AND payment_status = 'paid';
  UPDATE payments SET status = 'refunded', updated_at = now()
  WHERE reserva_id = p_id AND status = 'paid';
  PERFORM set_config('kore.trusted', '', true);
END;
$$;
REVOKE ALL ON FUNCTION public.mark_booking_refunded(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_booking_refunded(BIGINT) TO service_role;


-- ────────────────────────────────────────────────────────────────────────
-- 10. El personal (admin/conserje) puede ver todos los perfiles básicos
--     para la gestión de reservas (antes solo admin).
-- ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff_view_profiles" ON public.profiles;
CREATE POLICY "staff_view_profiles" ON public.profiles
  FOR SELECT USING (public.user_role() IN ('admin', 'conserje'));

COMMIT;
