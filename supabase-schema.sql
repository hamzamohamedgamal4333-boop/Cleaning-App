-- ==========================================================
-- Cleaning App POS - Supabase Database Schema Migration Script
-- Copy and paste this script directly into the Supabase SQL Editor
-- ==========================================================

-- 1. Enable UUID Extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'partner', 'staff', 'cashier', 'admin')),
    permissions TEXT[] DEFAULT ARRAY['pos']::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'عام',
    barcode TEXT,
    cost_price NUMERIC(12, 2) DEFAULT 0,
    sell_price NUMERIC(12, 2) DEFAULT 0,
    stock_quantity NUMERIC(12, 2) DEFAULT 0,
    unit TEXT DEFAULT 'قطعة' CHECK (unit IN ('قطعة', 'لتر', 'كجم')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT,
    cashier_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'نقداً',
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capital_share NUMERIC(12, 2) DEFAULT 0,
    profit_percentage NUMERIC(5, 2) DEFAULT 0,
    total_drawings NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) DEFAULT 0,
    category TEXT DEFAULT 'مصروفات عامة',
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products (barcode);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_cashier_id ON public.invoices (cashier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and grant public access for POS desktop/mobile clients
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for POS client application
DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access invoices" ON public.invoices;
CREATE POLICY "Public access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access partners" ON public.partners;
CREATE POLICY "Public access partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access expenses" ON public.expenses;
CREATE POLICY "Public access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- ENABLE REALTIME SUBSCRIBERS
-- Allows multi-device instant live sync for mobile & desktop
-- ==========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.products, public.invoices, public.partners, public.expenses;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
