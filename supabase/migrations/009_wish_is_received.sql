-- Add is_received flag to wishes.
-- "Mark as received" now soft-flags instead of hard-deleting,
-- preserving history and allowing the reserver to see the outcome.

ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS is_received BOOLEAN NOT NULL DEFAULT FALSE;

-- When a wish is marked received, automatically cancel any open reservation
-- so the reserver knows it's been taken care of.
CREATE OR REPLACE FUNCTION public.unreserve_on_received()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_received = TRUE AND OLD.is_received = FALSE THEN
    DELETE FROM public.reservations WHERE wish_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_unreserve_on_received
  AFTER UPDATE OF is_received ON public.wishes
  FOR EACH ROW EXECUTE FUNCTION public.unreserve_on_received();
