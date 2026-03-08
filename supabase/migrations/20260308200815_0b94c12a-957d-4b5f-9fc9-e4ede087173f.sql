
-- Pharmacies table (partner pharmacies)
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  operating_hours JSONB DEFAULT '{"open": "09:00", "close": "21:00"}'::jsonb,
  delivery_available BOOLEAN NOT NULL DEFAULT false,
  delivery_radius_km NUMERIC DEFAULT 5,
  rating NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pharmacy products / inventory
CREATE TABLE public.pharmacy_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  manufacturer TEXT,
  dosage TEXT,
  unit TEXT DEFAULT 'strip',
  price NUMERIC NOT NULL DEFAULT 0,
  mrp NUMERIC,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 10,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pharmacy orders
CREATE TABLE public.pharmacy_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  order_number TEXT NOT NULL DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  prescription_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;

-- Pharmacies policies
CREATE POLICY "Pharmacy owners can manage own pharmacy" ON public.pharmacies FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacies FOR SELECT USING (is_active = true);

-- Pharmacy products policies
CREATE POLICY "Pharmacy owners can manage own products" ON public.pharmacy_products FOR ALL USING (
  pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid())
) WITH CHECK (
  pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone can view available products" ON public.pharmacy_products FOR SELECT USING (is_available = true);

-- Pharmacy orders policies
CREATE POLICY "Pharmacy owners can view own pharmacy orders" ON public.pharmacy_orders FOR SELECT USING (
  pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid())
);
CREATE POLICY "Pharmacy owners can update own pharmacy orders" ON public.pharmacy_orders FOR UPDATE USING (
  pharmacy_id IN (SELECT id FROM public.pharmacies WHERE owner_id = auth.uid())
);
CREATE POLICY "Customers can insert orders" ON public.pharmacy_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own orders" ON public.pharmacy_orders FOR SELECT USING (auth.uid() = customer_id);

-- Indexes
CREATE INDEX idx_pharmacy_products_pharmacy_id ON public.pharmacy_products(pharmacy_id);
CREATE INDEX idx_pharmacy_products_category ON public.pharmacy_products(category);
CREATE INDEX idx_pharmacy_orders_pharmacy_id ON public.pharmacy_orders(pharmacy_id);
CREATE INDEX idx_pharmacy_orders_status ON public.pharmacy_orders(status);
CREATE INDEX idx_pharmacy_orders_customer_id ON public.pharmacy_orders(customer_id);
CREATE INDEX idx_pharmacies_owner_id ON public.pharmacies(owner_id);

-- Update triggers
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_products_updated_at BEFORE UPDATE ON public.pharmacy_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_orders_updated_at BEFORE UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
