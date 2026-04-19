-- Fix: sync_wish_reservation must run as SECURITY DEFINER.
--
-- The trigger fires when *any* user inserts/deletes a reservation.
-- By default (SECURITY INVOKER) the UPDATE on wishes runs as that user,
-- which is blocked by the wishes_own_write RLS policy when the reserver
-- is not the wishlist owner. SECURITY DEFINER makes it run as the function
-- owner (postgres / superuser) and bypasses RLS.

CREATE OR REPLACE FUNCTION public.sync_wish_reservation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wishes SET is_reserved = TRUE  WHERE id = NEW.wish_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wishes SET is_reserved = FALSE WHERE id = OLD.wish_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Backfill: any wish that already has a reservation row but is_reserved = false
UPDATE public.wishes
SET is_reserved = TRUE
WHERE is_reserved = FALSE
  AND id IN (SELECT DISTINCT wish_id FROM public.reservations);
