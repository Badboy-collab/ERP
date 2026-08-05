import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  // === POULTRY FEED - Broiler ===
  { code: "510", name: "Broiler Starter (C) 510", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "520", name: "Broiler Grower (P) 520", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "530", name: "Broiler Finisher (P) 530", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "BHF-25", name: "Broiler House Feed (G)", category: "Poultry Feed", bag_size_kg: 25 },

  // === POULTRY FEED - Layer ===
  { code: "710", name: "Layer Starter (C) 710", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "750", name: "Layer Grower/Crumble 750", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "LGM-50", name: "Layer Grower/Mash", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "720", name: "Layer Layer-1 (M) 720", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "LL2-50", name: "Layer Layer-2", category: "Poultry Feed", bag_size_kg: 50 },

  // === POULTRY FEED - Sonali ===
  { code: "610", name: "Sonali Starter (C) 610", category: "Poultry Feed", bag_size_kg: 50 },
  { code: "620", name: "Sonali Grower (P) 620", category: "Poultry Feed", bag_size_kg: 50 },

  // === CATTLE FEED ===
  { code: "850", name: "Cattle Dairy Mash/Premium 850", category: "Cattle Feed", bag_size_kg: 25 },
  { code: "820", name: "Cattle Fatte./Mash/Pre. 820", category: "Cattle Feed", bag_size_kg: 25 },
  { code: "860", name: "Cattle Dairy Economy 860", category: "Cattle Feed", bag_size_kg: 25 },
  { code: "830", name: "Cattle Fattening/Economy 830", category: "Cattle Feed", bag_size_kg: 25 },
  { code: "880", name: "Cattle Fattening Classic 880", category: "Cattle Feed", bag_size_kg: 25 },

  // === FISH FEED - Hatchery & Pre-Nursery ===
  { code: "1510", name: "Hatchery Powder 1510", category: "Fish Feed", bag_size_kg: 10 },
  { code: "920", name: "Pre-Nursery-2 920", category: "Fish Feed", bag_size_kg: 10 },

  // === FISH FEED - Koi/Shing/Pabda ===
  { code: "930", name: "Koi/Shing/Pabda Pre-Sta-1 930", category: "Fish Feed", bag_size_kg: 20 },
  { code: "KSP-20", name: "Koi/Shing Pre-Starter", category: "Fish Feed", bag_size_kg: 20 },
  { code: "PGP-20", name: "Pabda/Gulsha Pre-Starter", category: "Fish Feed", bag_size_kg: 20 },
  { code: "PGS-20", name: "Pabda/Gulsha Starter", category: "Fish Feed", bag_size_kg: 20 },
  { code: "PGG-20", name: "Pabda/Gulsha Grower", category: "Fish Feed", bag_size_kg: 20 },
  { code: "KSS-20", name: "Koi/Shing Starter 2.00mm Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "KSG-20", name: "Koi/Shing Grower 2.50mm Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Pangus Floating Oil Coated ===
  { code: "PPSO-20", name: "Pangus Pre-Starter Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1220", name: "Pangus Starter 2mm 1220 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1230", name: "Pangus Grower 3mm 1230 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1240", name: "Pangus Finisher 1240 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Tilapia Floating Oil Coated ===
  { code: "TPSO-20", name: "Tilapia Pre-Starter Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1320", name: "Tilapia Starter 1320 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1330", name: "Tilapia Grower 1330 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1360", name: "Tilapia Finisher 1360 Floating Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Pangus Floating Non Oil Coated ===
  { code: "PSNOC-20", name: "Pangus Starter Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "PGNOC-20", name: "Pangus Grower Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1260", name: "Pangus Finisher 1260 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Tilapia Floating Non Oil Coated ===
  { code: "TSNOC-20", name: "Tilapia Starter Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1350", name: "Tilapia Grower 1350 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "TFNOC-20", name: "Tilapia Finisher Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Carp Floating Non Oil Coated ===
  { code: "1410", name: "Carp Starter FL N/O 2MM 1410 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "968", name: "Carp Grower Mishra 968 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1420", name: "Carp Grower 3mm 1420 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },
  { code: "1430", name: "Carp Grower/Economy 4mm 1430 Floating Non Oil Coated", category: "Fish Feed", bag_size_kg: 20 },

  // === FISH FEED - Sinking ===
  { code: "PSD-25", name: "Pangus Starter/Diamond Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "PGD-25", name: "Pangus Grower/Diamond Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "PFD-25", name: "Pangus Finisher/Diamond Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "1640", name: "Pangus Grower Premium 1640 Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "PFPS-25", name: "Pangus Finisher/Premium Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "TSS-25", name: "Tilapia Starter Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "1720", name: "Tilapia Grower 1720 Sinking", category: "Fish Feed", bag_size_kg: 25 },
  { code: "1810", name: "Carp Grower 1810 Sinking", category: "Fish Feed", bag_size_kg: 25 },
];

async function main() {
  console.log("=== Cleaning old product data ===\n");

  // Delete in correct order to respect foreign keys
  const salesCount = await prisma.salesLog.deleteMany({});
  console.log(`  Deleted ${salesCount.count} sales logs`);

  const invoiceCount = await prisma.invoice.deleteMany({});
  console.log(`  Deleted ${invoiceCount.count} invoices`);

  const receiveCount = await prisma.receiveLog.deleteMany({});
  console.log(`  Deleted ${receiveCount.count} receive logs`);

  const orderItemCount = await prisma.orderItem.deleteMany({});
  console.log(`  Deleted ${orderItemCount.count} order items`);

  const orderCount = await prisma.deliveryOrder.deleteMany({});
  console.log(`  Deleted ${orderCount.count} delivery orders`);

  const lotCount = await prisma.lotTracker.deleteMany({});
  console.log(`  Deleted ${lotCount.count} lot trackers`);

  const prodCount = await prisma.product.deleteMany({});
  console.log(`  Deleted ${prodCount.count} old products`);

  console.log("\n=== Adding new products ===\n");

  for (const prod of products) {
    await prisma.product.create({ data: prod });
    console.log(`  + [${prod.code}] ${prod.name} (${prod.bag_size_kg}kg) — ${prod.category}`);
  }

  console.log(`\n✅ Total ${products.length} products added successfully!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
