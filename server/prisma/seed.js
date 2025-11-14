// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

async function main() {

  console.log("🌱 Seeding database...");

  // ---------------------------
  // 1. Create Admin User
  // ---------------------------
  const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✔ Admin user created:", adminUser.email);

  // ---------------------------
  // 2. Create Parent Categories
  // ---------------------------
  const officeCategory = await prisma.category.create({
    data: {
      name: "Office",
      meta: { description: "Office related expenses" },
    }
  });

  const travelCategory = await prisma.category.create({
    data: {
      name: "Travel",
      meta: { description: "Travel related expenses" },
    }
  });

  console.log("✔ Parent categories created");

  // ---------------------------
  // 3. Create Subcategories
  // ---------------------------
  const officeSupplies = await prisma.category.create({
    data: {
      name: "Office Supplies",
      parentId: officeCategory.id,
    }
  });

  const flightTickets = await prisma.category.create({
    data: {
      name: "Flight Tickets",
      parentId: travelCategory.id,
    }
  });

  console.log("✔ Subcategories created");

  // ---------------------------
  // 4. Create Example Transactions
  // ---------------------------
  const t1 = await prisma.transaction.create({
    data: {
      type: "debit",
      amount: 1200.50,
      categoryId: officeCategory.id,
      subcategoryId: officeSupplies.id,
      note: "Purchased printer ink",
      employee: "John Doe",
      reference: "INV-001",
      createdById: adminUser.id,
    }
  });

  const t2 = await prisma.transaction.create({
    data: {
      type: "debit",
      amount: 9500.00,
      categoryId: travelCategory.id,
      subcategoryId: flightTickets.id,
      note: "Mumbai flight ticket",
      employee: "Admin User",
      reference: "FLIGHT-101",
      createdById: adminUser.id,
    }
  });

  const t3 = await prisma.transaction.create({
    data: {
      type: "credit",
      amount: 50000,
      categoryId: officeCategory.id,
      note: "Client project payment",
      employee: "Admin",
      createdById: adminUser.id,
    }
  });

  console.log("✔ Sample transactions inserted");

  console.log("🌱 Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
