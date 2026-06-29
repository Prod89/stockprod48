const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://hxpvxtpkisfmhstxarhw.supabase.co',
  'sb_publishable_UDoCLK7nEtdtv4gqSfeJdw_5jMmM1u3'
);

async function checkDatabase() {
  console.log("🔍 Checking Database Connection...");
  
  // 1. Check locations table (Should have seed data)
  const { data: locations, error: locError } = await supabase.from('locations').select('zone_name, barcode_ref');
  if (locError) {
    console.error("❌ Error fetching locations:", locError.message);
  } else {
    console.log(`✅ Locations table is ready! (Found ${locations.length} zones)`);
  }

  // 2. Check products table
  const { data: products, error: prodError } = await supabase.from('products').select('*').limit(1);
  if (prodError) {
    console.error("❌ Error fetching products:", prodError.message);
  } else {
    console.log("✅ Products table is ready!");
  }

  // 3. Check stock_ledger table
  const { data: ledger, error: ledgerError } = await supabase.from('stock_ledger').select('*').limit(1);
  if (ledgerError) {
    console.error("❌ Error fetching stock_ledger:", ledgerError.message);
  } else {
    console.log("✅ Stock Ledger table is ready!");
  }

  // 4. Check Storage Bucket
  const { data: buckets, error: bucketError } = await supabase.storage.getBucket('product-images');
  if (bucketError) {
    console.error("❌ Error fetching storage bucket 'product-images':", bucketError.message);
    console.log("⚠️ หมายเหตุ: การสร้าง Bucket อาจต้องไปกดสร้างเองใน Supabase Dashboard -> Storage -> Create bucket ('product-images' / Public)");
  } else {
    console.log(`✅ Storage Bucket '${buckets.name}' is ready and public!`);
  }
}

checkDatabase();
