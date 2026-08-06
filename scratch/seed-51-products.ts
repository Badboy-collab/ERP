import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) throw new Error("Org not found");

  const productsData = [
    { cat: "Broiler", data: [
      { name: "Broiler Starter (C) 510", code: "510", bag: 50 },
      { name: "Broiler Grower (P) 520", code: "520", bag: 50 },
      { name: "Broiler Finisher(P) 530", code: "530", bag: 50 },
      { name: "Broiler House Feed (G)", code: "BHF-G", bag: 25 },
    ]},
    { cat: "Layer", data: [
      { name: "Layer Starter(C) 710", code: "710", bag: 50 },
      { name: "Layer Grower/Crumble 750", code: "750", bag: 50 },
      { name: "Layer Grower/Mash", code: "LGM", bag: 50 },
      { name: "Layer Layer-1 (M) 720", code: "720", bag: 50 },
      { name: "Layer Layer-2", code: "LL2", bag: 50 },
    ]},
    { cat: "Sonali", data: [
      { name: "Sonali Starter (C) 610", code: "610", bag: 50 },
      { name: "Sonali Grower (P) 620", code: "620", bag: 50 },
    ]},
    { cat: "Cattle", data: [
      { name: "Cattle Dairyl Mash/Premium 850", code: "850", bag: 25 },
      { name: "Cattle Fatte./Mash/Pre. 820", code: "820", bag: 25 },
      { name: "Cattle Dairyl Economy 860", code: "860", bag: 25 },
      { name: "Cattle Fattening/Economy 830", code: "830", bag: 25 },
      { name: "Cattle Fatteing Classic 880", code: "880", bag: 25 },
    ]},
    { cat: "Nusery", data: [
      { name: "Hatchery Powder 1510", code: "1510", bag: 10 },
      { name: "Pre-Nusery-2 920", code: "920", bag: 10 },
      { name: "Koi/Shing/Pabda Pre-Sta-1 930", code: "930", bag: 20 },
      { name: "Koi/Shing Pre-Starter", code: "KSP", bag: 20 },
      { name: "Pabda/Gulsha Pre-Starter", code: "PGP", bag: 20 },
      { name: "Pabda/Gulsha Starter", code: "PGS", bag: 20 },
      { name: "Pahda/Gulsha Growe", code: "PGG", bag: 20 },
    ]},
    { cat: "Floating Oil Coated", data: [
      { name: "Koi/Shing Starter -2.00 mm Floating Oil Coated", code: "FOC-01", bag: 20 },
      { name: "Koi/Shing Grower -2.50 mm Floating Oil Coated", code: "FOC-02", bag: 20 },
      { name: "Pangus Pre-Starter Floating Oil Coated", code: "FOC-03", bag: 20 },
      { name: "Pangus Starter 2 mm 1220 Floating Oil Coated", code: "1220", bag: 20 },
      { name: "Pangus Grower 3 mm 1230 Floating Oil Coated", code: "1230", bag: 20 },
      { name: "Pangus Finisher 1240 Floating Oil Coated", code: "1240", bag: 20 },
      { name: "Tilapia Pre-Starter Floating Oil Coated", code: "FOC-04", bag: 20 },
      { name: "Tilapia Starter 1320 Floating Oil Coated", code: "1320", bag: 20 },
      { name: "Tilapia Grower 1330 Floating Oil Coated", code: "1330", bag: 20 },
      { name: "Tilapia Finisher 1360 Floating Oil Coated", code: "1360", bag: 20 },
    ]},
    { cat: "Floating Non Oil Coated", data: [
      { name: "Pangus Starter Floating Non Oil Coated", code: "FNO-01", bag: 20 },
      { name: "Pangus Grower Floating Non Oil Coated", code: "FNO-02", bag: 20 },
      { name: "Pangus Finisher 1260 Floating Non Oil Coated", code: "1260", bag: 20 },
      { name: "Tilapia Starter Floating Non Oil Coated", code: "FNO-03", bag: 20 },
      { name: "Tilapia Grower 1350 Floating Non Oil Coated", code: "1350", bag: 20 },
      { name: "Tilapia Finisher Floating Non Oil Coated", code: "FNO-04", bag: 20 },
      { name: "Carp Starter FL N/O- 2MM 1410 Floating Non Oil Coated", code: "1410", bag: 20 },
      { name: "Carp Grower Mishra 968 Floating Non Oil Coated", code: "968", bag: 20 },
      { name: "Carp Grower 3mm 1420 Floating Non Oil Coated", code: "1420", bag: 20 },
      { name: "Carp Grower/Economy 4 mm 1430 Floating Non Oil Coated", code: "1430", bag: 20 },
    ]},
    { cat: "Sinking", data: [
      { name: "Pangus Starter/Diamond Sinking", code: "SNK-01", bag: 25 },
      { name: "Pangus Grower/Diamond Sinking", code: "SNK-02", bag: 25 },
      { name: "Pangus Finisher /Diamond Sinking", code: "SNK-03", bag: 25 },
      { name: "Pangus Growerl Premium 1640 Sinking", code: "1640", bag: 25 },
      { name: "Pangus Finisher /Premium Sinking", code: "SNK-04", bag: 25 },
      { name: "Tilapia Starter Sinking", code: "SNK-05", bag: 25 },
      { name: "Tilapia Grower 1720 Sinking", code: "1720", bag: 25 },
      { name: "Carp Grower 1810 Sinking", code: "1810", bag: 25 },
    ]},
  ];

  let added = 0;
  for (const group of productsData) {
    for (const p of group.data) {
      // Check if code exists to prevent unique constraint error
      const existing = await prisma.product.findFirst({
        where: { org_id: org.id, code: p.code }
      });
      
      if (!existing) {
        await prisma.product.create({
          data: {
            org_id: org.id,
            category: group.cat,
            name: p.name,
            code: p.code,
            bag_size_kg: p.bag,
            opening_stock: 0,
            sort_order: added
          }
        });
        added++;
        console.log(`Added: [${p.code}] ${p.name}`);
      } else {
        console.log(`Exists: [${p.code}] ${p.name}`);
      }
    }
  }
  
  console.log(`Total new products added: ${added}`);
}

main().finally(() => prisma.$disconnect());
