import { randomBytes } from "crypto";
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

    const { applicationId, role } = await req.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required" },
        { status: 400 }
      );
    }

    if (!["viewer", "editor"].includes(role)) {
      return NextResponse.json(
        { error: "role must be 'viewer' or 'editor'" },
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

    // Only the owner can create share tokens
    if (!application || application.userId !== user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Generate a URL-safe token
    const token = randomBytes(24).toString("base64url");

    await prisma.appShareToken.create({
      data: {
        applicationId,
        token,
        role,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      token,
      role,
      url: `/join/${token}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}