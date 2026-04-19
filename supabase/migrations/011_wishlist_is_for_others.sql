-- Add is_for_others flag and beneficiary_name to wishlists.
-- is_for_others is automatically true when type = 'on_behalf'.
-- beneficiary_name stores who the wishlist is being managed for.

ALTER TABLE public.wishlists
  ADD COLUMN IF NOT EXISTS is_for_others   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS beneficiary_name TEXT;

-- Keep is_for_others in sync with type
CREATE OR REPLACE FUNCTION public.sync_is_for_others()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_for_others := (NEW.type = 'on_behalf');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_is_for_others
  BEFORE INSERT OR UPDATE OF type ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.sync_is_for_others();

-- Backfill existing rows
UPDATE public.wishlists SET is_for_others = (type = 'on_behalf');
