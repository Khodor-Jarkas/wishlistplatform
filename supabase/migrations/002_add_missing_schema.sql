-- ============================================================
-- Wish It — Migration 002: Missing tables and columns
-- Adds wishlist_followers, profile columns, wishes.quantity
-- ============================================================

-- ── 1. Profiles: add missing columns ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name   TEXT,
  ADD COLUMN IF NOT EXISTS last_name    TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender       TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS zip_code     TEXT,
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS is_private   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS language     TEXT    NOT NULL DEFAULT 'en';

-- ── 2. Wishes: add quantity column ────────────────────────────
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- ── 3. Wishlist followers table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist_followers (
  wishlist_id   UUID        NOT NULL REFERENCES public.wishlists(id)  ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  followed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wishlist_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_followers_user
  ON public.wishlist_followers(user_id);

ALTER TABLE public.wishlist_followers ENABLE ROW LEVEL SECURITY;

-- Anyone can see who follows a public/hidden list; owner sees all
CREATE POLICY "wf_read" ON public.wishlist_followers FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_id
        AND (w.user_id = auth.uid() OR w.visibility IN ('public', 'hidden'))
    )
  );

-- Authenticated users can follow any readable wishlist (not their own)
CREATE POLICY "wf_insert" ON public.wishlist_followers FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_id AND w.user_id = auth.uid()
    )
  );

-- Users can only unfollow themselves
CREATE POLICY "wf_delete" ON public.wishlist_followers FOR DELETE
  USING (auth.uid() = user_id);
