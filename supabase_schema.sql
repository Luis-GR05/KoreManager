-- =============================================
-- KORE MANAGER — Supabase Database Schema
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- ─────────────────────────────────────────────
-- 1. TABLA DE ROLES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

INSERT INTO roles (nombre) VALUES
  ('admin'),
  ('conserje'),
  ('ciudadano')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────
-- 2. PERFILES DE USUARIO (espejo de auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  telefono   TEXT NOT NULL,
  dni               TEXT NOT NULL,
  fecha_nacimiento  DATE NOT NULL,
  direccion         TEXT NOT NULL,
  codigo_postal     TEXT NOT NULL,
  municipio         TEXT NOT NULL,
  provincia         TEXT NOT NULL,
  avatar_url        TEXT,
  rol_id     INT REFERENCES roles(id) DEFAULT 3, -- 3 = ciudadano
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migración si `profiles` ya existe (añade columnas, rellena y endurece constraints)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dni              TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS direccion        TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal    TEXT,
  ADD COLUMN IF NOT EXISTS municipio        TEXT,
  ADD COLUMN IF NOT EXISTS provincia        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url       TEXT;

-- Backfill desde auth.users metadata (si existe)
UPDATE profiles p
SET
  email = COALESCE(p.email, u.email, ''),
  full_name = COALESCE(NULLIF(p.full_name, ''), u.raw_user_meta_data ->> 'full_name', ''),
  telefono = COALESCE(NULLIF(p.telefono, ''), u.raw_user_meta_data ->> 'phone', ''),
  dni = COALESCE(NULLIF(p.dni, ''), u.raw_user_meta_data ->> 'dni', '00000000T'),
  fecha_nacimiento = COALESCE(p.fecha_nacimiento, NULLIF(u.raw_user_meta_data ->> 'fecha_nacimiento', '')::date, DATE '1900-01-01'),
  direccion = COALESCE(NULLIF(p.direccion, ''), u.raw_user_meta_data ->> 'direccion', ''),
  codigo_postal = COALESCE(NULLIF(p.codigo_postal, ''), u.raw_user_meta_data ->> 'codigo_postal', '00000'),
  municipio = COALESCE(NULLIF(p.municipio, ''), u.raw_user_meta_data ->> 'municipio', ''),
  provincia = COALESCE(NULLIF(p.provincia, ''), u.raw_user_meta_data ->> 'provincia', '')
FROM auth.users u
WHERE u.id = p.id;

-- Limpieza: asegurar que los datos cumplen los CHECK antes de crearlos
-- (evita errores al ejecutar migraciones en proyectos ya poblados)
UPDATE profiles
SET codigo_postal = '00000'
WHERE codigo_postal IS NULL OR codigo_postal !~ '^[0-9]{5}$';

UPDATE profiles
SET dni = '00000000T'
WHERE dni IS NULL OR upper(trim(dni)) !~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$';

-- Limpieza de campos no vacíos (si hay usuarios antiguos sin datos)
UPDATE profiles
SET full_name = 'Pendiente'
WHERE full_name IS NULL OR length(trim(full_name)) = 0;

UPDATE profiles
SET telefono = '000000000'
WHERE telefono IS NULL OR length(trim(telefono)) = 0;

UPDATE profiles
SET direccion = 'Pendiente'
WHERE direccion IS NULL OR length(trim(direccion)) = 0;

UPDATE profiles
SET municipio = 'Pendiente'
WHERE municipio IS NULL OR length(trim(municipio)) = 0;

UPDATE profiles
SET provincia = 'Pendiente'
WHERE provincia IS NULL OR length(trim(provincia)) = 0;

-- Endurecer NOT NULL (obligatorios)
ALTER TABLE profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN telefono SET NOT NULL,
  ALTER COLUMN dni SET NOT NULL,
  ALTER COLUMN fecha_nacimiento SET NOT NULL,
  ALTER COLUMN direccion SET NOT NULL,
  ALTER COLUMN codigo_postal SET NOT NULL,
  ALTER COLUMN municipio SET NOT NULL,
  ALTER COLUMN provincia SET NOT NULL;

-- Validaciones básicas (España)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_codigo_postal_chk,
  DROP CONSTRAINT IF EXISTS profiles_dni_chk,
  DROP CONSTRAINT IF EXISTS profiles_fecha_nacimiento_chk,
  DROP CONSTRAINT IF EXISTS profiles_nonempty_chk;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_codigo_postal_chk CHECK (codigo_postal ~ '^[0-9]{5}$'),
  ADD CONSTRAINT profiles_dni_chk CHECK (upper(trim(dni)) ~ '^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$'),
  ADD CONSTRAINT profiles_fecha_nacimiento_chk CHECK (fecha_nacimiento <= CURRENT_DATE),
  ADD CONSTRAINT profiles_nonempty_chk CHECK (
    length(trim(full_name)) > 0 AND
    length(trim(telefono)) > 0 AND
    length(trim(direccion)) > 0 AND
    length(trim(municipio)) > 0 AND
    length(trim(provincia)) > 0
  );


-- ─────────────────────────────────────────────
-- 3. TRIGGER: crear perfil automáticamente al registrarse
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, telefono,
    dni, fecha_nacimiento, direccion, codigo_postal, municipio, provincia
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'dni', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'fecha_nacimiento', '')::date, DATE '1900-01-01'),
    COALESCE(NEW.raw_user_meta_data ->> 'direccion', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'codigo_postal', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'municipio', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'provincia', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────
-- 4. INSTALACIONES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instalaciones (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo   TEXT,
  -- 'disponible' | 'mantenimiento' | 'ocupada'
  estado TEXT DEFAULT 'disponible'
);

-- Limpieza de duplicados (por nombre) + constraint UNIQUE para evitar repeticiones
-- 1) Normaliza nombres (trim)
UPDATE instalaciones SET nombre = trim(nombre) WHERE nombre IS NOT NULL;

