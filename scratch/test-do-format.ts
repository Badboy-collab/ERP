import { PrismaClient } from "@prisma/client";
import { ERPService } from "../lib/services/erpService";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  const depot = await prisma.depot.findFirst({ where: { code: "DEP-PAB" } });
  
  if (org && depot) {
    const nextDO = await ERPService.getNextDONumber(org.id, depot.id);
    console.log("Next DO Number generated:", nextDO);
  } else {
    console.log("Org or Depot not found");
  }
}

main().finally(() => prisma.$disconnect());
