-- ============================================================
-- Wish It — Initial Schema  (v0)
-- Run via: supabase db push  OR  supabase migration up
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Profiles
--    Extends auth.users (one row per Supabase Auth user).
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Wishlists
-- ============================================================
CREATE TABLE public.wishlists (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  slug            TEXT        UNIQUE NOT NULL,
  cover_image_url TEXT,
  type            TEXT        NOT NULL DEFAULT 'personal'
                                CHECK (type IN ('personal', 'together', 'on_behalf')),
  visibility      TEXT        NOT NULL DEFAULT 'public'
                                CHECK (visibility IN ('private', 'hidden', 'public')),
  occasion        TEXT        CHECK (occasion IN (
                                'birthday','christmas','wedding',
                                'baby_shower','graduation','anniversary','other'
                              )),
  event_date      DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_slug    ON public.wishlists(slug);

-- ============================================================
-- 3. Wishes  (items inside a wishlist)
-- ============================================================
CREATE TABLE public.wishes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id  UUID        NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2),
  currency     TEXT        NOT NULL DEFAULT 'USD',
  url          TEXT,
  image_url    TEXT,
  priority     SMALLINT    NOT NULL DEFAULT 0 CHECK (priority IN (0, 1, 2)),
  is_reserved  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishes_wishlist_id ON public.wishes(wishlist_id);

-- ============================================================
-- 4. Friendships
-- ============================================================
CREATE TABLE public.friendships (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friendship CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_friendship  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);

-- ============================================================
-- 5. Reservations  (someone commits to buying a wish)
-- ============================================================
CREATE TABLE public.reservations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id      UUID        NOT NULL UNIQUE REFERENCES public.wishes(id) ON DELETE CASCADE,
  reserved_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  note         TEXT,
  reserved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep wishes.is_reserved in sync automatically
CREATE OR REPLACE FUNCTION public.sync_wish_reservation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wishes SET is_reserved = TRUE  WHERE id = NEW.wish_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wishes SET is_reserved = FALSE WHERE id = OLD.wish_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reservation_insert
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_wish_reservation();

CREATE TRIGGER trg_reservation_delete
  AFTER DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_wish_reservation();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_public_read"  ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update"   ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wishlists: owner always sees theirs; public/hidden accessible by anyone
CREATE POLICY "wishlists_read" ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id OR visibility IN ('public', 'hidden'));
CREATE POLICY "wishlists_own_insert"  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_own_update"  ON public.wishlists FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "wishlists_own_delete"  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Wishes: readable if parent wishlist is readable
CREATE POLICY "wishes_read" ON public.wishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_id
        AND (w.user_id = auth.uid() OR w.visibility IN ('public', 'hidden'))
    )
  );
CREATE POLICY "wishes_own_write" ON public.wishes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_id AND w.user_id = auth.uid()
    )
  );

-- Friendships: participants can read, requester can insert
CREATE POLICY "friendships_read"   ON public.friendships FOR SELECT
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update" ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- Reservations: authenticated users can reserve; only reserver can delete
CREATE POLICY "reservations_read"   ON public.reservations FOR SELECT USING (TRUE);
CREATE POLICY "reservations_insert" ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = reserved_by);
CREATE POLICY "reservations_delete" ON public.reservations FOR DELETE
  USING (auth.uid() = reserved_by);
