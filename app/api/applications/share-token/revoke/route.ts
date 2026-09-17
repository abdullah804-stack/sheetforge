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

    const { tokenId } = await req.json();
    if (!tokenId) {
      return NextResponse.json(
        { error: "tokenId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await prisma.appShareToken.findUnique({
      where: { id: tokenId },
      include: { application: true },
    });

    if (!token || token.application.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.appShareToken.delete({ where: { id: tokenId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to revoke link" },
      { status: 500 }
    );
  }
}