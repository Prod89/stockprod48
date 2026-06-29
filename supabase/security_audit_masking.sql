-- ===========================================================================
-- DATABASE-LEVEL COST PRICE MASKING (SECURITY AUDIT)
-- ===========================================================================
-- Run this in the Supabase SQL Editor to enforce that Staff cannot view Cost Price

-- 1. Drop views first
DROP VIEW IF EXISTS public.low_stock_view CASCADE;
DROP VIEW IF EXISTS public.valuation_summary_view CASCADE;
DROP VIEW IF EXISTS public.dead_stock_view CASCADE;
DROP VIEW IF EXISTS public.available_stock_view CASCADE;

-- 2. Re-create available_stock_view with role check masking on cost_price
CREATE OR REPLACE VIEW public.available_stock_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.grade,
    p.status,
    CASE 
        WHEN public.get_my_role() = 'owner' THEN p.cost_price 
        ELSE NULL 
    END AS cost_price,
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

-- 3. Re-create valuation_summary_view with role check masking on total_value
CREATE OR REPLACE VIEW public.valuation_summary_view AS
SELECT 
    p.lot_date,
    v.grade,
    v.status,
    SUM(v.available_qty) AS total_items,
    CASE 
        WHEN public.get_my_role() = 'owner' THEN SUM(v.available_qty * p.cost_price) 
        ELSE NULL 
    END AS total_value
FROM public.available_stock_view v
JOIN public.products p ON v.product_id = p.id
WHERE v.available_qty > 0
GROUP BY p.lot_date, v.grade, v.status;

GRANT SELECT ON public.valuation_summary_view TO authenticated;

-- 4. Re-create dead_stock_view with role check masking on cost_price and stranded_value
CREATE OR REPLACE VIEW public.dead_stock_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - 
    SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END) AS stranded_qty,
    CASE 
        WHEN public.get_my_role() = 'owner' THEN p.cost_price 
        ELSE NULL 
    END AS cost_price,
    CASE 
        WHEN public.get_my_role() = 'owner' THEN (SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END)) * p.cost_price 
        ELSE NULL 
    END AS stranded_value
FROM public.stock_ledger sl
JOIN public.products p ON sl.product_id = p.id
JOIN public.locations l ON sl.location_id = l.id
WHERE l.zone_name = 'ZONE-RETURN'
GROUP BY p.id, p.sku, p.name, p.cost_price
HAVING (SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END) - 
        SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END)) > 0;

GRANT SELECT ON public.dead_stock_view TO authenticated;

-- 5. Re-create low_stock_view
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
