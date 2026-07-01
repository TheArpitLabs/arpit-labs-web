-- Phase 9A: Product Suite Implementation

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    overview TEXT,
    category TEXT NOT NULL,
    pricing_type TEXT NOT NULL,
    pricing_details TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    demo_url TEXT,
    documentation_url TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Features
CREATE TABLE IF NOT EXISTS product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Screenshots
CREATE TABLE IF NOT EXISTS product_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_screenshots ENABLE ROW LEVEL SECURITY;

-- Policies using existing public.is_admin() function
DROP POLICY IF EXISTS "Public read for published products" ON products;
CREATE POLICY "Public read for published products" 
ON products FOR SELECT 
USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on products" ON products;
CREATE POLICY "Admin full access on products" 
ON products FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read for features of published products" ON product_features;
CREATE POLICY "Public read for features of published products" 
ON product_features FOR SELECT 
USING (EXISTS (SELECT 1 FROM products WHERE id = product_features.product_id AND published = true) OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on product_features" ON product_features;
CREATE POLICY "Admin full access on product_features" 
ON product_features FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read for screenshots of published products" ON product_screenshots;
CREATE POLICY "Public read for screenshots of published products" 
ON product_screenshots FOR SELECT 
USING (EXISTS (SELECT 1 FROM products WHERE id = product_screenshots.product_id AND published = true) OR public.is_admin());

DROP POLICY IF EXISTS "Admin full access on product_screenshots" ON product_screenshots;
CREATE POLICY "Admin full access on product_screenshots" 
ON product_screenshots FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
