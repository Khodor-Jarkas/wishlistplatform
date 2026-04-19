-- Add status to reservations: reserved → bought progression.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reserved'
  CHECK (status IN ('reserved', 'bought'));
