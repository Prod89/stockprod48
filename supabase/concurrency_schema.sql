-- ===========================================================================
-- CONCURRENCY CONTROL & DATABASE LOCKING SCHEMA
-- ===========================================================================

-- This RPC replaces the old confirm_shipping and adds ROW LEVEL LOCKING
-- to prevent Over-selling when multiple requests hit at the exact same millisecond.

CREATE OR REPLACE FUNCTION public.confirm_shipping(p_order_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to ensure it bypasses RLS for safety during transaction
AS $$
DECLARE
    v_order_status VARCHAR;
    v_item RECORD;
    v_available_stock INT;
BEGIN
    -- 1. Lock the order row to prevent another process from touching this same order
    SELECT status INTO v_order_status
    FROM public.order_headers
    WHERE id = p_order_id
    FOR UPDATE; -- <--- LOCK ROW

    IF v_order_status != 'PENDING' THEN
        RAISE EXCEPTION 'Order is not PENDING. Current status: %', v_order_status;
    END IF;

    -- 2. Loop through each item in the order
    FOR v_item IN (SELECT id, product_id, ordered_qty FROM public.order_items WHERE order_id = p_order_id FOR UPDATE) LOOP
        
        -- 3. Check physical stock availability
        -- We calculate available stock physically (IN - OUT + ADJUST)
        -- We don't deduct reserved_qty here because this is the actual physical deduction step
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

        -- 4. Deduct physical stock
        INSERT INTO public.stock_ledger (product_id, transaction_type, quantity, user_id)
        VALUES (v_item.product_id, 'OUT', v_item.ordered_qty, p_user_id);

        -- 5. Update order item shipped quantity
        UPDATE public.order_items
        SET shipped_qty = v_item.ordered_qty
        WHERE id = v_item.id;

    END LOOP;

    -- 6. Mark order as SHIPPED
    UPDATE public.order_headers
    SET status = 'SHIPPED'
    WHERE id = p_order_id;

END;
$$;

-- Bulk Import RPC for CSV Offline Fallback
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
