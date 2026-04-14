-- ============================================================
-- Wish It — Seed Data  (local dev only)
-- Run via: supabase db reset
-- ============================================================

-- 1. Create auth users first (profiles are created by the trigger automatically)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'alice@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"alice","full_name":"Alice Hansen"}',
    FALSE, 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'bob@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"bob","full_name":"Bob Nielsen"}',
    FALSE, 'authenticated', 'authenticated'
  )
ON CONFLICT DO NOTHING;

-- Profiles are created automatically by the handle_new_user trigger.
-- Update bio manually since the trigger doesn't set it.
UPDATE public.profiles SET bio = 'Loves minimalist design.'
  WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET bio = 'Coffee & gadgets enthusiast.'
  WHERE id = '00000000-0000-0000-0000-000000000002';

-- 2. Demo wishlists
INSERT INTO public.wishlists (id, user_id, title, description, slug, type, visibility, occasion) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Alice''s Birthday 2025',
    'Things I would love for my birthday!',
    'alice-birthday-2025',
    'personal',
    'public',
    'birthday'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Bob''s Tech Wishlist',
    'Gear and gadgets on my radar.',
    'bob-tech',
    'personal',
    'public',
    NULL
  )
ON CONFLICT DO NOTHING;

-- 3. Demo wishes
INSERT INTO public.wishes (wishlist_id, title, price, currency, priority) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Wireless headphones', 299.00, 'USD', 2),
  ('10000000-0000-0000-0000-000000000001', 'Coffee table book',    39.99, 'USD', 0),
  ('10000000-0000-0000-0000-000000000002', 'Mechanical keyboard', 149.00, 'USD', 1),
  ('10000000-0000-0000-0000-000000000002', 'USB-C hub',            49.99, 'USD', 0)
ON CONFLICT DO NOTHING;
