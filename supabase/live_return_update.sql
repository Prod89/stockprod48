-- ===========================================================================
-- DIRECT RETURN (LIVE SELLING REVERSE)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.direct_return(
    p_sku VARCHAR,
    p_qty INT,
    p_user_id UUID,
    p_reason VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
    v_product_name VARCHAR;
    v_outbound_history INT;
    v_return_location_id UUID;
BEGIN
    -- 1. Find Product
    SELECT id, name INTO v_product_id, v_product_name 
    FROM public.products 
    WHERE sku = p_sku;

    IF v_product_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'ไม่พบสินค้ารหัส ' || p_sku);
    END IF;

    -- 2. Check Outbound History (Total sold/shipped vs Total returned in this context)
    -- Simply check if we have EVER done an OUT transaction for this product
    SELECT COALESCE(SUM(quantity), 0) INTO v_outbound_history
    FROM public.stock_ledger
    WHERE product_id = v_product_id AND transaction_type = 'OUT';

    IF v_outbound_history < p_qty THEN
        RETURN json_build_object('success', false, 'error', 'ไม่สามารถคืนรายการได้เนื่องจากไม่พบประวัติการขาย (หรือคืนเกินจำนวนที่เคยขาย)');
    END IF;

    -- 3. Find Return Bin Location
    SELECT id INTO v_return_location_id
    FROM public.locations 
    WHERE zone_name ILIKE '%Return%' OR barcode_ref = 'LOC-RTN'
    LIMIT 1;

    -- If no return bin found, fallback to any warehouse location
    IF v_return_location_id IS NULL THEN
        SELECT id INTO v_return_location_id FROM public.locations LIMIT 1;
    END IF;

    -- 4. Add Stock Back (IN) to Return Bin
    INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
    VALUES (v_product_id, v_return_location_id, 'IN', p_qty, p_reason, p_user_id);

    -- 5. Audit Log
    INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, new_data)
    VALUES (
        'stock_ledger_return', 
        'INSERT', 
        v_product_id, 
        p_user_id, 
        jsonb_build_object('sku', p_sku, 'name', v_product_name, 'qty', p_qty, 'reason', p_reason, 'action', 'Live Selling Return')
    );

    RETURN json_build_object('success', true, 'product_name', v_product_name);
END;
$$;
