import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkRecordLimit,
  checkAndIncrementEditUsage,
} from "@/lib/usage/limits";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper — verify the user owns the application
async function verifyOwnership(email: string, applicationId: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application || application.userId !== user.id) return null;
  return application;
}

// LIST records
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

    const app = await verifyOwnership(session.user.email, applicationId);
    if (!app) {
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

// CREATE record
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

    const app = await verifyOwnership(session.user.email, applicationId);
    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

// UPDATE record
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

    const app = await verifyOwnership(
      session.user.email,
      existing.applicationId
    );
    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

// DELETE record
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ error: "recordId required" }, { status: 400 });
    }

    const existing = await prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const app = await verifyOwnership(
      session.user.email,
      existing.applicationId
    );
    if (!app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.record.delete({ where: { id: recordId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}