-- ===========================================================================
-- MASTER SCHEMA: AUDIT LOGS, TRIGGERS, OWNER DASHBOARD VIEWS
-- ===========================================================================

-- 1. Create Audit Logs Table
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
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Only owner can view audit logs
CREATE POLICY "audit_logs_owner_select" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

-- 2. Modify stock_ledger to require reason_code and add device_info
ALTER TABLE public.stock_ledger ADD COLUMN IF NOT EXISTS reason_code VARCHAR;
ALTER TABLE public.stock_ledger ADD COLUMN IF NOT EXISTS device_info TEXT;

-- 3. Trigger Function for Audit Logs
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
    -- Extract info from current transaction session if possible (or rely on row data)
    v_user_id := auth.uid();
    
    -- Try to get device info from the new record if it's stock_ledger
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

-- Apply trigger to stock_ledger
DROP TRIGGER IF EXISTS audit_stock_ledger_trigger ON public.stock_ledger;
CREATE TRIGGER audit_stock_ledger_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.stock_ledger
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- Apply trigger to products
DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

-- 4. Owner Dashboard Views
-- Valuation Summary View: Sum(Available_Qty * cost_price) grouped by grade
CREATE OR REPLACE VIEW public.valuation_summary_view AS
SELECT 
    grade,
    SUM(available_qty) AS total_items,
    SUM(available_qty * cost_price) AS total_value
FROM (
    SELECT 
        v.product_id,
        v.grade,
        v.available_qty,
        p.cost_price
    FROM public.available_stock_view v
    JOIN public.products p ON v.product_id = p.id
) as base
WHERE available_qty > 0
GROUP BY grade;

-- Secure view wrapper for Owner only
GRANT SELECT ON public.valuation_summary_view TO authenticated;
-- (Note: Access control to this view is enforced in Next.js Middleware and via Row Level Security if joined with profiles)

-- Dead Stock View (ZONE-RETURN)
CREATE OR REPLACE VIEW public.dead_stock_view AS
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
