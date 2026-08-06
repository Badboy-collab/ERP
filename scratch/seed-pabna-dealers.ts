import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) throw new Error("Org not found");

  const pabnaDepot = await prisma.depot.findFirst({
    where: { name: { contains: "Pabna", mode: "insensitive" }, org_id: org.id }
  });
  if (!pabnaDepot) throw new Error("Pabna depot not found");

  const dealers = [
    "Sarder Poultry Dairy & fisheries",
    "Nazat Enterprize",
    "M/s.Zishan poultry feed & medicin corner",
    "Afia Poultry Feed & Chowul Ghore.",
    "Vai Vai poultry khaddo vander.",
    "M/s Azim Uddin Poultry Feed & Checks",
    "Motin Motos Khamar",
    "Shadeed Rayan Agrovet",
    "S S S Traders -Ullahpara Sirajganj",
    "Bondhu poultry feeds & chicks.",
    "R A Poultry Hours",
    "M/s.Maruf variety Store",
    "Rakib Poultry Farm",
    "M/S Modern Poultry And Fish Feed.",
    "M/S Khadiza Poultry Feed.",
    "Eshan poultry Fram & feeds"
  ];

  let currentCount = await prisma.dealer.count({ where: { org_id: org.id } });

  for (const dealerName of dealers) {
    const existing = await prisma.dealer.findFirst({
      where: { org_id: org.id, name: dealerName }
    });

    if (!existing) {
      currentCount++;
      const code = `DLR-${String(currentCount).padStart(3, '0')}`;
      await prisma.dealer.create({
        data: {
          org_id: org.id,
          name: dealerName,
          code: code,
          phone: "N/A",
          depot_id: pabnaDepot.id,
        }
      });
      console.log(`Created dealer: ${dealerName} (${code})`);
    } else {
      console.log(`Dealer exists: ${dealerName}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
