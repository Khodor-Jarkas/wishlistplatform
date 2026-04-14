-- ============================================================
-- Wish It — Migration 002: Extended profile fields
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  TEXT,
  ADD COLUMN IF NOT EXISTS last_name   TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender      TEXT CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS zip_code    TEXT,
  ADD COLUMN IF NOT EXISTS country     TEXT,
  ADD COLUMN IF NOT EXISTS is_private  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS language    TEXT NOT NULL DEFAULT 'en';
