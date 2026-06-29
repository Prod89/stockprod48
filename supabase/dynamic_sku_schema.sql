-- ===========================================================================
-- DYNAMIC SKU SCHEMA & LOT DATE VALUATION UPDATE
-- ===========================================================================

-- 1. Add new columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warehouse_code VARCHAR;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lot_date VARCHAR;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category VARCHAR;

-- 2. Trigger Function for Dynamic SKU Generation
CREATE OR REPLACE FUNCTION public.generate_dynamic_sku()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    grade_code VARCHAR;
BEGIN
    -- Map grade to code (e.g., Premium -> P)
    IF NEW.grade = 'Premium' THEN 
        grade_code := 'P';
    ELSE 
        grade_code := NEW.grade;
    END IF;

    -- Only generate if warehouse_code, lot_date, and category are provided
    IF NEW.warehouse_code IS NOT NULL AND NEW.lot_date IS NOT NULL AND NEW.category IS NOT NULL THEN
        NEW.sku := NEW.warehouse_code || '-' || NEW.lot_date || '-' || NEW.category || '-' || grade_code;
    END IF;

    RETURN NEW;
END;
$$;

-- Apply trigger to products
DROP TRIGGER IF EXISTS trigger_generate_dynamic_sku ON public.products;
CREATE TRIGGER trigger_generate_dynamic_sku
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.generate_dynamic_sku();


-- 3. Update Valuation Summary View to group by Lot Date and Grade
DROP VIEW IF EXISTS public.valuation_summary_view;
CREATE OR REPLACE VIEW public.valuation_summary_view AS
SELECT 
    base.lot_date,
    base.grade,
    SUM(base.available_qty) AS total_items,
    SUM(base.available_qty * base.cost_price) AS total_value
FROM (
    SELECT 
        v.product_id,
        p.lot_date,
        v.grade,
        v.available_qty,
        p.cost_price
    FROM public.available_stock_view v
    JOIN public.products p ON v.product_id = p.id
) as base
WHERE base.available_qty > 0
GROUP BY base.lot_date, base.grade;

GRANT SELECT ON public.valuation_summary_view TO authenticated;
