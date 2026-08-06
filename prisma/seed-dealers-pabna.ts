import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dealers = [
  { name: "Sarder Poultry Dairy & Fisheries", phone: "N/A" },
  { name: "Nazat Enterprize", phone: "N/A" },
  { name: "M/s. Zishan Poultry Feed & Medicin Corner", phone: "N/A" },
  { name: "Afia Poultry Feed & Chowul Ghore", phone: "N/A" },
  { name: "Vai Vai Poultry Khaddo Vander", phone: "N/A" },
  { name: "M/s Azim Uddin Poultry Feed & Checks", phone: "N/A" },
  { name: "Motin Motos Khamar", phone: "N/A" },
  { name: "Shadeed Rayan Agrovet", phone: "N/A" },
  { name: "S S S Traders - Ullahpara Sirajganj", phone: "N/A" },
  { name: "Bondhu Poultry Feeds & Chicks", phone: "N/A" },
  { name: "R A Poultry Hours", phone: "N/A" },
  { name: "M/s. Maruf Variety Store", phone: "N/A" },
  { name: "Rakib Poultry Farm", phone: "N/A" },
  { name: "M/S Modern Poultry And Fish Feed", phone: "N/A" },
  { name: "M/S Khadiza Poultry Feed", phone: "N/A" },
  { name: "Eshan Poultry Fram & Feeds", phone: "N/A" },
];

async function main() {
  console.log("Adding Pabna Depot dealers...\n");

  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) {
    console.error("Organization not found. Please run backfill script first.");
    return;
  }
  const org_id = org.id;

  // Find or create Pabna Depot
  let depot = await prisma.depot.findFirst({
    where: { org_id, name: { contains: "Pabna" } }
  });

  if (!depot) {
    depot = await prisma.depot.create({
      data: {
        org_id,
        code: "DEP-PAB",
        name: "Pabna Depot",
        address: "Pabna, Bangladesh",
      }
    });
    console.log(`+ Created Pabna Depot: ${depot.name}`);
  }

  for (const dealer of dealers) {
    const existing = await prisma.dealer.findFirst({ where: { org_id, name: dealer.name } });
    if (existing) {
      console.log(`  ✓ Already exists: ${dealer.name}`);
    } else {
      await prisma.dealer.create({
        data: {
          org_id,
          name: dealer.name,
          phone: dealer.phone,
          depot_id: depot.id,
          code: `DLR-PAB-${Math.floor(1000 + Math.random() * 9000)}`,
        }
      });
      console.log(`  + Added: ${dealer.name}`);
    }
  }

  console.log("\n✅ All Pabna Depot dealers added successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
