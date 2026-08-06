import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: "matber-agro" } });
  if (!org) throw new Error("Organization not found");

  // 1. Update Mymensingh depot user
  let mymensinghUser = await prisma.user.findFirst({
    where: { email: "mymensingh@matberagro.com" }
  });
  
  if (!mymensinghUser) {
    mymensinghUser = await prisma.user.findFirst({
      where: { name: "Manager Mymensingh" }
    });
  }
  
  if (mymensinghUser) {
    const hashed123456 = await bcrypt.hash("123456", 10);
    await prisma.user.update({
      where: { id: mymensinghUser.id },
      data: {
        name: "mymensingh-depot",
        email: "mymensingh-depot",
        password_hash: hashed123456
      }
    });
    console.log("Updated Mymensingh user.");
  } else {
    console.log("Mymensingh user not found.");
  }

  // 2. Delete Bogura depot
  const boguraDepot = await prisma.depot.findFirst({
    where: { name: { contains: "Bogura", mode: "insensitive" } }
  });

  if (boguraDepot) {
    await prisma.depot.delete({ where: { id: boguraDepot.id } });
    console.log("Deleted Bogura depot.");
  } else {
    console.log("Bogura depot not found.");
  }

  // delete bogura user just in case
  const boguraUser = await prisma.user.findFirst({
    where: { email: "bogura@matberagro.com" }
  });
  if (boguraUser) {
    await prisma.user.delete({ where: { id: boguraUser.id } });
    console.log("Deleted Bogura user.");
  }

  // 3. Create Pabna depot and user
  let pabnaDepot = await prisma.depot.findFirst({
    where: { name: { contains: "Pabna", mode: "insensitive" } }
  });
  if (!pabnaDepot) {
    pabnaDepot = await prisma.depot.create({
      data: {
        org_id: org.id,
        name: "Pabna Depot",
        code: "DEP-PAB",
        address: "Pabna, Bangladesh",
      }
    });
    console.log("Created Pabna depot.");
  }

  const hashedAnwar = await bcrypt.hash("Anwar@01744", 10);
  const pabnaUser = await prisma.user.findFirst({ where: { email: "pabna-depot" } });
  if (!pabnaUser) {
    await prisma.user.create({
      data: {
        org_id: org.id,
        name: "pabna-depot",
        email: "pabna-depot",
        password_hash: hashedAnwar,
        role: "DEPOT_ADMIN",
        depot_id: pabnaDepot.id,
        can_create_do: true,
        can_edit_sales: true,
        can_delete_sales: false,
        can_create_sales: true,
        can_receive_stock: true,
        can_view_reports: true,
        can_view_accounting: false,
        can_manage_accounting: false,
      }
    });
    console.log("Created Pabna user.");
  }
}

main().finally(() => prisma.$disconnect());
