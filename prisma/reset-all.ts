import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Deleting ALL data from database...\n");

  // Delete in correct order (child → parent)
  const s1 = await prisma.salesLog.deleteMany({});
  console.log(`  ✓ SalesLog: ${s1.count} deleted`);

  const s2 = await prisma.invoice.deleteMany({});
  console.log(`  ✓ Invoice: ${s2.count} deleted`);

  const s3 = await prisma.receiveLog.deleteMany({});
  console.log(`  ✓ ReceiveLog: ${s3.count} deleted`);

  const s4 = await prisma.orderItem.deleteMany({});
  console.log(`  ✓ OrderItem: ${s4.count} deleted`);

  const s5 = await prisma.deliveryOrder.deleteMany({});
  console.log(`  ✓ DeliveryOrder: ${s5.count} deleted`);

  const s6 = await prisma.lotTracker.deleteMany({});
  console.log(`  ✓ LotTracker: ${s6.count} deleted`);

  const s7 = await prisma.product.deleteMany({});
  console.log(`  ✓ Product: ${s7.count} deleted`);

  const s8 = await prisma.dealer.deleteMany({});
  console.log(`  ✓ Dealer: ${s8.count} deleted`);

  const s9 = await prisma.user.deleteMany({});
  console.log(`  ✓ User: ${s9.count} deleted`);

  const s10 = await prisma.depot.deleteMany({});
  console.log(`  ✓ Depot: ${s10.count} deleted`);

  console.log("\n✅ ALL DATA CLEARED! Database is now empty.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
