-- ===========================================================================
-- MASTER SCHEMAS: FIXING ALL MISSING VIEWS, TABLES, TRIGGERS, AND FUNCTIONS
-- ===========================================================================
-- รันไฟล์นี้ครั้งเดียวใน Supabase SQL Editor เพื่อสร้างทุกส่วนของระบบ WMS ที่ยังตกหล่น

-- 0. Drop existing views that might depend on the transaction_type column
DROP VIEW IF EXISTS public.low_stock_view CASCADE;
DROP VIEW IF EXISTS public.valuation_summary_view CASCADE;
DROP VIEW IF EXISTS public.dead_stock_view CASCADE;
DROP VIEW IF EXISTS public.available_stock_view CASCADE;

-- 1. Upgrade transaction_type column in stock_ledger to VARCHAR (prevents Postgres Enum limitations)
ALTER TABLE public.stock_ledger ALTER COLUMN transaction_type TYPE VARCHAR;

-- 2. Create Enums securely
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'SHIPPED', 'RETURNED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create Order Headers Table
CREATE TABLE IF NOT EXISTS public.order_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Order Items Table
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

-- Enable RLS on Orders
ALTER TABLE public.order_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create Policies for Orders
DROP POLICY IF EXISTS "orders_access_authenticated" ON public.order_headers;
CREATE POLICY "orders_access_authenticated" ON public.order_headers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_access_authenticated" ON public.order_items;
CREATE POLICY "order_items_access_authenticated" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 5. Add Missing Columns to Products and Stock Ledger
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warehouse_code VARCHAR;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lot_date VARCHAR;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category VARCHAR;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'AVAILABLE';

ALTER TABLE public.stock_ledger ADD COLUMN IF NOT EXISTS reason_code VARCHAR;
ALTER TABLE public.stock_ledger ADD COLUMN IF NOT EXISTS device_info TEXT;


-- 6. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR NOT NULL,
    action_type VARCHAR NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id UUID,
    user_id UUID REFERENCES auth.users(id),
    device_info TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_owner_select" ON public.audit_logs;
CREATE POLICY "audit_logs_owner_select" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));


-- 7. Trigger Function for Dynamic SKU Generation
CREATE OR REPLACE FUNCTION public.generate_dynamic_sku()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    grade_code VARCHAR;
BEGIN
    IF NEW.grade = 'Premium' THEN 
        grade_code := 'P';
    ELSE 
        grade_code := NEW.grade;
    END IF;

    IF NEW.warehouse_code IS NOT NULL AND NEW.lot_date IS NOT NULL AND NEW.category IS NOT NULL THEN
        NEW.sku := NEW.warehouse_code || '-' || NEW.lot_date || '-' || NEW.category || '-' || grade_code;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_generate_dynamic_sku ON public.products;
CREATE TRIGGER trigger_generate_dynamic_sku
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.generate_dynamic_sku();


-- 8. Trigger Function for Audit Logs
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_device_info TEXT;
    v_record_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF TG_TABLE_NAME = 'stock_ledger' AND TG_OP IN ('INSERT', 'UPDATE') THEN
      v_device_info := NEW.device_info;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_stock_ledger_trigger ON public.stock_ledger;
CREATE TRIGGER audit_stock_ledger_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- 9. Create Views
-- 9a. Available Stock View
CREATE VIEW public.available_stock_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.grade,
    p.status,
    p.cost_price,
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0) AS physical_qty,
    COALESCE(SUM(oi.ordered_qty) - SUM(oi.shipped_qty) - SUM(oi.returned_qty), 0) AS reserved_qty,
    (
        (COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0)) 
        - 
        COALESCE(SUM(oi.ordered_qty) - SUM(oi.shipped_qty) - SUM(oi.returned_qty), 0)
    ) AS available_qty
FROM public.products p
LEFT JOIN public.stock_ledger sl ON p.id = sl.product_id
LEFT JOIN (
    SELECT oi.product_id, oi.ordered_qty, oi.shipped_qty, oi.returned_qty
    FROM public.order_items oi
    JOIN public.order_headers oh ON oi.order_id = oh.id
    WHERE oh.status = 'PENDING'
) oi ON p.id = oi.product_id
GROUP BY p.id, p.sku, p.name, p.grade, p.status, p.cost_price;

GRANT SELECT ON public.available_stock_view TO authenticated;

-- 9b. Valuation Summary View
CREATE VIEW public.valuation_summary_view AS
SELECT 
    p.lot_date,
    v.grade,
    v.status,
    SUM(v.available_qty) AS total_items,
    SUM(v.available_qty * p.cost_price) AS total_value
FROM public.available_stock_view v
JOIN public.products p ON v.product_id = p.id
WHERE v.available_qty > 0
GROUP BY p.lot_date, v.grade, v.status;

GRANT SELECT ON public.valuation_summary_view TO authenticated;

-- 9c. Dead Stock View
CREATE VIEW public.dead_stock_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - 
    SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END) AS stranded_qty,
    p.cost_price,
    (SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - 
     SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END)) * p.cost_price AS stranded_value
FROM public.stock_ledger sl
JOIN public.products p ON sl.product_id = p.id
JOIN public.locations l ON sl.location_id = l.id
WHERE l.zone_name = 'ZONE-RETURN'
GROUP BY p.id, p.sku, p.name, p.cost_price
HAVING (SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - 
        SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END)) > 0;

GRANT SELECT ON public.dead_stock_view TO authenticated;

-- 9d. Low Stock View
CREATE VIEW public.low_stock_view AS
SELECT 
    product_id,
    sku,
    name,
    available_qty,
    status
