-- ============================================================
-- Wish It — Wishlist v2  (migration 003)
-- Adds: wishlist_followers table; Supabase Storage bucket
-- Note: type + visibility columns are defined in 001
-- ============================================================

-- ── Wishlist Followers ──────────────────────────────────────
CREATE TABLE public.wishlist_followers (
  wishlist_id UUID        NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  followed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wishlist_id, user_id)
);

CREATE INDEX idx_wf_wishlist ON public.wishlist_followers(wishlist_id);
CREATE INDEX idx_wf_user     ON public.wishlist_followers(user_id);

ALTER TABLE public.wishlist_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wf_read"   ON public.wishlist_followers FOR SELECT USING (TRUE);
CREATE POLICY "wf_insert" ON public.wishlist_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);
CREATE POLICY "wf_delete" ON public.wishlist_followers FOR DELETE
  USING (auth.uid() = user_id);

-- ── Supabase Storage: wishlist cover images ─────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('wishlist-covers', 'wishlist-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'wishlist-covers');

CREATE POLICY "covers_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wishlist-covers' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "covers_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'wishlist-covers' AND auth.uid() IS NOT NULL
  );
