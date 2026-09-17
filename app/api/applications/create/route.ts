import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAppLimit } from "@/lib/usage/limits";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Application name is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
        const appLimit = await checkAppLimit(user.id, session.user.email);
    if (!appLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${appLimit.max} applications.`,
          code: "LIMIT_REACHED",
          limit: "apps",
          used: appLimit.used,
          max: appLimit.max,
        },
        { status: 402 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        name: name.trim(),
        status: "DRAFT",
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}