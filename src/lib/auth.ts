import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const EXPENSE_CATEGORIES = [
  { name: "Food & dining",     icon: "utensils",      color: "#E05A6A" },
  { name: "Groceries",         icon: "shopping-bag",  color: "#F59C3A" },
  { name: "Transport",         icon: "car",           color: "#3A7BD5" },
  { name: "Entertainment",     icon: "film",          color: "#7C5CBF" },
  { name: "Health",            icon: "heart-pulse",   color: "#2EB87E" },
  { name: "Shopping",          icon: "shopping-cart", color: "#E05A6A" },
  { name: "Bills & utilities", icon: "zap",           color: "#F59C3A" },
  { name: "Rent",              icon: "home",          color: "#1E2B3C" },
  { name: "Education",         icon: "book",          color: "#5A8FAA" },
  { name: "Travel",            icon: "plane",         color: "#3A7BD5" },
  { name: "Personal care",     icon: "sparkles",      color: "#D4537E" },
  { name: "Other expense",     icon: "circle",        color: "#6B8099" },
];

const INCOME_CATEGORIES = [
  { name: "Salary",      icon: "briefcase",   color: "#2EB87E" },
  { name: "Freelance",   icon: "laptop",      color: "#3A7BD5" },
  { name: "Investments", icon: "trending-up", color: "#7C5CBF" },
  { name: "Gifts",       icon: "gift",        color: "#F59C3A" },
  { name: "Business",    icon: "building",    color: "#1E2B3C" },
  { name: "Other income",icon: "circle",      color: "#6B8099" },
];

async function seedDefaultCategories(userId: string) {
  const data = [
    ...EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as const, userId, isDefault: true })),
    ...INCOME_CATEGORIES.map((c)  => ({ ...c, type: "INCOME"  as const, userId, isDefault: true })),
  ];
  await prisma.category.createMany({ data, skipDuplicates: true });
}

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        // Seed default categories and set defaults for OAuth-created users
        await Promise.all([
          seedDefaultCategories(user.id),
          prisma.user.update({
            where: { id: user.id },
            data:  { currency: "INR", locale: "en-IN" },
          }),
        ]);
      }
    },
  },
};
