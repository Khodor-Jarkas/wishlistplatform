-- ============================================================
-- Wish It — Migration 005: Social Features
-- Adds: notifications table + triggers, activity feed table
-- ============================================================

-- ── 1. Notifications ──────────────────────────────────────────
CREATE TABLE public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'wishlist_followed')),
  actor_id   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_id  UUID,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own notifications
CREATE POLICY "notif_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ── Trigger: friend request sent → notify addressee ──────────
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.addressee_id, 'friend_request', NEW.requester_id, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_request
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();

-- ── Trigger: friend request accepted → notify requester ──────
CREATE OR REPLACE FUNCTION public.notify_friend_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id)
    VALUES (NEW.requester_id, 'friend_accepted', NEW.addressee_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_friend_accepted
  AFTER UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_accepted();

-- ── Trigger: wishlist followed → notify owner ─────────────────
CREATE OR REPLACE FUNCTION public.notify_wishlist_followed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.wishlists WHERE id = NEW.wishlist_id;
  IF v_owner_id IS NOT NULL AND v_owner_id <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, target_id)
    VALUES (v_owner_id, 'wishlist_followed', NEW.user_id, NEW.wishlist_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_wishlist_followed
  AFTER INSERT ON public.wishlist_followers
  FOR EACH ROW EXECUTE FUNCTION public.notify_wishlist_followed();

-- ── 2. Activity Feed ───────────────────────────────────────────
CREATE TABLE public.activity (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('wishlist_created', 'wish_added', 'friendship_started')),
  target_id  UUID,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user_time ON public.activity(user_id, created_at DESC);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

-- Own activity always visible; friends can see non-private users' activity
CREATE POLICY "activity_read" ON public.activity FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      NOT COALESCE(
        (SELECT is_private FROM public.profiles WHERE id = activity.user_id),
        FALSE
      )
      AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.status = 'accepted'
          AND (
            (f.requester_id = auth.uid() AND f.addressee_id = activity.user_id)
            OR (f.addressee_id = auth.uid() AND f.requester_id = activity.user_id)
          )
      )
    )
  );

CREATE POLICY "activity_insert" ON public.activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_delete" ON public.activity FOR DELETE
  USING (auth.uid() = user_id);
