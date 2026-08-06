import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const allProducts = await prisma.product.findMany({});
  console.log(`Total products in DB: ${allProducts.length}`);
  for (const p of allProducts) {
    console.log(`- [${p.code}] ${p.name} (org_id: ${p.org_id})`);
  }

  const orgs = await prisma.organization.findMany({});
  console.log(`\nOrganizations:`);
  for (const o of orgs) {
    console.log(`- ${o.id}: ${o.name} (${o.slug})`);
  }
}

main().finally(() => prisma.$disconnect());
