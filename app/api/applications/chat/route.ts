import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAppAccess } from "@/lib/access/check";
import { chat } from "@/lib/ai/client";
import { CHAT_SYSTEM_PROMPT, buildChatUserPrompt } from "@/lib/chat/prompt";
import { buildChatContext } from "@/lib/chat/build-context";
import {
  checkAndIncrementAiUsage,
} from "@/lib/usage/limits";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* GET — load chat history for the current user + app                  */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
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

    const access = await checkAppAccess(user.id, applicationId);
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { applicationId, userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        chart: m.chart,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST — ask a question                                               */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, question } = await req.json();

    if (!applicationId || !question || typeof question !== "string") {
      return NextResponse.json(
        { error: "applicationId and question required" },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question is too long (max 500 characters)." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const access = await checkAppAccess(user.id, applicationId);
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const application = access.application;
    const definition = application.definition as any;
    if (!definition) {
      return NextResponse.json(
        { error: "This app hasn't been generated yet." },
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

    const context = buildChatContext(
      recordObjects,
      definition.primaryEntity.fields || [],
      application.name
    );

    // Charge an AI generation
    const aiLimit = await checkAndIncrementAiUsage(
      user.id,
      session.user.email
    );
    if (!aiLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${aiLimit.max} AI calls this month.`,
          code: "LIMIT_REACHED",
          limit: "ai",
        },
        { status: 402 }
      );
    }

    const rawResponse = await chat({
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: buildChatUserPrompt(context, question) },
      ],
      temperature: 0.2,
    });

    const cleaned = extractJson(rawResponse);

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response. Try rephrasing." },
        { status: 500 }
      );
    }

    const answerText =
      typeof parsed.text === "string" && parsed.text.trim()
        ? parsed.text.trim()
        : "I couldn't answer that.";

    // Chart is optional. Validate shape if present.
    let chart: any = null;
    if (
      parsed.chart &&
      typeof parsed.chart === "object" &&
      Array.isArray(parsed.chart.data)
    ) {
      const data = parsed.chart.data
        .filter(
          (d: any) =>
            d &&
            typeof d.group === "string" &&
            typeof d.value === "number" &&
            !isNaN(d.value)
        )
        .slice(0, 8);

      if (data.length > 0) {
        chart = {
          type: parsed.chart.type === "pie" ? "pie" : "bar",
          title:
            typeof parsed.chart.title === "string"
              ? parsed.chart.title.slice(0, 80)
              : "Chart",
          data,
        };
      }
    }

    // Persist both messages
    await prisma.chatMessage.create({
      data: {
        applicationId,
        userId: user.id,
        role: "user",
        content: question,
      },
    });

    const assistantMsg = await prisma.chatMessage.create({
      data: {
        applicationId,
        userId: user.id,
        role: "assistant",
        content: answerText,
        chart: chart || undefined,
      },
    });

    return NextResponse.json({
      id: assistantMsg.id,
      text: answerText,
      chart,
    });
  } catch (error: unknown) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Extracts a JSON object from an AI response.
 */
function extractJson(rawResponse: string): string {
  const response = rawResponse.trim();
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? response).trim();

  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    // continue
  }

  const start = candidate.search(/[\[{]/);
  if (start < 0) {
    throw new Error("No JSON in AI response");
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