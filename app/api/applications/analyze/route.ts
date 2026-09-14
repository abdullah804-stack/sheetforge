import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV } from "@/lib/parser/csv";
import { parseXLSX } from "@/lib/parser/xlsx";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let workbookId: string | null = null;

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    workbookId = body.workbookId;

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

    // Fetch file from private Blob
    const fileRes = await fetch(workbook.storagePath, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!fileRes.ok) {
      throw new Error(`Failed to fetch file: ${fileRes.status}`);
    }

    let parsed;

    if (workbook.fileType === "csv") {
      const content = await fileRes.text();
      parsed = await parseCSV(content, workbook.filename);
    } else if (workbook.fileType === "xlsx") {
      const buffer = await fileRes.arrayBuffer();
      parsed = await parseXLSX(buffer, workbook.filename);
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${workbook.fileType}` },
        { status: 400 }
      );
    }

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

    if (workbookId) {
      try {
        await prisma.workbook.update({
          where: { id: workbookId },
          data: {
            status: "PARSE_FAILED",
            parseError: error?.message || "Unknown parse error",
          },
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      { error: error?.message || "Analysis failed" },
      { status: 500 }
    );
  }
}