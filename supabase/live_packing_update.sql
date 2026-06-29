-- ===========================================================================
-- DIRECT OUTBOUND (LIVE SELLING)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.direct_outbound(
    p_sku VARCHAR,
    p_qty INT,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_product_name VARCHAR;
    v_available_stock INT;
    v_location_id UUID;
    v_result JSON;
BEGIN
    -- 1. Find Product
    SELECT id, name INTO v_product_id, v_product_name 
    FROM public.products 
    WHERE sku = p_sku;

    IF v_product_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบสินค้ารหัส ' || p_sku);
    END IF;

    -- 2. Check total stock
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN transaction_type = 'ADJUST' THEN quantity ELSE 0 END), 0)
    INTO v_available_stock
    FROM public.stock_ledger
    WHERE product_id = v_product_id;

    IF v_available_stock < p_qty THEN
        RETURN json_build_object('success', false, 'error', 'สต็อกไม่พอ! มีอยู่ ' || v_available_stock || ' ชิ้น');
    END IF;

    -- 3. Find primary location for this product (where it has stock)
    SELECT l.id INTO v_location_id
    FROM public.stock_ledger sl
    JOIN public.locations l ON sl.location_id = l.id
    WHERE sl.product_id = v_product_id
    GROUP BY l.id
    HAVING (
        COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' THEN sl.quantity ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0)
    ) > 0
    LIMIT 1;

    -- 4. Deduct Stock (OUT)
    INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
    VALUES (v_product_id, v_location_id, 'OUT', p_qty, 'DIRECT_OUTBOUND', p_user_id);

    -- 5. Audit Log
    INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, new_data)
    VALUES (
        'stock_ledger_outbound', 
        'INSERT', 
        v_product_id, 
        p_user_id, 
        jsonb_build_object('sku', p_sku, 'name', v_product_name, 'qty', p_qty, 'action', 'Live Selling Outbound')
    );

    RETURN json_build_object('success', true, 'product_name', v_product_name, 'remaining', v_available_stock - p_qty);
END;
$$;
