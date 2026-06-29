const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://hxpvxtpkisfmhstxarhw.supabase.co',
  'sb_publishable_UDoCLK7nEtdtv4gqSfeJdw_5jMmM1u3'
);

async function checkDatabase() {
  console.log("🔍 Checking Database Connection...");
  
  // 1. Check locations table
  const { data: locations, error: locError } = await supabase.from('locations').select('zone_name, barcode_ref');
  if (locError) console.error("❌ Error fetching locations:", locError.message);
  else console.log(`✅ Locations table is ready! (Found ${locations.length} zones)`);

  // 2. Check products table
  const { data: products, error: prodError } = await supabase.from('products').select('*').limit(1);
  if (prodError) console.error("❌ Error fetching products:", prodError.message);
  else console.log("✅ Products table is ready!");

  // 3. Check stock_ledger table
  const { data: ledger, error: ledgerError } = await supabase.from('stock_ledger').select('*').limit(1);
  if (ledgerError) console.error("❌ Error fetching stock_ledger:", ledgerError.message);
  else console.log("✅ Stock Ledger table is ready!");

  // 4. Check profiles table
  const { data: profiles, error: profError } = await supabase.from('profiles').select('*').limit(3);
  if (profError) console.error("❌ Error fetching profiles:", profError.message);
  else console.log(`✅ Profiles table is ready! (Found ${profiles.length} profiles:`, JSON.stringify(profiles), ")");

  // 5. Check valuation_summary_view
  const { data: val, error: valError } = await supabase.from('valuation_summary_view').select('*').limit(1);
  if (valError) console.error("❌ Error fetching valuation_summary_view:", valError.message);
  else console.log("✅ valuation_summary_view is ready!");

  // 6. Check dead_stock_view
  const { data: dead, error: deadError } = await supabase.from('dead_stock_view').select('*').limit(1);
  if (deadError) console.error("❌ Error fetching dead_stock_view:", deadError.message);
  else console.log("✅ dead_stock_view is ready!");

  // 7. Check low_stock_view
  const { data: low, error: lowError } = await supabase.from('low_stock_view').select('*').limit(1);
  if (lowError) console.error("❌ Error fetching low_stock_view:", lowError.message);
  else console.log("✅ low_stock_view is ready!");

  // 8. Check audit_logs table
  const { data: audit, error: auditError } = await supabase.from('audit_logs').select('*').limit(1);
  if (auditError) console.error("❌ Error fetching audit_logs:", auditError.message);
  else console.log("✅ audit_logs table is ready!");
}

checkDatabase();
