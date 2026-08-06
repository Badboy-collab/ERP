import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const prods = await prisma.product.findMany();
  console.log('Products:', prods.length);
  const dealers = await prisma.dealer.findMany();
  console.log('Dealers:', dealers.length);
}
main().finally(() => prisma.$disconnect());
