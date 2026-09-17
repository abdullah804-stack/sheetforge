import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkEditAccess, checkAppAccess } from "@/lib/access/check";
import {
  checkRecordLimit,
  checkAndIncrementEditUsage,
} from "@/lib/usage/limits";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* GET — list records (any access: owner, editor, viewer)              */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");
    const entityName = searchParams.get("entityName");

    if (!applicationId || !entityName) {
      return NextResponse.json(
        { error: "applicationId and entityName required" },
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

    const records = await prisma.record.findMany({
      where: { applicationId, entityName },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST — create a record (owner + editor only)                        */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicationId, entityName, data } = body;

    if (!applicationId || !entityName || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: "applicationId, entityName, and data required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const access = await checkEditAccess(user.id, applicationId);
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Enforce record-count limit per application
    const recordLimit = await checkRecordLimit(
      applicationId,
      session.user.email,
      1
    );
    if (!recordLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${recordLimit.max} records in this application.`,
          code: "LIMIT_REACHED",
          limit: "records",
          used: recordLimit.used,
          max: recordLimit.max,
        },
        { status: 402 }
      );
    }

    // Enforce monthly edit limit
    const editLimit = await checkAndIncrementEditUsage(
      user.id,
      session.user.email
    );
    if (!editLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${editLimit.max} edits this month.`,
          code: "LIMIT_REACHED",
          limit: "edits",
          used: editLimit.used,
          max: editLimit.max,
        },
        { status: 402 }
      );
    }

    const record = await prisma.record.create({
      data: { applicationId, entityName, data },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH — update a record (owner + editor only)                       */
/* ------------------------------------------------------------------ */
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recordId, data } = body;

    if (!recordId || !data || typeof data !== "object") {
      return NextResponse.json(
        { error: "recordId and data required" },
        { status: 400 }
      );
    }

    const existing = await prisma.record.findUnique({
      where: { id: recordId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the record's application for the access check
    const access = await checkEditAccess(user.id, existing.applicationId);
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Enforce monthly edit limit
    const editLimit = await checkAndIncrementEditUsage(
      user.id,
      session.user.email
    );
    if (!editLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${editLimit.max} edits this month.`,
          code: "LIMIT_REACHED",
          limit: "edits",
          used: editLimit.used,
          max: editLimit.max,
        },
        { status: 402 }
      );
    }

    const record = await prisma.record.update({
      where: { id: recordId },
      data: { data },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE — remove a record (owner + editor only)                      */
/* ------------------------------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { error: "recordId required" },
        { status: 400 }
      );
    }

    const existing = await prisma.record.findUnique({
      where: { id: recordId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the record's application for the access check
    const access = await checkEditAccess(user.id, existing.applicationId);
    if (!access.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Enforce monthly edit limit
    const editLimit = await checkAndIncrementEditUsage(
      user.id,
      session.user.email
    );
    if (!editLimit.ok) {
      return NextResponse.json(
        {
          error: `You've reached your Free plan limit of ${editLimit.max} edits this month.`,
          code: "LIMIT_REACHED",
          limit: "edits",
          used: editLimit.used,
          max: editLimit.max,
        },
        { status: 402 }
      );
    }

    await prisma.record.delete({ where: { id: recordId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}