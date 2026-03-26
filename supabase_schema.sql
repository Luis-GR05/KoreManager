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
  email      TEXT,
  full_name  TEXT,
  telefono   TEXT,
  rol_id     INT REFERENCES roles(id) DEFAULT 3, -- 3 = ciudadano
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- 3. TRIGGER: crear perfil automáticamente al registrarse
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
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
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (installation_id, fecha, hora) -- evita doble reserva
);


-- ─────────────────────────────────────────────
-- 6. INVENTARIO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id       SERIAL PRIMARY KEY,
  nombre   TEXT NOT NULL,
  cantidad INT  DEFAULT 0,
  estado   TEXT DEFAULT 'activo'
);

INSERT INTO inventario (nombre, cantidad) VALUES
  ('Pelotas de Pádel', 24),
  ('Redes',             4),
  ('Conos',            20),
  ('Chalecos',         15),
  ('Pelotas de Fútbol', 8)
ON CONFLICT DO NOTHING;


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
ALTER TABLE inventario   ENABLE ROW LEVEL SECURITY;
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
