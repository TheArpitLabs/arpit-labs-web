-- Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Items
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES marketplace_categories(id),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    seller_id UUID REFERENCES auth.users(id) NOT NULL,
    preview_image TEXT,
    download_url TEXT,
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    item_id UUID REFERENCES marketplace_items(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY "Public categories read" ON marketplace_categories
    FOR SELECT USING (true);

-- Items: Public read for published items
CREATE POLICY "Public items read" ON marketplace_items
    FOR SELECT USING (published = true);

-- Items: Sellers can manage their own items
CREATE POLICY "Sellers manage own items" ON marketplace_items
    FOR ALL USING (auth.uid() = seller_id);

-- Items: Admins can manage all items
CREATE POLICY "Admins manage all items" ON marketplace_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders: Users can read their own orders
CREATE POLICY "Users read own orders" ON marketplace_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Orders: Sellers can read orders for their items
CREATE POLICY "Sellers read own item orders" ON marketplace_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_orders.item_id AND seller_id = auth.uid()
        )
    );

-- Orders: Admins can read all orders
CREATE POLICY "Admins read all orders" ON marketplace_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RPC for updating stats
CREATE OR REPLACE FUNCTION increment_marketplace_sales(item_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET sales_count = sales_count + 1,
      revenue = revenue + amount
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_marketplace_views(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_items
  SET views_count = views_count + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initial Categories
INSERT INTO marketplace_categories (name, slug) VALUES
('Templates', 'templates'),
('UI Kits', 'ui-kits'),
('E-books', 'e-books'),
('Software', 'software'),
('Icons', 'icons')
ON CONFLICT (slug) DO NOTHING;
