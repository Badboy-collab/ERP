import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const depots = await prisma.depot.findMany({ select: { id: true, name: true, code: true } });
  console.log("Depots:", JSON.stringify(depots, null, 2));
}

main().finally(() => prisma.$disconnect());
