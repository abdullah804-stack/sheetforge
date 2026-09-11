import { NextResponse } from "next/server";
// Load the generated client at runtime to support Prisma setups where the
// package does not expose PrismaClient through its TypeScript declarations.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      users: userCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}