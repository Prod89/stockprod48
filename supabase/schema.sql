-- =============================================================
-- WMS (Warehouse Management System) - Phase 1 Database Schema
-- สำหรับรันใน Supabase SQL Editor
-- =============================================================

-- 0. Enable required extensions
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create ENUM types
-- =============================================================
DO $$ BEGIN
  CREATE TYPE product_grade AS ENUM ('Premium', '1', '2', '3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('IN', 'OUT', 'MOVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables
-- =============================================================

-- 2a. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2b. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  grade product_grade,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2c. Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  barcode_ref TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2d. Stock Ledger
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  image_proof_url TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Indexes for performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_locations_barcode ON public.locations(barcode_ref);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON public.stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_location ON public.stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_user ON public.stock_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created ON public.stock_ledger(created_at DESC);

-- 4. Helper function: Get current user's role
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Enable Row Level Security (RLS) on ALL tables
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- =============================================================

-- 6a. Profiles policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Owner can see all profiles
CREATE POLICY "profiles_select_all_owner"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'owner');

-- 6b. Products policies
-- Staff can read products BUT NOT cost_price (enforced via view below)
-- We allow SELECT for all authenticated users here; cost_price hiding is done via a secure view
CREATE POLICY "products_select_authenticated"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

-- Only owner can insert/update/delete products
CREATE POLICY "products_insert_owner"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'owner');

CREATE POLICY "products_update_owner"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'owner')
  WITH CHECK (public.get_my_role() = 'owner');

CREATE POLICY "products_delete_owner"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'owner');

-- 6c. Locations policies
CREATE POLICY "locations_select_authenticated"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "locations_insert_owner"
  ON public.locations FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'owner');

CREATE POLICY "locations_update_owner"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'owner')
  WITH CHECK (public.get_my_role() = 'owner');

-- 6d. Stock Ledger policies
-- All authenticated users can insert (staff can record inbound)
CREATE POLICY "stock_ledger_insert_authenticated"
  ON public.stock_ledger FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Staff can only see their own entries, Owner can see all
CREATE POLICY "stock_ledger_select_own_or_owner"
  ON public.stock_ledger FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.get_my_role() = 'owner'
  );

-- 7. Secure View: products WITHOUT cost_price for Staff
-- =============================================================
CREATE OR REPLACE VIEW public.products_safe AS
SELECT
  id,
  sku,
  name,
  CASE
    WHEN public.get_my_role() = 'owner' THEN cost_price
    ELSE NULL
  END AS cost_price,
  grade,
  created_at,
  updated_at
FROM public.products;

-- 8. Trigger: Auto-create profile on new user signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$;

-- Drop if exists then create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Updated_at trigger for auto-updating timestamps
-- =============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 10. Storage Bucket: product-images
-- =============================================================
-- NOTE: Run these separately in Supabase SQL Editor if they fail
-- (Storage policies sometimes need dashboard UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 11. Seed Data: Sample locations
-- =============================================================
INSERT INTO public.locations (zone_name, barcode_ref) VALUES
  ('Premium Row 1', 'PRE-ROW-01'),
  ('Premium Row 2', 'PRE-ROW-02'),
  ('Grade 1 Row 1', 'G1-ROW-01'),
  ('Grade 1 Row 2', 'G1-ROW-02'),
  ('Grade 2 Row 1', 'G2-ROW-01'),
  ('Grade 2 Row 2', 'G2-ROW-02'),
  ('Grade 3 Row 1', 'G3-ROW-01'),
  ('Grade 3 Row 2', 'G3-ROW-02'),
  ('รอแยกเกรด', 'UNSORTED-01'),
  ('สินค้าคืน', 'RETURN-01')
ON CONFLICT (barcode_ref) DO NOTHING;

-- =============================================================
-- DONE! Schema setup complete.
-- Next steps:
-- 1. Create a user via Supabase Auth Dashboard
-- 2. Update their role in profiles table to 'owner'
-- 3. Create Storage bucket 'product-images' if the INSERT above failed
-- =============================================================
