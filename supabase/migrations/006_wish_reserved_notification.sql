-- ============================================================
-- Wish It — Migration 006: wish_reserved notification type
-- ============================================================

-- Add meta column for storing extra context (wish title, etc.)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS meta JSONB;

-- Expand the type CHECK constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('friend_request', 'friend_accepted', 'wishlist_followed', 'wish_reserved'));

-- ── Trigger: wish reserved → notify wishlist owner ────────────
CREATE OR REPLACE FUNCTION public.notify_wish_reserved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_id    UUID;
  v_wish_title  TEXT;
  v_wishlist_id UUID;
BEGIN
  SELECT wl.user_id, w.title, wl.id
    INTO v_owner_id, v_wish_title, v_wishlist_id
    FROM public.wishes w
    JOIN public.wishlists wl ON wl.id = w.wishlist_id
   WHERE w.id = NEW.wish_id;

  -- Don't notify if the reserver IS the owner
  IF v_owner_id IS NOT NULL AND v_owner_id <> NEW.reserved_by THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id, meta)
    VALUES (
      v_owner_id,
      'wish_reserved',
      NEW.reserved_by,
      NEW.wish_id,
      jsonb_build_object(
        'wish_title',   v_wish_title,
        'wishlist_id',  v_wishlist_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_wish_reserved
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_wish_reserved();
