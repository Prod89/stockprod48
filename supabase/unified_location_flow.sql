-- ===========================================================================
-- UNIFIED LOCATION & STATUS FLOW
-- ===========================================================================
-- รันไฟล์นี้ใน Supabase SQL Editor เพื่ออัปเกรดระบบ Location และ Status

-- 1. เพิ่ม status_state ให้ตาราง Locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS status_state VARCHAR DEFAULT 'Available';
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS description VARCHAR;

-- 2. กำหนด Default Status ให้กับ Zone ต่างๆ
UPDATE public.locations SET status_state = 'Available' WHERE zone_name ILIKE '%Warehouse%';
UPDATE public.locations SET status_state = 'Reserved' WHERE zone_name ILIKE '%Staging%';
UPDATE public.locations SET status_state = 'Pending_Shipment' WHERE zone_name ILIKE '%Packing%';
UPDATE public.locations SET status_state = 'Completed' WHERE zone_name ILIKE '%Dispatch%';
UPDATE public.locations SET status_state = 'Returned' WHERE zone_name ILIKE '%Return%';

-- เพิ่มโซนมาตรฐานที่อาจจะยังไม่มี
INSERT INTO public.locations (zone_name, barcode_ref, status_state, description)
SELECT 'Packing Zone', 'LOC-PACK', 'Pending_Shipment', 'จุดจัดแพ็คสินค้า'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE barcode_ref = 'LOC-PACK');

INSERT INTO public.locations (zone_name, barcode_ref, status_state, description)
SELECT 'Dispatch Zone', 'LOC-DISPATCH', 'Completed', 'จุดรอขนส่งมารับ'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE barcode_ref = 'LOC-DISPATCH');

-- 3. สร้าง View สำหรับ Inventory by Location (แยกตาม Lot และ Location พร้อม Status)
CREATE OR REPLACE VIEW public.inventory_by_location_view AS
SELECT 
    p.id AS product_id,
    p.sku,
    p.name,
    p.lot_date,
    CASE WHEN public.get_my_role() = 'owner' THEN p.cost_price ELSE NULL END AS cost_price,
    l.id AS location_id,
    COALESCE(l.zone_name, 'UNASSIGNED') AS zone_name,
    COALESCE(l.barcode_ref, 'N/A') AS barcode_ref,
    COALESCE(l.status_state, 'Available') AS status_state,
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' THEN sl.quantity ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0) AS physical_qty
FROM public.products p
JOIN public.stock_ledger sl ON p.id = sl.product_id
LEFT JOIN public.locations l ON sl.location_id = l.id
GROUP BY p.id, p.sku, p.name, p.lot_date, p.cost_price, l.id, l.zone_name, l.barcode_ref, l.status_state
HAVING (
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'IN' THEN sl.quantity ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'OUT' THEN sl.quantity ELSE 0 END), 0) +
    COALESCE(SUM(CASE WHEN sl.transaction_type = 'ADJUST' THEN sl.quantity ELSE 0 END), 0)
) > 0;

GRANT SELECT ON public.inventory_by_location_view TO authenticated;

-- 4. สร้าง RPC Function ที่ปลอดภัยสำหรับการย้าย Stock พร้อม Audit Log (แทนการใช้ MOVE แบบเก่า)
CREATE OR REPLACE FUNCTION public.transfer_stock_location(
    p_product_id UUID, 
    p_from_location_id UUID, 
    p_to_location_id UUID, 
    p_qty INT, 
    p_reason VARCHAR, 
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available_stock INT;
    v_from_zone VARCHAR;
    v_to_zone VARCHAR;
BEGIN
    -- ล็อคสต็อกที่ From Location เพื่อป้องกัน Race Condition
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'IN' THEN quantity ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN transaction_type = 'OUT' THEN quantity ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN transaction_type = 'ADJUST' THEN quantity ELSE 0 END), 0)
    INTO v_available_stock
    FROM public.stock_ledger
    WHERE product_id = p_product_id AND (location_id = p_from_location_id OR (location_id IS NULL AND p_from_location_id IS NULL))
    FOR UPDATE;

    IF v_available_stock < p_qty THEN
        RAISE EXCEPTION 'สต็อกไม่พอสำหรับการย้าย! มีแค่ %, แต่พยายามย้าย %', v_available_stock, p_qty;
    END IF;

    -- หากรันผ่าน ตัดสต็อกจากที่เดิม (OUT)
    INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
    VALUES (p_product_id, p_from_location_id, 'OUT', p_qty, 'TRANSFER_OUT', p_user_id);

    -- รับสต็อกเข้าที่ใหม่ (IN)
    INSERT INTO public.stock_ledger (product_id, location_id, transaction_type, quantity, reason_code, user_id)
    VALUES (p_product_id, p_to_location_id, 'IN', p_qty, 'TRANSFER_IN', p_user_id);

    -- ดึงชื่อ Zone สำหรับลง Audit Logs
    SELECT zone_name INTO v_from_zone FROM public.locations WHERE id = p_from_location_id;
    SELECT zone_name INTO v_to_zone FROM public.locations WHERE id = p_to_location_id;
    
    IF v_from_zone IS NULL THEN v_from_zone := 'UNASSIGNED'; END IF;
    IF v_to_zone IS NULL THEN v_to_zone := 'UNASSIGNED'; END IF;

    -- ลงบันทึก Audit Log ชัดเจนว่าย้ายจากไหนไปไหน
    INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, old_data, new_data)
    VALUES (
        'stock_ledger_transfer', 
        'UPDATE', 
        p_product_id, 
        p_user_id, 
        jsonb_build_object('from_location', p_from_location_id, 'from_zone', v_from_zone, 'qty', p_qty),
        jsonb_build_object('to_location', p_to_location_id, 'to_zone', v_to_zone, 'reason', p_reason)
    );
END;
$$;

-- 5. RPC สำหรับการอัปเดตข้อมูล Product / Location โดย Owner
CREATE OR REPLACE FUNCTION public.update_entity_details(
    p_entity_type VARCHAR, -- 'PRODUCT' or 'LOCATION'
    p_entity_id UUID,
    p_name VARCHAR,
    p_details VARCHAR,
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role VARCHAR;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    IF v_role != 'owner' THEN
        RAISE EXCEPTION 'Only Owner can edit details';
    END IF;

    IF p_entity_type = 'PRODUCT' THEN
        UPDATE public.products SET name = p_name, category = p_details, updated_at = now() WHERE id = p_entity_id;
    ELSIF p_entity_type = 'LOCATION' THEN
        UPDATE public.locations SET zone_name = p_name, description = p_details WHERE id = p_entity_id;
    ELSE
        RAISE EXCEPTION 'Invalid entity type';
    END IF;
    
    INSERT INTO public.audit_logs (table_name, action_type, record_id, user_id, new_data)
    VALUES (p_entity_type, 'UPDATE', p_entity_id, p_user_id, jsonb_build_object('name', p_name, 'details', p_details));
END;
$$;
