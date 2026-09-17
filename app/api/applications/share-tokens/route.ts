import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.userId !== user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const tokens = await prisma.appShareToken.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" },
    });

    const members = await prisma.appMember.findMany({
      where: { applicationId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      tokens: tokens.map((t) => ({
        id: t.id,
        token: t.token,
        role: t.role,
        url: `/join/${t.token}`,
        createdAt: t.createdAt,
      })),
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load share tokens" },
      { status: 500 }
    );
  }
}