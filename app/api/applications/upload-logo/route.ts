import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_SIZE = 200 * 1024; // 200 KB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file || !applicationId) {
      return NextResponse.json(
        { error: "File and applicationId required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Logo must be 200 KB or smaller" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, SVG, or WebP allowed" },
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

    // Delete the old logo if it exists
    if (application.logoUrl) {
      try {
        await del(application.logoUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (e) {
        // Ignore — the old blob may not exist anymore
      }
    }

    const ext = path.extname(file.name).toLowerCase() || ".png";
    const key = `logos/${applicationId}/${Date.now()}${ext}`;

    const blob = await put(key, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { logoUrl: blob.url },
    });

    return NextResponse.json({ logoUrl: blob.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Logo upload failed" },
      { status: 500 }
    );
  }
}