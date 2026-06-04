import { PrismaClient, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = [
  { name: "Food & dining",   icon: "utensils",    color: "#E05A6A" },
  { name: "Groceries",       icon: "shopping-bag", color: "#F59C3A" },
  { name: "Transport",       icon: "car",          color: "#3A7BD5" },
  { name: "Entertainment",   icon: "film",         color: "#7C5CBF" },
  { name: "Health",          icon: "heart-pulse",  color: "#2EB87E" },
  { name: "Shopping",        icon: "shopping-cart", color: "#E05A6A" },
  { name: "Bills & utilities", icon: "zap",        color: "#F59C3A" },
  { name: "Rent",            icon: "home",         color: "#1E2B3C" },
  { name: "Education",       icon: "book",         color: "#5A8FAA" },
  { name: "Travel",          icon: "plane",        color: "#3A7BD5" },
  { name: "Personal care",   icon: "sparkles",     color: "#D4537E" },
  { name: "Other expense",   icon: "circle",       color: "#6B8099" },
];

const INCOME_CATEGORIES = [
  { name: "Salary",          icon: "briefcase",    color: "#2EB87E" },
  { name: "Freelance",       icon: "laptop",       color: "#3A7BD5" },
  { name: "Investments",     icon: "trending-up",  color: "#7C5CBF" },
  { name: "Gifts",           icon: "gift",         color: "#F59C3A" },
  { name: "Business",        icon: "building",     color: "#1E2B3C" },
  { name: "Other income",    icon: "circle",       color: "#6B8099" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Demo user
  const hashedPw = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where:  { email: "demo@trackr.app" },
    update: {},
    create: {
      name:     "Arjun Sharma",
      email:    "demo@trackr.app",
      password: hashedPw,
      currency: "INR",
      locale:   "en-IN",
    },
  });

  console.log(`✅ Demo user: ${user.email} / password123`);

  // Default categories
  for (const cat of EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where:  { userId_name_type: { userId: user.id, name: cat.name, type: "EXPENSE" } },
      update: {},
      create: { ...cat, userId: user.id, type: "EXPENSE", isDefault: true },
    });
  }

  for (const cat of INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where:  { userId_name_type: { userId: user.id, name: cat.name, type: "INCOME" } },
      update: {},
      create: { ...cat, userId: user.id, type: "INCOME", isDefault: true },
    });
  }

  console.log("✅ Default categories seeded");

  // Sample contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where:  { userId_name: { userId: user.id, name: "Ravi Kumar" } },
      update: {},
      create: { userId: user.id, name: "Ravi Kumar", phone: "+91 98765 43210" },
    }),
    prisma.contact.upsert({
      where:  { userId_name: { userId: user.id, name: "Priya Singh" } },
      update: {},
      create: { userId: user.id, name: "Priya Singh", email: "priya@example.com" },
    }),
  ]);

  console.log("✅ Sample contacts seeded");
  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
