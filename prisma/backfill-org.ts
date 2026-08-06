/**
 * NEXORA ERP — Phase 1 Step 1.2: Data Backfill Script
 * 
 * This script:
 * 1. Creates Organization #1 (Matber Agro Industries Ltd.)
 * 2. Creates a default Subscription for Org #1
 * 3. Updates ALL existing records with org_id = Org #1's ID
 * 4. Verifies zero NULL org_id records remain
 * 
 * Run with: npx tsx prisma/backfill-org.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 NEXORA ERP — Multi-Tenant Data Backfill");
  console.log("=".repeat(60));

  // Step 1: Create Organization #1
  console.log("\n📋 Step 1: Creating Organization #1...");

  let org = await prisma.organization.findFirst({
    where: { slug: "matber-agro" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Matber Agro Industries Ltd.",
        slug: "matber-agro",
        industry_type: "Agro",
        business_type: "Private",
        country: "Bangladesh",
        currency: "BDT",
        timezone: "Asia/Dhaka",
        language: "en",
        financial_year: "January",
        theme_color: "#10b981",
        status: "Active",
        template: "Agro Industry",
      },
    });
    console.log(`✅ Organization created: ${org.name} (${org.id})`);
  } else {
    console.log(`ℹ️  Organization already exists: ${org.name} (${org.id})`);
  }

  const orgId = org.id;

  // Step 2: Create Subscription
  console.log("\n📋 Step 2: Creating Subscription...");

  const existingSub = await prisma.subscription.findFirst({
    where: { org_id: orgId },
  });

  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        org_id: orgId,
        plan: "Enterprise",
        status: "Active",
        max_users: 100,
        max_branches: 50,
        max_warehouses: 50,
        max_storage_mb: 10000,
        max_modules: 20,
        api_access: true,
        ai_access: true,
        backup_limit: 30,
        file_storage_mb: 5000,
      },
    });
    console.log("✅ Enterprise subscription created");
  } else {
    console.log("ℹ️  Subscription already exists");
  }

  // Step 3: Backfill all tables
  console.log("\n📋 Step 3: Backfilling org_id on all tables...");

  const tables = [
    "Depot",
    "User",
    "Product",
    "Dealer",
    "LotTracker",
    "DeliveryOrder",
    "Invoice",
    "SalesLog",
    "ReceiveLog",
    "FinancialTransaction",
    "DepotTransaction",
    "StockTransfer",
  ];

  for (const table of tables) {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "org_id" = $1 WHERE "org_id" IS NULL`,
      orgId
    );
    console.log(`  ✅ ${table}: ${result} rows updated`);
  }

  // Step 4: Verify
  console.log("\n📋 Step 4: Verifying zero NULL org_id records...");

  let allClean = true;
  for (const table of tables) {
    const result: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${table}" WHERE "org_id" IS NULL`
    );
    const nullCount = Number(result[0].count);
    if (nullCount > 0) {
      console.log(`  ❌ ${table}: ${nullCount} records still have NULL org_id!`);
      allClean = false;
    } else {
      console.log(`  ✅ ${table}: clean`);
    }
  }

  if (allClean) {
    console.log("\n🎉 SUCCESS! All records have been backfilled with org_id.");
    console.log(`   Organization: ${org.name}`);
    console.log(`   Org ID: ${orgId}`);
    console.log("\n   Next step: Update schema to make org_id required,");
    console.log("   then run 'npx prisma db push' again.");
  } else {
    console.log("\n❌ FAILURE: Some records still have NULL org_id. Fix manually.");
    process.exit(1);
  }

  // Step 5: Create default modules
  console.log("\n📋 Step 5: Creating default modules...");

  const moduleKeys = [
    "dashboard", "inventory", "sales", "purchase", "finance",
    "accounts", "expense", "crm", "hr", "pos", "reports", "ai_assistant"
  ];

  for (const key of moduleKeys) {
    const exists = await prisma.organizationModule.findFirst({
      where: { org_id: orgId, module_key: key },
    });
    if (!exists) {
      await prisma.organizationModule.create({
        data: { org_id: orgId, module_key: key, is_enabled: true },
      });
    }
  }
  console.log("✅ Default modules created");

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Backfill complete!");
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
