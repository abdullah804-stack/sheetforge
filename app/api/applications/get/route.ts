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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        workbooks: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!application || application.userId !== user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
            application: {
        id: application.id,
        name: application.name,
        status: application.status,
        type: application.type,
        createdAt: application.createdAt,
        definition: application.definition,
        slug: application.slug,
        visibility: application.visibility,
        publishedAt: application.publishedAt,
        theme: application.theme,
        logoUrl: application.logoUrl,
      },
      workbook: application.workbooks[0] || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load application" },
      { status: 500 }
    );
  }
}