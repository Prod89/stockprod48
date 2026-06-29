-- ===========================================================================
-- FINANCIAL & LOT TRACKING VIEWS UPDATE
-- ===========================================================================
-- Run this in the Supabase SQL Editor

-- 1. Create cost_summary_view
CREATE OR REPLACE VIEW public.cost_summary_view AS
SELECT 
    p.lot_date,
    SUM(v.available_qty) AS total_items,
    CASE 
        WHEN public.get_my_role() = 'owner' THEN SUM(v.available_qty * p.cost_price) 
        ELSE NULL 
    END AS total_cost
FROM public.available_stock_view v
JOIN public.products p ON v.product_id = p.id
WHERE v.available_qty > 0
GROUP BY p.lot_date;

GRANT SELECT ON public.cost_summary_view TO authenticated;

-- 2. Create lot_location_stock_view to track lot quantities per location
CREATE OR REPLACE VIEW public.lot_location_stock_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.lot_date,
    l.id AS location_id,
    COALESCE(l.zone_name, 'UNASSIGNED') AS zone_name,
    COALESCE(l.barcode_ref, 'N/A') AS barcode_ref,
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0) AS physical_qty
FROM public.products p
JOIN public.stock_ledger sl ON p.id = sl.product_id
LEFT JOIN public.locations l ON sl.location_id = l.id
GROUP BY p.id, p.sku, p.name, p.lot_date, l.id, l.zone_name, l.barcode_ref
HAVING (
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' OR sl.transaction_type = 'MOVE' THEN sl.quantity ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0)
) > 0;

GRANT SELECT ON public.lot_location_stock_view TO authenticated;
