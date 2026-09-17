import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import path from "path";
import { FREE_LIMITS } from "@/lib/usage/limits";

export const dynamic = "force-dynamic";


const ALLOWED_EXTENSIONS = [".xlsx", ".csv"];

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID required" },
        { status: 400 }
      );
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

        if (file.size > FREE_LIMITS.maxFileSizeBytes) {
      return NextResponse.json(
        {
          error: `File too large. Free plan supports files up to ${
            FREE_LIMITS.maxFileSizeBytes / 1024 / 1024
          } MB.`,
          code: "LIMIT_REACHED",
          limit: "fileSize",
        },
        { status: 402 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Only .xlsx and .csv files are supported." },
        { status: 400 }
      );
    }

    // Build a safe storage key
    const safeFilename = `${Date.now()}-${file.name.replace(
      /[^a-zA-Z0-9.\-_]/g,
      "_"
    )}`;
    const blobPath = `applications/${applicationId}/${safeFilename}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Save metadata in the database
    const workbook = await prisma.workbook.create({
      data: {
        applicationId,
        filename: file.name,
        fileType: ext.replace(".", ""),
        fileSize: file.size,
        storagePath: blob.url,
        status: "UPLOADED",
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "UPLOADED" },
    });

    return NextResponse.json(workbook);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}