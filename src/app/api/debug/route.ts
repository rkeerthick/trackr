import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, string> = {
    DATABASE_URL:    process.env.DATABASE_URL ? "set" : "MISSING",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "MISSING",
    AUTH_SECRET:     process.env.AUTH_SECRET ? "set" : "MISSING",
    NODE_ENV:        process.env.NODE_ENV ?? "unknown",
  };

  let dbStatus = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e: unknown) {
    dbStatus = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ checks, dbStatus });
}
