-- =============================================================================
-- Rifa (raffle app) — reserva multiple atomica (anon RPC)
-- RUN ORDER: 01_schema -> 02_views -> 03_rls -> 04_functions -> 05_seed -> 06_auth_hook -> 07_reserve_multi
-- HOW TO RUN: pegar en el SQL editor de Supabase y ejecutar (despues de 04_functions).
-- NO ejecutar automaticamente contra la base: la DB esta viva y se aplica a mano.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- reserve_tickets: reserva en bloque, todo-o-nada. SECURITY DEFINER para
-- escribir en public.tickets a pesar de RLS, pero acotada: en una sola
-- transaccion bloquea (FOR UPDATE) todas las filas objetivo, verifica que
-- TODAS esten 'available' y, o bien las pasa todas a 'reserved' guardando
-- los datos del comprador, o no cambia nada y devuelve los numeros en conflicto.
--
-- Retorno (una fila):
--   success  boolean      -> true si TODAS se reservaron; false si hubo conflicto
--   conflicts int[]       -> numeros que no estaban disponibles (vacio si success)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_tickets(
  p_numbers int[],
  p_name    text,
  p_phone   text,
  p_email   text
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
BEGIN
  -- Validacion de entrada: arreglo no nulo, no vacio, y todos en rango 1..999.
  IF p_numbers IS NULL OR array_length(p_numbers, 1) IS NULL THEN
    RETURN QUERY SELECT false, ARRAY[]::int[];
    RETURN;
  END IF;

  -- Deduplicar y ordenar para un orden de bloqueo determinista (evita deadlocks).
  SELECT array_agg(DISTINCT n ORDER BY n) INTO v_unique
  FROM unnest(p_numbers) AS n;

  -- Rechazar si algun numero esta fuera de rango (coincide con el CHECK 1..999).
  IF EXISTS (SELECT 1 FROM unnest(v_unique) AS n WHERE n < 1 OR n > 999) THEN
    RETURN QUERY SELECT false, ARRAY[]::int[];
    RETURN;
  END IF;

  -- Bloquear TODAS las filas objetivo (FOR UPDATE) en orden determinista.
  SELECT count(*) INTO v_locked
  FROM (
    SELECT number FROM public.tickets
    WHERE number = ANY(v_unique)
    ORDER BY number
    FOR UPDATE
  ) AS locked;

  -- Contar cuantas de las bloqueadas estan disponibles.
  SELECT count(*) INTO v_available
  FROM public.tickets
  WHERE number = ANY(v_unique)
    AND status = 'available';

  -- Si no todas las solicitadas estan disponibles -> conflicto, no cambiar nada.
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

  -- Todas disponibles: reservarlas en bloque.
  UPDATE public.tickets
  SET status      = 'reserved',
      buyer_name  = p_name,
      buyer_phone = p_phone,
      buyer_email = p_email,
      reserved_at = now(),
      updated_at  = now()
  WHERE number = ANY(v_unique)
    AND status = 'available';

  RETURN QUERY SELECT true, ARRAY[]::int[];
END;
$$;

-- Cerrar ejecucion por defecto y conceder solo a los roles de la app
-- (mismo patron exacto que reserve_ticket en 04_functions.sql).
REVOKE EXECUTE ON FUNCTION public.reserve_tickets(int[], text, text, text) FROM public;
GRANT  EXECUTE ON FUNCTION public.reserve_tickets(int[], text, text, text) TO anon, authenticated;