-- (Limpieza de duplicados movida después de crear la tabla reservas)

INSERT INTO instalaciones (nombre, tipo, estado) VALUES
  ('Pista 1 - Pádel',   'padel',       'disponible'),
  ('Pista 2 - Pádel',   'padel',       'disponible'),
  ('Pista Fútbol 7',    'futbol',      'disponible'),
  ('Pista Baloncesto',  'baloncesto',  'disponible')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────
-- 5. RESERVAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id               SERIAL PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  installation_id  INT  REFERENCES instalaciones(id) ON DELETE CASCADE,
  fecha            DATE NOT NULL,
  hora             TIME NOT NULL,
  -- Pagos (Stripe)
  precio_cents     INT  NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'eur',
  payment_status   TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  paid_at          TIMESTAMPTZ,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (installation_id, fecha, hora) -- evita doble reserva
);

-- RPC segura: devuelve horarios ocupados sin exponer datos personales
CREATE OR REPLACE FUNCTION public.get_occupied_slots(inst_id INT, date_in DATE)
RETURNS TABLE (hora TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT to_char(r.hora::time, 'HH24:MI') AS hora
  FROM reservas r
  WHERE r.installation_id = inst_id
    AND r.fecha = date_in;
$$;

REVOKE ALL ON FUNCTION public.get_occupied_slots(INT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(INT, DATE) TO authenticated;

-- Migración: si la tabla ya existe
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS precio_cents INT,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Defaults / backfill
UPDATE reservas
SET
  precio_cents = COALESCE(precio_cents, 0),
  currency = COALESCE(currency, 'eur'),
  payment_status = COALESCE(payment_status, 'pending')
WHERE precio_cents IS NULL OR currency IS NULL OR payment_status IS NULL;

ALTER TABLE reservas
  ALTER COLUMN precio_cents SET NOT NULL,
  ALTER COLUMN precio_cents SET DEFAULT 0,
  ALTER COLUMN currency SET NOT NULL,
  ALTER COLUMN currency SET DEFAULT 'eur',
  ALTER COLUMN payment_status SET NOT NULL,
  ALTER COLUMN payment_status SET DEFAULT 'pending';

ALTER TABLE reservas
  DROP CONSTRAINT IF EXISTS reservas_payment_status_chk;
ALTER TABLE reservas
  ADD CONSTRAINT reservas_payment_status_chk CHECK (payment_status IN ('pending','paid','failed','refunded','cancelled'));

-- ─────────────────────────────────────────────
-- 5a. LIMPIEZA DE DUPLICADOS (Instalaciones y Reservas)
-- ─────────────────────────────────────────────
-- Reasigna reservas al ID "principal" (el menor id por nombre)
WITH canon AS (
  SELECT nombre, MIN(id) AS keep_id
  FROM instalaciones
  GROUP BY nombre
),
dups AS (
  SELECT i.id AS dup_id, c.keep_id
  FROM instalaciones i
  JOIN canon c ON c.nombre = i.nombre
  WHERE i.id <> c.keep_id
)
UPDATE reservas r
SET installation_id = d.keep_id
FROM dups d
WHERE r.installation_id = d.dup_id;

-- Borra instalaciones duplicadas (ya sin reservas apuntando a ellas)
WITH canon AS (
  SELECT nombre, MIN(id) AS keep_id
  FROM instalaciones
  GROUP BY nombre
)
DELETE FROM instalaciones i
USING canon c
WHERE i.nombre = c.nombre
  AND i.id <> c.keep_id;

-- Aplica UNIQUE(nombre) para que no vuelvan a aparecer duplicados
ALTER TABLE instalaciones
  DROP CONSTRAINT IF EXISTS instalaciones_nombre_uniq;
ALTER TABLE instalaciones
  ADD CONSTRAINT instalaciones_nombre_uniq UNIQUE (nombre);


-- ─────────────────────────────────────────────
-- 5b. PAYMENTS (registro de cobros)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id    INT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL DEFAULT 'stripe',
  amount_cents  INT  NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'eur',
  status        TEXT NOT NULL DEFAULT 'created', -- 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'
  checkout_session_id TEXT,
  payment_intent_id   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_status_chk;
ALTER TABLE payments
  ADD CONSTRAINT payments_status_chk CHECK (status IN ('created','pending','paid','failed','refunded','cancelled'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_reserva_id ON payments(reserva_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_reservas_payment_status ON reservas(payment_status);


-- ─────────────────────────────────────────────
-- 6. INVENTARIO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id       SERIAL PRIMARY KEY,
  nombre   TEXT NOT NULL,
  tipo_pista TEXT NOT NULL DEFAULT 'general', -- coincide con instalaciones.tipo (padel/futbol/tenis/...)
  cantidad INT  DEFAULT 0,
  estado   TEXT DEFAULT 'activo'
);

-- Migración: si la tabla ya existía sin tipo_pista (debe ir ANTES de usar la columna)
ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS tipo_pista TEXT;

UPDATE inventario
SET tipo_pista = COALESCE(NULLIF(lower(trim(tipo_pista)), ''), 'general')
WHERE tipo_pista IS NULL OR length(trim(tipo_pista)) = 0;

ALTER TABLE inventario
  ALTER COLUMN tipo_pista SET NOT NULL,
  ALTER COLUMN tipo_pista SET DEFAULT 'general';

-- Normalización + deduplicación (evita items repetidos por mayúsculas/espacios)
UPDATE inventario
SET nombre = trim(nombre)
WHERE nombre IS NOT NULL AND nombre <> trim(nombre);

UPDATE inventario
SET tipo_pista = lower(trim(tipo_pista))
WHERE tipo_pista IS NOT NULL AND tipo_pista <> lower(trim(tipo_pista));

-- Consolidar duplicados: mantener el id menor y sumar cantidades (por nombre+tipo).
-- (Si hay distintos estados, priorizamos 'activo' si alguno lo es; si no, cualquiera.)
WITH dups AS (
  SELECT
    lower(trim(nombre)) AS k_nombre,
    lower(trim(tipo_pista)) AS k_tipo,
    min(id) AS keep_id,
    array_agg(id ORDER BY id) AS ids,
    sum(coalesce(cantidad, 0)) AS total_cantidad,
    bool_or(estado = 'activo') AS any_activo
  FROM inventario
  GROUP BY lower(trim(nombre)), lower(trim(tipo_pista))
  HAVING count(*) > 1
),
upd AS (
  UPDATE inventario i
  SET
    cantidad = d.total_cantidad,
    estado = CASE WHEN d.any_activo THEN 'activo' ELSE coalesce(i.estado, 'activo') END
  FROM dups d
  WHERE i.id = d.keep_id
  RETURNING i.id
)
DELETE FROM inventario i
USING dups d
WHERE i.id <> d.keep_id
  AND i.id = ANY(d.ids);

-- Garantiza unicidad por (tipo_pista, nombre) normalizados (case-insensitive + trim)
DROP INDEX IF EXISTS inventario_nombre_unique;
CREATE UNIQUE INDEX IF NOT EXISTS inventario_tipo_nombre_unique
ON inventario (lower(trim(tipo_pista)), lower(trim(nombre)));

INSERT INTO inventario (nombre, cantidad) VALUES
  ('Pelotas de Pádel', 24),
  ('Redes',             4),
  ('Conos',            20),
  ('Chalecos',         15),
  ('Pelotas de Fútbol', 8)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 6.1. MATERIAL SOLICITADO EN RESERVAS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reserva_material (
  id            BIGSERIAL PRIMARY KEY,
  reserva_id    BIGINT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  inventario_id INT    NOT NULL REFERENCES inventario(id) ON DELETE RESTRICT,
  cantidad      INT    NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS reserva_material_unique
ON reserva_material(reserva_id, inventario_id);

CREATE INDEX IF NOT EXISTS idx_reserva_material_reserva_id ON reserva_material(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reserva_material_inventario_id ON reserva_material(inventario_id);

-- Bajar stock de inventario al crear material de una reserva (reserva activa).
-- Si no hay stock suficiente, lanza error y NO modifica nada.
CREATE OR REPLACE FUNCTION public.reserve_inventory_for_reserva(reserva_id_in BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT inventario_id, SUM(cantidad)::INT AS qty
    FROM reserva_material
    WHERE reserva_id = reserva_id_in
    GROUP BY inventario_id
  LOOP
    -- Lock row + validar stock
    PERFORM 1
    FROM inventario i
    WHERE i.id = rec.inventario_id
    FOR UPDATE;

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

-- Restaurar stock si se elimina una reserva (cancelación)
CREATE OR REPLACE FUNCTION public.restore_inventory_for_reserva(reserva_id_in BIGINT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE inventario i
  SET cantidad = COALESCE(i.cantidad, 0) + rm.qty
  FROM (
    SELECT inventario_id, SUM(cantidad)::INT AS qty
    FROM reserva_material
    WHERE reserva_id = reserva_id_in
    GROUP BY inventario_id
  ) rm
  WHERE i.id = rm.inventario_id;
$$;

REVOKE ALL ON FUNCTION public.restore_inventory_for_reserva(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_inventory_for_reserva(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_restore_inventory_on_reserva_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.restore_inventory_for_reserva(OLD.id);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS reservas_restore_inventory_before_delete ON reservas;
CREATE TRIGGER reservas_restore_inventory_before_delete
BEFORE DELETE ON reservas
FOR EACH ROW
EXECUTE FUNCTION public.trg_restore_inventory_on_reserva_delete();


-- ─────────────────────────────────────────────
-- 7. AVISOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS avisos (
  id         SERIAL PRIMARY KEY,
  titulo     TEXT NOT NULL,
  mensaje    TEXT,
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserva_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos       ENABLE ROW LEVEL SECURITY;

-- Helper para comprobar rol del usuario actual
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT r.nombre
  FROM profiles p
  JOIN roles r ON p.rol_id = r.id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- PROFILES
DROP POLICY IF EXISTS "own_profile_select"  ON profiles;
DROP POLICY IF EXISTS "own_profile_update"  ON profiles;
DROP POLICY IF EXISTS "admin_all_profiles"  ON profiles;

CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (public.user_role() = 'admin');


-- RESERVAS
DROP POLICY IF EXISTS "own_reservas"        ON reservas;
DROP POLICY IF EXISTS "staff_view_reservas" ON reservas;

CREATE POLICY "own_reservas" ON reservas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "staff_view_reservas" ON reservas
  FOR SELECT USING (public.user_role() IN ('admin', 'conserje'));

-- PAYMENTS
DROP POLICY IF EXISTS "own_payments"        ON payments;
DROP POLICY IF EXISTS "staff_view_payments" ON payments;

CREATE POLICY "own_payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "staff_view_payments" ON payments
  FOR SELECT USING (public.user_role() IN ('admin', 'conserje'));


-- INSTALACIONES
DROP POLICY IF EXISTS "all_see_instalaciones"    ON instalaciones;
DROP POLICY IF EXISTS "staff_manage_instalaciones" ON instalaciones;

CREATE POLICY "all_see_instalaciones" ON instalaciones
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staff_manage_instalaciones" ON instalaciones
  FOR ALL USING (public.user_role() IN ('admin', 'conserje'));


-- INVENTARIO
DROP POLICY IF EXISTS "all_see_inventario"    ON inventario;
DROP POLICY IF EXISTS "staff_manage_inventario" ON inventario;

CREATE POLICY "all_see_inventario" ON inventario
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "staff_manage_inventario" ON inventario
  FOR ALL USING (public.user_role() IN ('admin', 'conserje'));

-- RESERVA_MATERIAL
DROP POLICY IF EXISTS "own_reserva_material"         ON reserva_material;
DROP POLICY IF EXISTS "staff_view_reserva_material"  ON reserva_material;

-- El usuario puede gestionar material solo de sus reservas
CREATE POLICY "own_reserva_material" ON reserva_material
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id = reserva_material.reserva_id
        AND r.user_id = auth.uid()
    )
  );

-- Staff puede ver material de cualquier reserva
CREATE POLICY "staff_view_reserva_material" ON reserva_material
  FOR SELECT USING (public.user_role() IN ('admin', 'conserje'));


-- AVISOS
DROP POLICY IF EXISTS "all_see_avisos"    ON avisos;
DROP POLICY IF EXISTS "admin_manage_avisos" ON avisos;

CREATE POLICY "all_see_avisos" ON avisos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_manage_avisos" ON avisos
  FOR ALL USING (public.user_role() = 'admin');


-- ─────────────────────────────────────────────
-- 9. ÍNDICES de rendimiento
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reservas_user_id         ON reservas(user_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha           ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_installation_id ON reservas(installation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_rol_id          ON profiles(rol_id);


-- Nota: `handle_new_user()` ya está definida arriba con todos los campos obligatorios.


-- ─────────────────────────────────────────────
-- 10. LOGROS (sistema de gamificación)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logros (
  id          SERIAL PRIMARY KEY,
  codigo      TEXT UNIQUE NOT NULL,  -- 'primer_partido', 'diez_partidos' ...
  titulo      TEXT NOT NULL,
  descripcion TEXT,
  icono       TEXT,                  -- emoji representativo
  threshold   INT NOT NULL DEFAULT 1 -- nº de partidos necesarios
);

INSERT INTO logros (codigo, titulo, descripcion, icono, threshold) VALUES
  ('primer_partido',       '¡Primer Saque!', 'Completa tu primera reserva',   '🎾',  1),
  ('cinco_partidos',       'En Forma',        'Completa 5 reservas',           '💪',  5),
  ('diez_partidos',        'Habitual',        'Completa 10 reservas',          '🔥', 10),
  ('veinticinco_partidos', 'Veterano',        'Completa 25 reservas',          '⭐', 25),
  ('cincuenta_partidos',   'Leyenda',         'Completa 50 reservas',          '🏆', 50)
ON CONFLICT (codigo) DO NOTHING;


-- ─────────────────────────────────────────────
-- 11. RELACIÓN USUARIO ↔ LOGROS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_logros (
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  logro_id    INT  REFERENCES logros(id)     ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, logro_id)
);

-- RLS
ALTER TABLE logros      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_logros ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver el catálogo de logros
DROP POLICY IF EXISTS "all_see_logros" ON logros;
CREATE POLICY "all_see_logros" ON logros
  FOR SELECT USING (auth.role() = 'authenticated');

-- El usuario solo ve sus propios logros; admin ve todos
DROP POLICY IF EXISTS "own_logros_select" ON user_logros;
DROP POLICY IF EXISTS "own_logros_insert" ON user_logros;
DROP POLICY IF EXISTS "admin_all_logros"  ON user_logros;

CREATE POLICY "own_logros_select" ON user_logros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_logros_insert" ON user_logros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_all_logros" ON user_logros
  FOR ALL USING (public.user_role() = 'admin');

-- Índice de rendimiento
CREATE INDEX IF NOT EXISTS idx_user_logros_user_id  ON user_logros(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logros_logro_id ON user_logros(logro_id);

-- ─────────────────────────────────────────────
-- 12. TAREAS IA (Generación de Avatares)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tareas_ia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID REFERENCES auth.users(id) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  ruta_imagen_base TEXT NOT NULL,
  prompt_estilo TEXT NOT NULL,
  ruta_resultado TEXT,
  mensaje_error TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tareas_ia;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE tareas_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus tareas" ON tareas_ia;
CREATE POLICY "Usuarios gestionan sus tareas" ON tareas_ia
  FOR ALL USING (auth.uid() = id_usuario);

-- ─────────────────────────────────────────────
-- 13. STORAGE BUCKETS
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT DO NOTHING;

-- Políticas de Storage para el bucket 'avatars'
DROP POLICY IF EXISTS "Avatar Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Insert" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Auth Delete" ON storage.objects;

CREATE POLICY "Avatar Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Avatar Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');