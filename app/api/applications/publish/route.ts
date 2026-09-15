import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await req.json();
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

    if (!application.definition) {
      return NextResponse.json(
        { error: "Generate the application first" },
        { status: 400 }
      );
    }

    // Generate a slug if one doesn't exist yet, and retry on collision
    let slug = application.slug;

    if (!slug) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateSlug(application.name);
        const existing = await prisma.application.findUnique({
          where: { slug: candidate },
        });
        if (!existing) {
          slug = candidate;
          break;
        }
      }

      if (!slug) {
        return NextResponse.json(
          { error: "Could not generate a unique URL. Try again." },
          { status: 500 }
        );
      }
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        slug,
        visibility: "PUBLIC",
        publishedAt: new Date(),
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({
      slug: updated.slug,
      url: `/a/${updated.slug}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}