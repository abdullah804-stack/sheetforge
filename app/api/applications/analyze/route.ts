import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/parser/csv";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workbookId } = await req.json();

    if (!workbookId) {
      return NextResponse.json(
        { error: "workbookId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workbook = await prisma.workbook.findUnique({
      where: { id: workbookId },
      include: { application: true },
    });

    if (!workbook || workbook.application.userId !== user.id) {
      return NextResponse.json(
        { error: "Workbook not found" },
        { status: 404 }
      );
    }

    if (workbook.fileType !== "csv") {
      return NextResponse.json(
        { error: "Only CSV is supported for now" },
        { status: 400 }
      );
    }

    // Fetch file from Vercel Blob (private store — needs auth token)
    const fileRes = await fetch(workbook.storagePath, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!fileRes.ok) {
      throw new Error(`Failed to fetch blob: ${fileRes.status}`);
    }

    const content = await fileRes.text();

    const parsed = await parseCSV(content, workbook.filename);

    await prisma.workbook.update({
      where: { id: workbook.id },
      data: {
        parsedData: parsed as any,
        status: "PARSED",
        parseError: null,
      },
    });

    await prisma.application.update({
      where: { id: workbook.applicationId },
      data: { status: "PARSED" },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);

    // Try to record parse error if we have the workbook
    try {
      const { workbookId } = await req.clone().json();
      if (workbookId) {
        await prisma.workbook.update({
          where: { id: workbookId },
          data: {
            status: "PARSE_FAILED",
            parseError: error?.message || "Unknown parse error",
          },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: error?.message || "Analysis failed" },
      { status: 500 }
    );
  }
}