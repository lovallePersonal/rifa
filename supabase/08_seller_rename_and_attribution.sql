-- =============================================================================
-- Rifa — migracion: rename de vendedor (Felipe -> Jaco) + atribucion por venta
-- RUN ORDER: aplicar DESPUES de 07_reserve_multi en instalaciones nuevas; en la
-- base viva (DEV) pegar este archivo en el SQL editor de Supabase y ejecutarlo.
-- Idempotente: se puede ejecutar mas de una vez sin romper.
-- NO se ejecuta automaticamente: la DB esta viva y se aplica a mano.
-- Este archivo ES la migracion para la base viva (live DB).
-- =============================================================================

-- 1) Permitir 'Jaco','Pipe' en el CHECK de sold_by (reemplaza Felipe).
--    El nombre del constraint lo asigna Postgres automaticamente al declararlo
--    inline en 01_schema (tickets_sold_by_check). Lo recreamos de forma guiada.
--    NOTA: antes de correr en la base viva, confirmar el nombre real del
--    constraint (p. ej. con \d public.tickets) por si una edicion previa lo
--    nombro distinto; ajustar el DROP CONSTRAINT IF EXISTS si fuera necesario.
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_sold_by_check;
-- Migrar datos existentes ANTES de re-agregar el CHECK, para no violar la nueva regla.
UPDATE public.tickets SET sold_by = 'Jaco' WHERE sold_by = 'Felipe';
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_sold_by_check CHECK (sold_by IN ('Jaco', 'Pipe'));

-- 2) Eliminar el overload viejo de 4 args para evitar ambiguedad de firma.
DROP FUNCTION IF EXISTS public.reserve_tickets(int[], text, text, text);

-- 3) Crear/reemplazar reserve_tickets con el 5o argumento p_sold_by.
--    (Cuerpo identico a 07_reserve_multi tras esta migracion: validacion de
--     p_sold_by -> solo 'Jaco'|'Pipe', safe-default 'Jaco'; resto sin cambios.)
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_numbers int[],
  p_name    text,
  p_phone   text,
  p_email   text,
  p_sold_by text
)
RETURNS TABLE (success boolean, conflicts int[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unique    int[];
  v_locked    int;
  v_available int;
  v_conflicts int[];
  v_sold_by   text;
BEGIN
  -- Validar/normalizar el vendedor: solo 'Jaco' o 'Pipe' son validos.
  -- Cualquier otro valor o NULL cae por defecto a 'Jaco', de modo que
  -- un parametro manipulado desde el cliente NO puede romper la venta
  -- ni inyectar un vendedor invalido (ademas del CHECK de la tabla).
  IF p_sold_by = 'Pipe' THEN
    v_sold_by := 'Pipe';
  ELSE
    v_sold_by := 'Jaco';
  END IF;

  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN QUERY SELECT false, ARRAY[]::int[];
    RETURN;
  END IF;

  SELECT array_agg(DISTINCT n ORDER BY n) INTO v_unique
  FROM unnest(p_numbers) AS n;

  IF EXISTS (SELECT 1 FROM unnest(v_unique) AS n WHERE n < 1 OR n > 999) THEN
    RETURN QUERY SELECT false, ARRAY[]::int[];
    RETURN;
  END IF;

  SELECT count(*) INTO v_locked
  FROM (
    SELECT number FROM public.tickets
    WHERE number = ANY(v_unique)
    ORDER BY number
    FOR UPDATE
  ) AS locked;

  SELECT count(*) INTO v_available
  FROM public.tickets
  WHERE number = ANY(v_unique)
    AND status = 'available';

  IF v_available <> array_length(v_unique, 1) THEN
    SELECT array_agg(n ORDER BY n) INTO v_conflicts
    FROM unnest(v_unique) AS n
    WHERE n NOT IN (
      SELECT number FROM public.tickets
      WHERE number = ANY(v_unique) AND status = 'available'
    );
    RETURN QUERY SELECT false, COALESCE(v_conflicts, ARRAY[]::int[]);
    RETURN;
  END IF;

  UPDATE public.tickets
  SET status      = 'reserved',
      buyer_name  = p_name,
      buyer_phone = p_phone,
      buyer_email = p_email,
      sold_by     = v_sold_by,
      reserved_at = now(),
      updated_at  = now()
  WHERE number = ANY(v_unique)
    AND status = 'available';

  RETURN QUERY SELECT true, ARRAY[]::int[];
END;
$$;

-- 4) Mismo patron REVOKE/GRANT que el resto de RPCs (anon + authenticated).
REVOKE EXECUTE ON FUNCTION public.reserve_tickets(int[], text, text, text, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.reserve_tickets(int[], text, text, text, text) TO anon, authenticated;
