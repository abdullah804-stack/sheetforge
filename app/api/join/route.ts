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

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "token required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const shareToken = await prisma.appShareToken.findUnique({
      where: { token },
      include: {
        application: {
          select: { id: true, name: true, userId: true },
        },
      },
    });

    if (!shareToken) {
      return NextResponse.json(
        { error: "This invite link is invalid or has been revoked." },
        { status: 404 }
      );
    }

    // Owner already has access
    if (shareToken.application.userId === user.id) {
      return NextResponse.json({
        applicationId: shareToken.application.id,
        alreadyMember: true,
      });
    }

    // Already a member? (upsert handles this)
    await prisma.appMember.upsert({
      where: {
        applicationId_userId: {
          applicationId: shareToken.applicationId,
          userId: user.id,
        },
      },
      update: {
        role: shareToken.role,
      },
      create: {
        applicationId: shareToken.applicationId,
        userId: user.id,
        role: shareToken.role,
      },
    });

    return NextResponse.json({
      applicationId: shareToken.application.id,
      alreadyMember: false,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}