FROM public.available_stock_view
WHERE available_qty < 5 AND available_qty > 0 AND status = 'AVAILABLE';

GRANT SELECT ON public.low_stock_view TO authenticated;


-- 10. RPC Functions with Locks (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION public.confirm_shipping(p_order_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status VARCHAR;
    v_item RECORD;
    v_available_stock INT;
BEGIN
    SELECT status INTO v_order_status FROM public.order_headers WHERE id = p_order_id FOR UPDATE;

    IF v_order_status != 'PENDING' THEN
        RAISE EXCEPTION 'Order is not PENDING. Current status: %', v_order_status;
    END IF;

    FOR v_item IN (SELECT id, product_id, ordered_qty FROM public.order_items WHERE order_id = p_order_id FOR UPDATE) LOOP
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN transaction_type = 'OUT' OR transaction_type = 'MOVE' THEN quantity ELSE 0 END), 0) +
            COALESCE(SUM(CASE WHEN transaction_type = 'ADJUST' THEN quantity ELSE 0 END), 0)
        INTO v_available_stock
        FROM public.stock_ledger
        WHERE product_id = v_item.product_id;

        IF v_available_stock < v_item.ordered_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', v_item.product_id, v_available_stock, v_item.ordered_qty;
        END IF;

        INSERT INTO public.stock_ledger (product_id, transaction_type, quantity, user_id)
        VALUES (v_item.product_id, 'OUT', v_item.ordered_qty, p_user_id);

        UPDATE public.order_items
        SET shipped_qty = v_item.ordered_qty
        WHERE id = v_item.id;
    END LOOP;

    UPDATE public.order_headers SET status = 'SHIPPED' WHERE id = p_order_id;
END;
$$;

-- Handle Return RPC
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
  UPDATE public.order_headers SET status = 'RETURNED', updated_at = now() WHERE id = p_order_id AND status = 'SHIPPED';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in SHIPPED status';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_return_items) LOOP
    v_item_id := (v_item->>'id')::UUID;
    v_return_qty := (v_item->>'returned_qty')::INT;
    v_product_id := (v_item->>'product_id')::UUID;

    IF v_return_qty > 0 THEN
      UPDATE public.order_items SET returned_qty = v_return_qty WHERE id = v_item_id;

      INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, user_id)
      VALUES (v_product_id, '00000000-0000-0000-0000-000000000000', 'IN', v_return_qty, p_user_id);
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Bulk Import RPC
CREATE OR REPLACE FUNCTION public.bulk_import_ledger(p_entries JSONB, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry JSONB;
BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
        INSERT INTO public.stock_ledger (product_id, transaction_type, quantity, reason_code, user_id, created_at)
        VALUES (
            (v_entry->>'product_id')::UUID,
            (v_entry->>'transaction_type')::VARCHAR,
            (v_entry->>'quantity')::INT,
            v_entry->>'reason_code',
            p_user_id,
            COALESCE((v_entry->>'created_at')::TIMESTAMP, NOW())
        );
    END LOOP;
END;
$$;

-- Move Stock Safe RPC (Locking)
CREATE OR REPLACE FUNCTION public.move_stock_safe(p_product_id UUID, p_location_id UUID, p_qty INT, p_reason VARCHAR, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_stock INT;
BEGIN
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN transaction_type = 'OUT' OR transaction_type = 'MOVE' THEN quantity ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN transaction_type = 'ADJUST' THEN quantity ELSE 0 END), 0)
    INTO v_available_stock
    FROM public.stock_ledger
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF v_available_stock < p_qty THEN
        RAISE EXCEPTION 'สต็อกไม่พอสำหรับการย้าย! มีแค่ %, แต่พยายามย้าย %', v_available_stock, p_qty;
    END IF;

    INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
    VALUES (p_product_id, p_location_id, 'MOVE', p_qty, p_reason, p_user_id);
END;
$$;


-- 11. Database Constraint Trigger to Prevent Negative Stock
CREATE OR REPLACE FUNCTION public.check_stock_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_balance INT;
    v_diff INT;
BEGIN
    IF NEW.transaction_type = 'IN' THEN
        v_diff := NEW.quantity;
    ELSIF NEW.transaction_type = 'OUT' OR NEW.transaction_type = 'MOVE' THEN
        v_diff := -NEW.quantity;
    ELSIF NEW.transaction_type = 'ADJUST' THEN
        v_diff := NEW.quantity;
    ELSE
        v_diff := 0;
    END IF;

    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type = 'IN' THEN quantity
            WHEN transaction_type = 'OUT' OR transaction_type = 'MOVE' THEN -quantity
            WHEN transaction_type = 'ADJUST' THEN quantity
            ELSE 0
        END
    ), 0) INTO v_balance
    FROM public.stock_ledger
    WHERE product_id = NEW.product_id;

    IF (v_balance + v_diff) < 0 THEN
        RAISE EXCEPTION 'สต็อกสินค้าไม่เพียงพอ! ยอดคงเหลือปัจจุบัน: %, ต้องการใช้: %', v_balance, ABS(v_diff);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_stock_integrity ON public.stock_ledger;
CREATE TRIGGER trigger_check_stock_integrity
BEFORE INSERT ON public.stock_ledger
FOR EACH ROW EXECUTE FUNCTION public.check_stock_integrity();


-- 12. Add Default Seed Data for Locations and Special Returns Zone
INSERT INTO public.locations (id, zone_name, barcode_ref) VALUES
  ('00000000-0000-0000-0000-000000000000', 'ZONE-RETURN', 'RETURN-ZONE')
ON CONFLICT (id) DO NOTHING;

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
