import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "token required" },
        { status: 400 }
      );
    }

    const shareToken = await prisma.appShareToken.findUnique({
      where: { token },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            theme: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!shareToken) {
      return NextResponse.json(
        { error: "This invite link is invalid or has been revoked." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      appName: shareToken.application.name,
      theme: shareToken.application.theme,
      logoUrl: shareToken.application.logoUrl,
      role: shareToken.role,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load invite" },
      { status: 500 }
    );
  }
}