import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (typeof name !== "string" || name.length > 80) {
      return NextResponse.json(
        { error: "Name must be a string under 80 characters" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() || null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}