import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrateOrders() {
  console.log("Starting Delivery Order migration to yearly atomic sequence...");
  try {
    const orders = await prisma.deliveryOrder.findMany({
      orderBy: { createdAt: 'asc' },
      include: { depot: true }
    });

    console.log(`Found ${orders.length} delivery orders to migrate.`);

    // Group by depot + year
    const groups: { [key: string]: typeof orders } = {};

    for (const order of orders) {
      const yyyy = order.createdAt.getFullYear();
      let depotCode = "";
      if (order.depot && order.depot.code) {
        depotCode = order.depot.code.toUpperCase().replace(/DEP-?/g, "");
      }
      
      const groupKey = `${depotCode}_${yyyy}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(order);
    }

    let updatedCount = 0;

    for (const groupKey in groups) {
      const [depotCode, yyyy] = groupKey.split('_');
      const sequenceName = `DO_${depotCode || 'DEFAULT'}_${yyyy}`;
      const groupOrders = groups[groupKey];
      
      console.log(`Processing group ${groupKey} with ${groupOrders.length} orders...`);
      
      let orgId = "";
      
      // Step 1: Give everyone a temp suffix to avoid unique constraint collisions
      for (const order of groupOrders) {
         if (!order.order_no.endsWith('-TEMP')) {
            await prisma.deliveryOrder.update({
              where: { id: order.id },
              data: { order_no: `${order.order_no}-TEMP` }
            });
         }
      }

      // Step 2: Assign final sequential numbers
      for (let i = 0; i < groupOrders.length; i++) {
        const order = groupOrders[i];
        orgId = order.org_id;
        
        const dateStr = order.createdAt.toISOString().slice(0, 10);
        const yy = dateStr.slice(2, 4);
        const mm = dateStr.slice(5, 7);
        const dd = dateStr.slice(8, 10);
        
        const prefix = depotCode ? `${depotCode}-${yy}${mm}${dd}` : `${yy}${mm}${dd}`;
        
        // Ensure atomic sequential numbering matching index + 1
        const seqVal = i + 1;
        const seqStr = String(seqVal).padStart(3, '0');
        const correctOrderNo = `${prefix}${seqStr}`;
        
        console.log(`Updating Order ID ${order.id}: final sequence -> ${correctOrderNo}`);
        await prisma.deliveryOrder.update({
          where: { id: order.id },
          data: { order_no: correctOrderNo }
        });
        updatedCount++;
      }
      
      // Update Sequence table to ensure the next generated ID continues correctly
      if (orgId) {
        await prisma.sequence.upsert({
          where: { org_id_name: { org_id: orgId, name: sequenceName } },
          update: { value: groupOrders.length },
          create: { org_id: orgId, name: sequenceName, value: groupOrders.length }
        });
        console.log(`Set Sequence '${sequenceName}' to ${groupOrders.length}`);
      }
    }

    console.log(`Successfully migrated ${updatedCount} order numbers and updated sequences.`);

  } catch (error) {
    console.error("Error migrating orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateOrders();
