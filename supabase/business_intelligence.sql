-- ===========================================================================
-- BUSINESS INTELLIGENCE VIEWS & TABLES
-- ===========================================================================

-- 1. Bale Cost Log Table
CREATE TABLE IF NOT EXISTS public.bale_cost_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_date VARCHAR NOT NULL,
    bale_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    misc_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_units INT NOT NULL DEFAULT 1,
    avg_unit_cost NUMERIC(12, 2) GENERATED ALWAYS AS (
        CASE WHEN total_units > 0 THEN (bale_cost + shipping_cost + misc_cost) / total_units ELSE 0 END
    ) STORED,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bale_cost_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bale_cost_owner_only" ON public.bale_cost_log;
CREATE POLICY "bale_cost_owner_only" ON public.bale_cost_log
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner'));

-- 2. Lot Profitability View
CREATE OR REPLACE VIEW public.lot_profitability_view AS
SELECT
    p.lot_date,
    COUNT(DISTINCT p.id) AS sku_count,
    COALESCE(SUM(
        CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END
    ), 0) AS total_inbound,
    COALESCE(SUM(
        CASE WHEN sl.transaction_type = 'OUT' THEN sl.quantity ELSE 0 END
    ), 0) AS total_sold,
    CASE WHEN public.get_my_role() = 'owner' THEN
        COALESCE(SUM(
            CASE WHEN sl.transaction_type = 'OUT' THEN sl.quantity * p.cost_price ELSE 0 END
        ), 0)
    ELSE NULL END AS total_cost_of_sold,
    CASE WHEN public.get_my_role() = 'owner' THEN
        COALESCE((SELECT SUM(oi.ordered_qty * oi.selling_price)
         FROM public.order_items oi
         JOIN public.order_headers oh ON oi.order_id = oh.id
         JOIN public.products pp ON oi.product_id = pp.id
         WHERE pp.lot_date = p.lot_date AND oh.status = 'SHIPPED'), 0)
    ELSE NULL END AS total_revenue,
    CASE WHEN public.get_my_role() = 'owner' THEN
        COALESCE(SUM(
            CASE WHEN sl.transaction_type IN ('IN','ADJUST') THEN sl.quantity
                 WHEN sl.transaction_type IN ('OUT','MOVE') THEN -sl.quantity
                 ELSE 0 END
        ), 0)
    ELSE NULL END AS remaining_qty,
    CASE WHEN public.get_my_role() = 'owner' THEN
        COALESCE(SUM(
            CASE WHEN sl.transaction_type IN ('IN','ADJUST') THEN sl.quantity
                 WHEN sl.transaction_type IN ('OUT','MOVE') THEN -sl.quantity
                 ELSE 0 END
        ) * AVG(p.cost_price), 0)
    ELSE NULL END AS remaining_value
FROM public.products p
LEFT JOIN public.stock_ledger sl ON p.id = sl.product_id
WHERE p.lot_date IS NOT NULL
GROUP BY p.lot_date;

GRANT SELECT ON public.lot_profitability_view TO authenticated;

-- 3. Aging Analysis View
CREATE OR REPLACE VIEW public.aging_analysis_view AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name,
    p.grade,
    p.lot_date,
    p.created_at AS first_received,
    EXTRACT(DAY FROM (now() - p.created_at))::INT AS days_in_stock,
    CASE
        WHEN EXTRACT(DAY FROM (now() - p.created_at)) <= 30 THEN '0-30 วัน'
        WHEN EXTRACT(DAY FROM (now() - p.created_at)) <= 60 THEN '31-60 วัน'
        ELSE '60+ วัน'
    END AS aging_bucket,
    COALESCE(SUM(
        CASE WHEN sl.transaction_type IN ('IN','ADJUST') THEN sl.quantity
             WHEN sl.transaction_type IN ('OUT','MOVE') THEN -sl.quantity
             ELSE 0 END
    ), 0) AS on_hand_qty,
    CASE WHEN public.get_my_role() = 'owner' THEN
        COALESCE(SUM(
            CASE WHEN sl.transaction_type IN ('IN','ADJUST') THEN sl.quantity
                 WHEN sl.transaction_type IN ('OUT','MOVE') THEN -sl.quantity
                 ELSE 0 END
        ) * p.cost_price, 0)
    ELSE NULL END AS on_hand_value
FROM public.products p
LEFT JOIN public.stock_ledger sl ON p.id = sl.product_id
GROUP BY p.id, p.sku, p.name, p.grade, p.lot_date, p.created_at, p.cost_price
HAVING COALESCE(SUM(
    CASE WHEN sl.transaction_type IN ('IN','ADJUST') THEN sl.quantity
         WHEN sl.transaction_type IN ('OUT','MOVE') THEN -sl.quantity
         ELSE 0 END
), 0) > 0;

GRANT SELECT ON public.aging_analysis_view TO authenticated;
