import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixOrderNumbers() {
  console.log("Starting Delivery Order number fix...");
  try {
    const orders = await prisma.deliveryOrder.findMany({
      orderBy: { createdAt: 'asc' },
      include: { depot: true }
    });

    console.log(`Found ${orders.length} delivery orders to process.`);

    // Group by depot + date
    const groups: { [key: string]: typeof orders } = {};

    for (const order of orders) {
      const dateStr = order.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      const yy = dateStr.slice(2, 4);
      const mm = dateStr.slice(5, 7);
      const dd = dateStr.slice(8, 10);
      
      let depotCode = "";
      if (order.depot && order.depot.code) {
        depotCode = order.depot.code.toUpperCase().replace(/DEP-?/g, "");
      }
      
      const prefix = depotCode ? `${depotCode}-${yy}${mm}${dd}` : `${yy}${mm}${dd}`;
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(order);
    }

    let updatedCount = 0;

    for (const prefix in groups) {
      const groupOrders = groups[prefix];
      for (let i = 0; i < groupOrders.length; i++) {
        const order = groupOrders[i];
        const seq = String(i + 1).padStart(3, '0');
        const correctOrderNo = `${prefix}${seq}`;
        
        if (order.order_no !== correctOrderNo) {
          console.log(`Updating Order ID ${order.id}: ${order.order_no} -> ${correctOrderNo}`);
          await prisma.deliveryOrder.update({
            where: { id: order.id },
            data: { order_no: correctOrderNo }
          });
          updatedCount++;
        }
      }
    }

    console.log(`Successfully fixed ${updatedCount} order numbers.`);

  } catch (error) {
    console.error("Error fixing orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderNumbers();
