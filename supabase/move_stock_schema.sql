CREATE OR REPLACE FUNCTION public.move_stock_safe(p_product_id UUID, p_location_id UUID, p_qty INT, p_reason VARCHAR, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_stock INT;
BEGIN
    -- Lock the stock calculation
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
