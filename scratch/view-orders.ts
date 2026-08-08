import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function viewOrders() {
  const orders = await prisma.deliveryOrder.findMany({
    include: { depot: true }
  });
  console.log(JSON.stringify(orders.map(o => ({ id: o.id, order_no: o.order_no, depotCode: o.depot?.code, createdAt: o.createdAt })), null, 2));
}

viewOrders().finally(() => prisma.$disconnect());
