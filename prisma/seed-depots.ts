import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const depots = [
  { code: "HO", name: "Head Office" },
  { code: "PU-01", name: "Production Unit 01" },
  { code: "PU-02", name: "Production Unit 02" },
  { code: "DEP-BRH", name: "Baroiyerhat Depot" },
  { code: "SEC-01", name: "Section 01" },
  { code: "FW", name: "Factory Warehouse" },
  { code: "SEC-02", name: "Section 02" },
  { code: "TW", name: "Transit Warehouse" },
  { code: "DEP-PAB", name: "Pabna Depot" },
  { code: "DEP-MYM", name: "Mymensingh Depot" },
  { code: "DEP-CUM", name: "Cumilla Depot" },
  { code: "DEP-NOA", name: "Noakhali Depot" },
  { code: "DEP-RAJ", name: "Rajshahi Depot" },
  { code: "DEP-BOG", name: "Bogura Depot" },
  { code: "DEP-MAD", name: "Madaripur Depot" },
  { code: "DEP-JHE", name: "Jhenaidah Depot" },
  { code: "DEP-TAN", name: "Tangail Depot" },
  { code: "DEP-KHU", name: "Khulna Depot" },
  { code: "GDN-MB", name: "Godown - Member Bari" },
];

async function main() {
  console.log("Adding depots & sections...\n");

  for (const depot of depots) {
    const existing = await prisma.depot.findUnique({ where: { code: depot.code } });
    if (existing) {
      console.log(`  ✓ Already exists: ${depot.name} (${depot.code})`);
    } else {
      await prisma.depot.create({ data: depot });
      console.log(`  + Added: ${depot.name} (${depot.code})`);
    }
  }

  console.log("\n✅ All depots & sections added successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
