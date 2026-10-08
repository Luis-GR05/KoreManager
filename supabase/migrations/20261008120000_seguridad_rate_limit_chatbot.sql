-- ════════════════════════════════════════════════════════════════════════
-- KoreManager · Migración 2026-10-08
-- Seguridad (RLS + triggers), limitación de peticiones y asistente "Kore".
-- Sustituye la generación de avatares con IA (tabla tareas_ia).
--
-- Cómo aplicarla:
--   · Supabase Dashboard → SQL Editor → pegar y ejecutar, o
--   · CLI: `supabase db push` (el archivo está en supabase/migrations/)
--
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────────
-- 0. ¿Quién hace la petición?
--    Privilegiado = backend con service_role, sesiones internas de Supabase
--    (SQL Editor, Auth) o un usuario con rol admin.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_privileged()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.role(), '') = 'service_role'
      OR session_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin')
      OR coalesce(public.user_role(), '') = 'admin';
$$;

REVOKE ALL ON FUNCTION public.is_privileged() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privileged() TO authenticated, service_role;


-- ────────────────────────────────────────────────────────────────────────
-- 1. Endurecer search_path de las funciones SECURITY DEFINER existentes
--    (evita secuestro de funciones vía search_path; aviso del linter)
-- ────────────────────────────────────────────────────────────────────────
ALTER FUNCTION public.user_role()                                  SET search_path = public;
ALTER FUNCTION public.handle_new_user()                            SET search_path = public;
ALTER FUNCTION public.get_occupied_slots(INT, DATE)                SET search_path = public;
ALTER FUNCTION public.reserve_inventory_for_reserva(BIGINT)        SET search_path = public;
ALTER FUNCTION public.restore_inventory_for_reserva(BIGINT)        SET search_path = public;
ALTER FUNCTION public.trg_restore_inventory_on_reserva_delete()    SET search_path = public;


-- ────────────────────────────────────────────────────────────────────────
-- 2. LIMITACIÓN DE PETICIONES (ventana fija)
--    Tabla sin políticas RLS: solo accesible desde funciones SECURITY
--    DEFINER y desde el backend (service_role).
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket        TEXT        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  hits          INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

/**
 * Suma una petición al contador `p_bucket` y devuelve si está permitida.
 * Uso desde edge functions:  supabaseAdmin.rpc('hit_rate_limit', {...})
 */
CREATE OR REPLACE FUNCTION public.hit_rate_limit(
  p_bucket TEXT,
  p_max INT,
  p_window_seconds INT
)
RETURNS TABLE (allowed BOOLEAN, remaining INT, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );
  v_hits INT;
BEGIN
  INSERT INTO rate_limits (bucket, window_start, hits)
  VALUES (p_bucket, v_window, 1)
  ON CONFLICT (bucket, window_start)
  DO UPDATE SET hits = rate_limits.hits + 1
  RETURNING rate_limits.hits INTO v_hits;

  -- Limpieza oportunista de ventanas antiguas (~1 % de las llamadas)
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '2 days';
  END IF;

  RETURN QUERY SELECT
    v_hits <= p_max,
    greatest(p_max - v_hits, 0),
    v_window + make_interval(secs => p_window_seconds);
END;
$$;

-- Solo el backend puede llamarla (si la expusiéramos, un usuario podría
-- inflar el contador de otro y bloquearle).
REVOKE ALL ON FUNCTION public.hit_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(TEXT, INT, INT) TO service_role;


-- ────────────────────────────────────────────────────────────────────────
-- 3. PERFILES
--    · FALLO CRÍTICO CORREGIDO: la política own_profile_update permitía a
--      cualquier usuario cambiar su propio rol_id y hacerse admin.
--    · Validación en servidor (DNI/NIE con letra, CP, edad, teléfono...)
-- ────────────────────────────────────────────────────────────────────────

