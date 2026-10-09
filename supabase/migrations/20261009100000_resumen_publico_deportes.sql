-- ════════════════════════════════════════════════════════════════════════
-- KoreManager · Migración 2026-10-09
-- Resumen público de deportes y pistas para la landing.
--
-- La tabla `instalaciones` solo la pueden leer usuarios con sesión. La landing
-- es pública y necesita saber qué deportes hay y cuántas pistas tiene cada uno
-- (el administrador puede añadir, editar o quitar pistas y deportes desde el
-- panel), así que exponemos SOLO un recuento agregado, sin nombres ni ids.
-- ════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.public_sports_summary()
RETURNS TABLE (tipo TEXT, pistas INT, disponibles INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(btrim(coalesce(nullif(tipo, ''), 'otros'))) AS tipo,
    count(*)::INT                                      AS pistas,
    (count(*) FILTER (WHERE estado = 'disponible'))::INT AS disponibles
  FROM instalaciones
  GROUP BY 1
  ORDER BY 2 DESC, 1;
$$;

REVOKE ALL ON FUNCTION public.public_sports_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_sports_summary() TO anon, authenticated, service_role;
