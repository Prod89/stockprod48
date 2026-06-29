-- Phase 2 & 3 Schema: Orders, Fulfillment, and Reserved Stock

-- 1. Create Enums
CREATE TYPE order_status AS ENUM ('PENDING', 'SHIPPED', 'RETURNED', 'CANCELLED');

-- 2. Create Order Headers Table
CREATE TABLE IF NOT EXISTS public.order_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.order_headers(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) NOT NULL,
  ordered_qty INTEGER NOT NULL CHECK (ordered_qty > 0),
  shipped_qty INTEGER NOT NULL DEFAULT 0,
  returned_qty INTEGER NOT NULL DEFAULT 0,
  selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.order_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_access_authenticated" ON public.order_headers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_items_access_authenticated" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Create Reserved Stock & Available Stock View
-- physical_qty = sum(IN) - sum(OUT)
-- reserved_qty = sum(ordered_qty where PENDING)
-- available = physical_qty - reserved_qty
CREATE OR REPLACE VIEW public.available_stock_view AS
WITH physical AS (
  SELECT 
    product_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END), 0) AS physical_qty
  FROM public.stock_ledger
  GROUP BY product_id
),
reserved AS (
  SELECT 
    oi.product_id,
    COALESCE(SUM(oi.ordered_qty), 0) AS reserved_qty
  FROM public.order_items oi
  JOIN public.order_headers oh ON oi.order_id = oh.id
  WHERE oh.status = 'PENDING'
  GROUP BY oi.product_id
)
SELECT 
  p.id AS product_id,
  p.sku,
  p.name,
  p.grade,
  COALESCE(ph.physical_qty, 0) AS physical_qty,
  COALESCE(r.reserved_qty, 0) AS reserved_qty,
  COALESCE(ph.physical_qty, 0) - COALESCE(r.reserved_qty, 0) AS available_qty
FROM public.products p
LEFT JOIN physical ph ON p.id = ph.product_id
LEFT JOIN reserved r ON p.id = r.product_id;

-- Secure view wrapper for staff (no cost price needed here anyway, but good practice)
GRANT SELECT ON public.available_stock_view TO authenticated;

-- 6. Setup Special ZONE-RETURN location
INSERT INTO public.locations (id, zone_name, barcode_ref)
VALUES ('00000000-0000-0000-0000-000000000000', 'ZONE-RETURN', 'RETURN-ZONE')
ON CONFLICT (id) DO NOTHING;

-- 7. RPC: Confirm Shipping (Transaction)
CREATE OR REPLACE FUNCTION public.confirm_shipping(p_order_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Update order status
  UPDATE public.order_headers 
  SET status = 'SHIPPED', updated_at = now()
  WHERE id = p_order_id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in PENDING status';
  END IF;

  -- Loop through items to update shipped_qty and cut physical stock
  FOR v_item IN SELECT id, product_id, ordered_qty FROM public.order_items WHERE order_id = p_order_id LOOP
    -- Update item
    UPDATE public.order_items
    SET shipped_qty = v_item.ordered_qty
    WHERE id = v_item.id;

    -- Cut physical stock (OUT)
    INSERT INTO public.stock_ledger (product_id, transaction_type, quantity, user_id)
    VALUES (v_item.product_id, 'OUT', v_item.ordered_qty, p_user_id);
  END LOOP;

  RETURN true;
END;
$$;

-- 8. RPC: Handle Return (Transaction)
CREATE OR REPLACE FUNCTION public.handle_return(p_order_id UUID, p_user_id UUID, p_return_items jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
  v_item_id UUID;
  v_return_qty INT;
  v_product_id UUID;
BEGIN
  -- Update order status
  UPDATE public.order_headers 
  SET status = 'RETURNED', updated_at = now()
  WHERE id = p_order_id AND status = 'SHIPPED';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in SHIPPED status';
  END IF;

  -- Loop through returned items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_return_items) LOOP
    v_item_id := (v_item->>'id')::UUID;
    v_return_qty := (v_item->>'returned_qty')::INT;
    v_product_id := (v_item->>'product_id')::UUID;

    IF v_return_qty > 0 THEN
      -- Update order item
      UPDATE public.order_items
      SET returned_qty = v_return_qty
      WHERE id = v_item_id;

      -- Add back to physical stock in ZONE-RETURN (Type IN)
      INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, user_id)
      VALUES (v_product_id, '00000000-0000-0000-0000-000000000000', 'IN', v_return_qty, p_user_id);
    END IF;
  END LOOP;

  RETURN true;
END;
$$;
