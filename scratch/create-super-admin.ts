import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = "Anwar@01744";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) throw new Error("Org not found");

  const user = await prisma.user.create({
    data: {
      org_id: org.id,
      name: "Pervez",
      email: "pervez",
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

  console.log("Super Admin created successfully:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
