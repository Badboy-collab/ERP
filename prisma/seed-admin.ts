import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding default Super Admin Anwar account...");

  const username = "admin";
  const plainPassword = "Anwar@01744";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Get organization
  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) {
    console.error("Organization not found. Please run backfill script first.");
    return;
  }

  // Check if admin already exists
  const existing = await prisma.user.findFirst({
    where: { org_id: org.id, email: username }
  });

  if (existing) {
    // Update password just in case
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password_hash: hashedPassword,
        role: "SUPER_ADMIN",
        can_create_do: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_create_sales: true,
        can_receive_stock: true,
        can_view_reports: true,
        can_view_accounting: true,
        can_manage_accounting: true,
      }
    });
    console.log("✓ Super Admin 'admin' updated successfully.");
  } else {
    await prisma.user.create({
      data: {
        org_id: org.id,
        name: "Anwar (Super Admin)",
        email: username,
        password_hash: hashedPassword,
        role: "SUPER_ADMIN",
        can_create_do: true,
        can_edit_sales: true,
        can_delete_sales: true,
        can_create_sales: true,
        can_receive_stock: true,
        can_view_reports: true,
        can_view_accounting: true,
        can_manage_accounting: true,
      }
    });
    console.log("+ Super Admin 'admin' created successfully.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
