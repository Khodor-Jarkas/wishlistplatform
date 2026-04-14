-- Add quantity field to wishes
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity >= 1);
