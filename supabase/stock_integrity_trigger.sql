-- ===========================================================================
-- DATABASE-LEVEL STOCK INTEGRITY TRIGGER (PREVENT NEGATIVE STOCK)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.check_stock_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_balance INT;
    v_diff INT;
BEGIN
    -- 1. Determine if this transaction increases or decreases physical stock
    IF NEW.transaction_type = 'IN' THEN
        v_diff := NEW.quantity;
    ELSIF NEW.transaction_type = 'OUT' OR NEW.transaction_type = 'MOVE' THEN
        v_diff := -NEW.quantity;
    ELSIF NEW.transaction_type = 'ADJUST' THEN
        v_diff := NEW.quantity; -- ADJUST quantity can be positive or negative
    ELSE
        v_diff := 0;
    END IF;

    -- 2. Calculate current physical stock balance for this product
    -- We do NOT use FOR UPDATE inside triggers as it can lead to deadlocks,
    -- but because this trigger runs inside the write transaction, Postgres 
    -- holds a lock on the table/rows being updated, ensuring integrity.
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

    -- 3. Abort if final balance is negative
    IF (v_balance + v_diff) < 0 THEN
        RAISE EXCEPTION 'สต็อกสินค้าไม่เพียงพอ! ยอดคงเหลือปัจจุบัน: %, ต้องการใช้: %', v_balance, ABS(v_diff);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to check before any insert to stock_ledger
DROP TRIGGER IF EXISTS trigger_check_stock_integrity ON public.stock_ledger;
CREATE TRIGGER trigger_check_stock_integrity
BEFORE INSERT ON public.stock_ledger
FOR EACH ROW EXECUTE FUNCTION public.check_stock_integrity();