-- DNI/NIE con letra de control (módulo 23)
CREATE OR REPLACE FUNCTION public.dni_valido(p TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v TEXT := upper(regexp_replace(coalesce(p, ''), '[\s.-]', '', 'g'));
  n TEXT;
BEGIN
  IF v !~ '^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$' THEN
    RETURN FALSE;
  END IF;
  n := translate(substr(v, 1, 8), 'XYZ', '012');
  RETURN substr('TRWAGMYFPDXBNJZSQVHLCKE', (n::BIGINT % 23)::INT + 1, 1) = right(v, 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  privileged BOOLEAN := public.is_privileged();
BEGIN
  -- Normalización
  NEW.dni            := upper(regexp_replace(coalesce(NEW.dni, ''), '[\s.-]', '', 'g'));
  NEW.full_name      := btrim(regexp_replace(coalesce(NEW.full_name, ''), '\s+', ' ', 'g'));
  NEW.telefono       := regexp_replace(coalesce(NEW.telefono, ''), '[\s().-]', '', 'g');
  NEW.codigo_postal  := btrim(coalesce(NEW.codigo_postal, ''));
  NEW.email          := lower(btrim(coalesce(NEW.email, '')));

  IF TG_OP = 'INSERT' THEN
    -- Nadie se auto‑asigna un rol al crear su perfil
    IF NOT privileged THEN
      NEW.rol_id := 3; -- ciudadano
    END IF;
  ELSE
    IF NOT privileged THEN
      IF NEW.rol_id IS DISTINCT FROM OLD.rol_id THEN
        RAISE EXCEPTION 'No tienes permiso para cambiar el rol.' USING ERRCODE = '42501';
      END IF;
      -- Campos que el usuario no puede tocar
      NEW.id         := OLD.id;
      NEW.email      := OLD.email;
      NEW.created_at := OLD.created_at;
    END IF;
  END IF;

  -- Validaciones (solo sobre lo que cambia, para no bloquear perfiles antiguos)
  IF TG_OP = 'INSERT' OR NEW.dni IS DISTINCT FROM OLD.dni THEN
    IF NOT public.dni_valido(NEW.dni) THEN
      RAISE EXCEPTION 'El DNI/NIE no es válido: la letra no corresponde al número.' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    IF length(NEW.full_name) < 3 OR length(NEW.full_name) > 80 THEN
      RAISE EXCEPTION 'El nombre debe tener entre 3 y 80 caracteres.' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.telefono IS DISTINCT FROM OLD.telefono THEN
    IF NEW.telefono !~ '^\+?[0-9]{9,15}$' THEN
      RAISE EXCEPTION 'El teléfono no es válido.' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR NEW.codigo_postal IS DISTINCT FROM OLD.codigo_postal THEN
    IF NEW.codigo_postal !~ '^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$' THEN
      RAISE EXCEPTION 'El código postal no es válido.' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.fecha_nacimiento IS DISTINCT FROM OLD.fecha_nacimiento)
     AND NEW.fecha_nacimiento IS NOT NULL
     AND NEW.fecha_nacimiento <> DATE '1900-01-01' THEN
    IF NEW.fecha_nacimiento > (CURRENT_DATE - INTERVAL '14 years') THEN
      RAISE EXCEPTION 'Debes tener al menos 14 años para registrarte.' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_write ON public.profiles;
CREATE TRIGGER profiles_guard_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_write();

-- Políticas: añadimos WITH CHECK y una política de INSERT propia
-- (el hook useProfile hace upsert y sin ella fallaba por RLS).
DROP POLICY IF EXISTS "own_profile_update" ON public.profiles;
CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own_profile_insert" ON public.profiles;
CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ────────────────────────────────────────────────────────────────────────
-- 4. RESERVAS
--    · FALLO CORREGIDO: el usuario podía marcar sus reservas como pagadas
--      o tocar campos de Stripe desde el navegador.
--    · No se permiten reservas en fechas pasadas.
--    · Límite: 30 franjas creadas cada 10 minutos por usuario.
-- ────────────────────────────────────────────────────────────────────────
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
  IF public.is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT * INTO rl FROM public.hit_rate_limit('reservas:' || auth.uid()::TEXT, 30, 600);
    IF NOT rl.allowed THEN
      RAISE EXCEPTION 'Has creado demasiadas reservas seguidas. Inténtalo de nuevo en unos minutos.'
        USING ERRCODE = 'P0429';
    END IF;

    IF NEW.fecha < CURRENT_DATE THEN
      RAISE EXCEPTION 'No se puede reservar en una fecha pasada.' USING ERRCODE = '23514';
    END IF;

    NEW.user_id                     := auth.uid();
    NEW.payment_status              := 'pending';
    NEW.paid_at                     := NULL;
    NEW.stripe_checkout_session_id  := NULL;
    NEW.stripe_payment_intent_id    := NULL;
    NEW.precio_cents                := greatest(coalesce(NEW.precio_cents, 0), 0);
    -- El importe real lo recalculan las edge functions de pago en servidor.
    RETURN NEW;
  END IF;

  -- UPDATE: solo se permite cambiar payment_status de forma controlada
  IF NEW.user_id                    IS DISTINCT FROM OLD.user_id
     OR NEW.installation_id         IS DISTINCT FROM OLD.installation_id
     OR NEW.fecha                   IS DISTINCT FROM OLD.fecha
     OR NEW.hora                    IS DISTINCT FROM OLD.hora
     OR NEW.precio_cents            IS DISTINCT FROM OLD.precio_cents
     OR NEW.currency                IS DISTINCT FROM OLD.currency
     OR NEW.paid_at                 IS DISTINCT FROM OLD.paid_at
     OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
     OR NEW.stripe_payment_intent_id   IS DISTINCT FROM OLD.stripe_payment_intent_id THEN
    RAISE EXCEPTION 'No puedes modificar estos datos de la reserva.' USING ERRCODE = '42501';
  END IF;

  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    IF NEW.payment_status = 'cancelled' AND OLD.payment_status = 'pending' THEN
      RETURN NEW; -- cancelar una reserva pendiente propia
    END IF;

    -- Franjas enlazadas (currency = 'linked_<id>'): pueden copiar el estado
    -- de su reserva principal, siempre que sea del mismo usuario.
    IF OLD.currency LIKE 'linked\_%' THEN
      parent_id := nullif(substring(OLD.currency FROM 8), '')::INT;
      SELECT payment_status INTO parent_status
      FROM reservas WHERE id = parent_id AND user_id = OLD.user_id;
      IF parent_status IS NOT NULL AND NEW.payment_status = parent_status THEN
        RETURN NEW;
      END IF;
    END IF;

    RAISE EXCEPTION 'El estado del pago solo lo puede cambiar el sistema de cobros.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservas_guard_write ON public.reservas;
CREATE TRIGGER reservas_guard_write
  BEFORE INSERT OR UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.guard_reserva_write();


-- ────────────────────────────────────────────────────────────────────────
-- 5. INVENTARIO
--    · reserve_inventory_for_reserva: solo sobre reservas propias.
--    · restore_inventory_for_reserva: ya no se puede llamar desde el
--      navegador (permitía inflar el stock llamándola varias veces).
--      La sigue usando el trigger de borrado de reservas.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_reserva(reserva_id_in BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  IF NOT public.is_privileged() AND NOT EXISTS (
    SELECT 1 FROM reservas WHERE id = reserva_id_in AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Reserva no encontrada.' USING ERRCODE = '42501';
  END IF;

  FOR rec IN
    SELECT inventario_id, SUM(cantidad)::INT AS qty
    FROM reserva_material
    WHERE reserva_id = reserva_id_in
    GROUP BY inventario_id
  LOOP
    PERFORM 1 FROM inventario i WHERE i.id = rec.inventario_id FOR UPDATE;

    IF NOT EXISTS (
      SELECT 1 FROM inventario i
      WHERE i.id = rec.inventario_id
        AND COALESCE(i.cantidad, 0) >= rec.qty
    ) THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    UPDATE inventario
    SET cantidad = GREATEST(0, COALESCE(cantidad, 0) - rec.qty)
    WHERE id = rec.inventario_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_inventory_for_reserva(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_inventory_for_reserva(BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.restore_inventory_for_reserva(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_inventory_for_reserva(BIGINT) TO service_role;


-- ────────────────────────────────────────────────────────────────────────
-- 6. LOGROS: un usuario solo puede desbloquear logros que ha ganado
-- ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "own_logros_insert" ON public.user_logros;
CREATE POLICY "own_logros_insert" ON public.user_logros
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT count(*) FROM public.reservas r
      WHERE r.user_id = auth.uid() AND r.fecha < CURRENT_DATE
    ) >= (
      SELECT l.threshold FROM public.logros l WHERE l.id = logro_id
    )
  );


-- ────────────────────────────────────────────────────────────────────────
-- 7. STORAGE · avatares
--    Antes cualquier usuario autenticado podía sobrescribir o borrar el
--    avatar de otro. Ahora cada uno solo escribe en su carpeta <uid>/.
--    Además: máximo 2 MB y solo imágenes.
-- ────────────────────────────────────────────────────────────────────────
UPDATE storage.buckets
SET file_size_limit    = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

DROP POLICY IF EXISTS "Avatar Auth Insert"  ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Update"  ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Delete"  ON storage.objects;
DROP POLICY IF EXISTS "Avatar Owner Insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Owner Delete" ON storage.objects;

CREATE POLICY "Avatar Owner Insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Avatar Owner Update" ON storage.objects
  FOR UPDATE TO authenticated
  USING      (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "Avatar Owner Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);


-- ────────────────────────────────────────────────────────────────────────
-- 8. ADIÓS A LA GENERACIÓN DE AVATARES CON IA
--    ⚠️ Borra la tabla tareas_ia y su historial (no afecta a los avatares
--    ya guardados en Storage ni a profiles.avatar_url).
-- ────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tareas_ia'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.tareas_ia;
  END IF;
END $$;

DROP TABLE IF EXISTS public.tareas_ia CASCADE;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- Comprobaciones rápidas (opcionales, ejecutar como usuario normal desde
-- la app o con `set local role authenticated` + claims):
--   update profiles set rol_id = 1 where id = auth.uid();   -- debe fallar
--   update reservas set payment_status = 'paid' where id = X; -- debe fallar
-- ════════════════════════════════════════════════════════════════════════
