import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateCSV, generateXLSX, safeFilename } from "@/lib/export/generate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const format = searchParams.get("format") || "csv"; // "csv" | "xlsx"

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required" },
        { status: 400 }
      );
    }

    if (format !== "csv" && format !== "xlsx") {
      return NextResponse.json(
        { error: "format must be 'csv' or 'xlsx'" },
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

    const definition = application.definition as any;
    if (!definition) {
      return NextResponse.json(
        { error: "Application has no definition" },
        { status: 400 }
      );
    }

    const entityName = definition.primaryEntity.name;

    const records = await prisma.record.findMany({
      where: { applicationId, entityName },
      orderBy: { createdAt: "asc" },
    });

    const recordObjects = records.map((r) => ({
      id: r.id,
      data: r.data as Record<string, any>,
    }));

    const filename = safeFilename(application.name, format);

    if (format === "csv") {
      const csv = generateCSV(recordObjects, definition.primaryEntity);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // XLSX
    const buffer = generateXLSX(
      recordObjects,
      definition.primaryEntity,
      application.name
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}