-- ===========================================================================
-- RESILIENCE & SECURITY LOCKDOWN UPDATE
-- ===========================================================================
-- Run this script in the Supabase SQL Editor

-- 1. Add columns for Traceability to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS before_qty INT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS after_qty INT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS reason_code VARCHAR;

-- 2. Add is_active flag to profiles table (Security Lockdown)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Upgrade log_audit_event trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_device_info TEXT;
    v_record_id UUID;
    v_before_qty INT := 0;
    v_after_qty INT := 0;
    v_diff INT := 0;
    v_reason_code VARCHAR;
    v_prod_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF TG_TABLE_NAME = 'stock_ledger' THEN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            v_prod_id := NEW.product_id;
            v_device_info := NEW.device_info;
            v_reason_code := NEW.reason_code;
            
            -- Calculate change
            IF NEW.transaction_type = 'IN' THEN
                v_diff := NEW.quantity;
            ELSIF NEW.transaction_type = 'OUT' OR NEW.transaction_type = 'MOVE' THEN
                v_diff := -NEW.quantity;
            ELSIF NEW.transaction_type = 'ADJUST' THEN
                v_diff := NEW.quantity;
            END IF;
        ELSE
            v_prod_id := OLD.product_id;
            v_reason_code := OLD.reason_code;
        END IF;

        -- Calculate balance before this transaction
        SELECT COALESCE(SUM(
            CASE 
                WHEN transaction_type = 'IN' THEN quantity
                WHEN transaction_type = 'OUT' OR transaction_type = 'MOVE' THEN -quantity
                WHEN transaction_type = 'ADJUST' THEN quantity
                ELSE 0
            END
        ), 0) INTO v_before_qty
        FROM public.stock_ledger
        WHERE product_id = v_prod_id AND id != COALESCE(NEW.id, OLD.id);

        IF TG_OP = 'INSERT' THEN
            v_after_qty := v_before_qty + v_diff;
        ELSIF TG_OP = 'UPDATE' THEN
            SELECT COALESCE(SUM(
                CASE 
                    WHEN transaction_type = 'IN' THEN quantity
                    WHEN transaction_type = 'OUT' OR transaction_type = 'MOVE' THEN -quantity
                    WHEN transaction_type = 'ADJUST' THEN quantity
                    ELSE 0
                END
            ), 0) INTO v_after_qty
            FROM public.stock_ledger
            WHERE product_id = v_prod_id;
        ELSE -- DELETE
            v_after_qty := v_before_qty;
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, before_qty, after_qty, reason_code, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, v_before_qty, v_after_qty, v_reason_code, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, before_qty, after_qty, reason_code, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, v_before_qty, v_after_qty, v_reason_code, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, device_info, before_qty, after_qty, reason_code, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_user_id, v_device_info, v_before_qty, v_before_qty, v_reason_code, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 4. RPC: Return Order to Stock
CREATE OR REPLACE FUNCTION public.return_order_to_stock(p_order_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status VARCHAR;
    v_item RECORD;
BEGIN
    -- Check order status
    SELECT status INTO v_order_status FROM public.order_headers WHERE id = p_order_id FOR UPDATE;

    IF v_order_status != 'SHIPPED' AND v_order_status != 'PENDING' THEN
        RAISE EXCEPTION 'ออเดอร์ต้องอยู่ในสถานะ PENDING หรือ SHIPPED เท่านั้นเพื่อคืนสินค้า';
    END IF;

    -- Return items back
    FOR v_item IN (SELECT product_id, ordered_qty FROM public.order_items WHERE order_id = p_order_id) LOOP
        -- Return to locations: use special return zone location or let it insert as positive IN
        INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
        VALUES (v_item.product_id, '00000000-0000-0000-0000-000000000000', 'IN', v_item.ordered_qty, 'ORDER_RETURNED', p_user_id);
    END LOOP;

    -- Mark order as RETURNED
    UPDATE public.order_headers SET status = 'RETURNED', updated_at = now() WHERE id = p_order_id;
END;
$$;
