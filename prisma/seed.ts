import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Matber Agro ERP database with Multi-Depot & RBAC Enterprise schema...");

  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) {
    console.error("Organization not found. Please run backfill script first.");
    return;
  }
  const org_id = org.id;

  // Clean existing tables
  await prisma.salesLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.receiveLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.lotTracker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.depot.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.product.deleteMany();

  // 1. Create Depots
  const depotCentral = await prisma.depot.create({
    data: { org_id,
      code: "DEP-MYM",
      name: "Central Depot Mymensingh",
      address: "Depot Zone, Mymensingh Sadar",
      phone: "+8801712345678",
    },
  });

  const depotBogura = await prisma.depot.create({
    data: { org_id,
      code: "DEP-BOG",
      name: "Bogura Regional Depot",
      address: "Bypass Road, Bogura",
      phone: "+8801898765432",
    },
  });

  // 2. Create Users
  await prisma.user.create({
    data: { org_id,
      name: "Pervez Hossain (Master Admin)",
      email: "admin@matberagro.com",
      password_hash: "admin123",
      role: "SUPER_ADMIN",
      depot_id: null,
    },
  });

  await prisma.user.create({
    data: { org_id,
      name: "Manager Mymensingh",
      email: "mymensingh@matberagro.com",
      password_hash: "depot123",
      role: "DEPOT_ADMIN",
      depot_id: depotCentral.id,
    },
  });

  await prisma.user.create({
    data: { org_id,
      name: "Operator Bogura",
      email: "bogura@matberagro.com",
      password_hash: "op123",
      role: "OPERATOR",
      depot_id: depotBogura.id,
    },
  });

  // 3. Create Products with Categories
  const prod1 = await prisma.product.create({
    data: { org_id,
      code: "P-BR01",
      name: "Broiler Starter Feed",
      category: "Poultry Feed",
      bag_size_kg: 50.0,
      opening_stock: 100,
    },
  });

  const prod2 = await prisma.product.create({
    data: { org_id,
      code: "P-LY02",
      name: "Layer Layer-1 Feed",
      category: "Poultry Feed",
      bag_size_kg: 50.0,
      opening_stock: 150,
    },
  });

  const prod3 = await prisma.product.create({
    data: { org_id,
      code: "P-FS03",
      name: "Floating Fish Feed 3mm",
      category: "Fish Feed",
      bag_size_kg: 25.0,
      opening_stock: 80,
    },
  });

  const prod4 = await prisma.product.create({
    data: { org_id,
      code: "P-CT04",
      name: "Cattle Fattening Feed",
      category: "Cattle Feed",
      bag_size_kg: 50.0,
      opening_stock: 50,
    },
  });

  // 4. Create Dealers
  const dealer1 = await prisma.dealer.create({
    data: { org_id,
      name: "Greenfield Poultry Farm",
      code: "DLR-SEED-1",
      phone: "+8801712345678",
      address: "Mymensingh Sadar, Mymensingh",
      current_balance: 150000.0,
      depot_id: depotCentral.id,
    },
  });

  const dealer2 = await prisma.dealer.create({
    data: { org_id,
      name: "Sunrise Agro Feed",
      code: "DLR-SEED-2",
      phone: "+8801998765432",
      address: "Bogura Sadar, Bogura",
      current_balance: 75000.0,
      depot_id: depotCentral.id,
    },
  });

  // 5. Create Lots for Depots
  const now = new Date();

  // URGENT Lot (expiring in 8 days)
  const expUrgent = new Date();
  expUrgent.setDate(now.getDate() + 8);

  const lot1 = await prisma.lotTracker.create({
    data: { org_id,
      depot_id: depotCentral.id,
      product_id: prod1.id,
      lot_no: "LOT-2026-BR-01",
      mfg_date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      exp_date: expUrgent,
      initial_qty: 200,
      sold_qty: 50,
      factory_return_qty: 0,
      transfer_qty: 0,
      available_qty: 150,
      status: "Active",
    },
  });

  // WARNING Lot (expiring in 18 days)
  const expWarning = new Date();
  expWarning.setDate(now.getDate() + 18);

  const lot2 = await prisma.lotTracker.create({
    data: { org_id,
      depot_id: depotCentral.id,
      product_id: prod2.id,
      lot_no: "LOT-2026-LY-01",
      mfg_date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      exp_date: expWarning,
      initial_qty: 120,
      sold_qty: 20,
      factory_return_qty: 0,
      transfer_qty: 0,
      available_qty: 100,
      status: "Active",
    },
  });

  // CAUTION Lot (expiring in 28 days) for Bogura Depot
  const expCaution = new Date();
  expCaution.setDate(now.getDate() + 28);

  const lot3 = await prisma.lotTracker.create({
    data: { org_id,
      depot_id: depotBogura.id,
      product_id: prod3.id,
      lot_no: "LOT-2026-FS-01",
      mfg_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      exp_date: expCaution,
      initial_qty: 100,
      sold_qty: 10,
      factory_return_qty: 0,
      transfer_qty: 0,
      available_qty: 90,
      status: "Active",
    },
  });

  // 6. Create Delivery Orders
  const order1 = await prisma.deliveryOrder.create({
    data: { org_id,
      depot_id: depotCentral.id,
      dealer_id: dealer1.id,
      order_no: "DO-2026-001",
      order_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "Pending",
      items: {
        create: [
          {
            product_id: prod1.id,
            ordered_qty: 50,
            delivered_qty: 0,
            pending_qty: 50,
          },
          {
            product_id: prod2.id,
            ordered_qty: 40,
            delivered_qty: 0,
            pending_qty: 40,
          },
        ],
      },
    },
  });

  // 7. Create Sample Invoice
  await prisma.invoice.create({
    data: { org_id,
      depot_id: depotCentral.id,
      invoice_no: "INV-889901",
      transaction_type: "SALES",
      date: new Date(),
      dealer_id: dealer1.id,
      order_id: order1.id,
      notes: "Sample dispatch for Mymensingh Central Depot",
      items: {
        create: [
          {
            org_id,
            depot_id: depotCentral.id,
            invoice_no: "INV-889901",
            transaction_type: "SALES",
            dealer_id: dealer1.id,
            order_id: order1.id,
            product_id: prod1.id,
            lot_id: lot1.id,
            quantity: 20,
          },
          {
            org_id,
            depot_id: depotCentral.id,
            invoice_no: "INV-889901",
            transaction_type: "SALES",
            dealer_id: dealer1.id,
            order_id: order1.id,
            product_id: prod2.id,
            lot_id: lot2.id,
            quantity: 15,
          },
        ],
      },
    },
  });

  console.log("Multi-Depot & RBAC Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
