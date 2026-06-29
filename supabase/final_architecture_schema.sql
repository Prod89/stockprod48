-- ===========================================================================
-- FINAL ARCHITECTURE SCHEMA: STATUS, LOW STOCK, MANUAL LOOKUP SUPPORT
-- ===========================================================================

-- 1. Add Status to Products (IN-BALE vs AVAILABLE)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'AVAILABLE';

-- 2. Update Available Stock View to include status
DROP VIEW IF EXISTS public.available_stock_view CASCADE;
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


-- 3. Update Valuation Summary View to group by Lot Date, Grade, and Status
DROP VIEW IF EXISTS public.valuation_summary_view;
CREATE OR REPLACE VIEW public.valuation_summary_view AS
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


-- 4. Create Low Stock Alert View (< 5 items)
CREATE OR REPLACE VIEW public.low_stock_view AS
SELECT 
    product_id,
    sku,
    name,
    available_qty,
    status
FROM public.available_stock_view
WHERE available_qty < 5 AND available_qty > 0 AND status = 'AVAILABLE';

GRANT SELECT ON public.low_stock_view TO authenticated;
