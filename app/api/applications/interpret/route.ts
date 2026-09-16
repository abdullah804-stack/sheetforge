import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai/client";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { buildAIInput } from "@/lib/ai/build-input";
import { validateDefinition } from "@/lib/ai/validate-definition";
import { importRecords } from "@/lib/records/import";
import type { ParsedWorkbook } from "@/lib/parser/csv";

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

    if (!isParsedWorkbook(workbook.parsedData)) {
      return NextResponse.json(
        { error: "Workbook parse data is invalid" },
        { status: 500 }
      );
    }

    const parsed = workbook.parsedData;
    const summary = buildAIInput(parsed);

    const rawResponse = await chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(summary) },
      ],
      temperature: 0.2,
    });

    const cleaned = extractJson(rawResponse);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new Error(
        "AI returned invalid JSON. Raw response: " + cleaned.slice(0, 300)
      );
    }

    const definition = validateDefinition(
      parsedJson as Record<string, unknown>,
      parsed
    );

    // Persist the definition on the application
    await prisma.application.update({
      where: { id: workbook.applicationId },
      data: {
        type: definition.applicationType,
        name: definition.applicationName,
        status: "GENERATED",
        definition: definition as unknown as Prisma.InputJsonValue,
      },
    });

    // Import records from the parsed workbook.
    // Clear any previous records for this app first (idempotent re-generation).
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
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Interpretation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isParsedWorkbook(value: unknown): value is ParsedWorkbook {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.filename !== "string") return false;
  if (typeof candidate.sheetCount !== "number") return false;
  if (!Array.isArray(candidate.sheets)) return false;

  return candidate.sheets.every((sheet) => {
    if (!sheet || typeof sheet !== "object") return false;

    const current = sheet as Record<string, unknown>;

    return (
      typeof current.name === "string" &&
      typeof current.rowCount === "number" &&
      typeof current.columnCount === "number" &&
      Array.isArray(current.headers) &&
      Array.isArray(current.sampleRows) &&
      Array.isArray(current.columns)
    );
  });
}

/**
 * Extracts the JSON object from an AI response.
 * Handles:
 *   - clean JSON
 *   - ```json ... ``` fenced blocks
 *   - preamble text before the first { and after the last }
 */
function extractJson(rawResponse: string): string {
  const response = rawResponse.trim();
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? response).trim();

  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    // Continue in case the model added explanatory text around the JSON.
  }

  const start = candidate.search(/[\[{]/);
  if (start < 0) {
    throw new Error(
      "AI response contained no JSON object. Raw: " + candidate.slice(0, 300)
    );
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const char = candidate[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{" || char === "[") depth++;
    else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }

  return candidate;
}