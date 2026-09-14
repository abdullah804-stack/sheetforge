import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai/client";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { buildAIInput } from "@/lib/ai/build-input";
import { validateDefinition } from "@/lib/ai/validate-definition";
import { importRecords } from "@/lib/records/import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    if (!workbook.parsedData) {
      return NextResponse.json(
        { error: "Workbook has not been parsed yet" },
        { status: 400 }
      );
    }

    const parsed = workbook.parsedData as any;
    const summary = buildAIInput(parsed);

    const rawResponse = await chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(summary) },
      ],
      temperature: 0.2,
    });

    // Strip possible code fences
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsedJson;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new Error(
        "AI returned invalid JSON. Raw response: " +
          cleaned.slice(0, 300)
      );
    }

    const definition = validateDefinition(parsedJson, parsed);

        // Persist the definition on the application
    await prisma.application.update({
      where: { id: workbook.applicationId },
      data: {
        type: definition.applicationType,
        name: definition.applicationName,
        status: "GENERATED",
        definition: definition as any,
      },
    });

    // Import records from the parsed workbook
    // Clear any previous records for this app first (idempotent re-generation)
    await prisma.record.deleteMany({
      where: { applicationId: workbook.applicationId },
    });

    const importResult = await importRecords(
      workbook.applicationId,
      definition,
      parsed
    );

    await prisma.application.update({
      where: { id: workbook.applicationId },
      data: { status: "READY" },
    });

    return NextResponse.json({
      definition,
      imported: importResult.imported,
      skipped: importResult.skipped,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "Interpretation failed" },
      { status: 500 }
    );
  }
}