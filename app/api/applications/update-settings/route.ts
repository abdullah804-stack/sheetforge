import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

      const body = await req.json();
    const {
      applicationId,
      name,
      theme,
      visibleFields,
      activeMetrics,
      removeLogo,
      conditionalRules,
    } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId required" },
        { status: 400 }
      );
    }

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      name.length > 100
    ) {
      return NextResponse.json(
        { error: "Name must be 1–100 characters" },
        { status: 400 }
      );
    }

    if (!["default", "warm", "cool"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme" },
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

    // Apply field visibility to the definition
    const definition = application.definition as any;
    let updatedDefinition = definition;

    if (definition && Array.isArray(visibleFields)) {
      const visibilityMap = new Map<string, boolean>();
      for (const f of visibleFields) {
        if (f && typeof f.name === "string") {
          visibilityMap.set(f.name, !!f.visible);
        }
      }

            // Validate conditional rules server-side
      let cleanedRules: any[] = [];
      if (Array.isArray(conditionalRules)) {
        cleanedRules = conditionalRules
          .filter(
            (r) =>
              r &&
              typeof r.field === "string" &&
              typeof r.operator === "string" &&
              typeof r.style === "string"
          )
          .map((r) => ({
            id: typeof r.id === "string" ? r.id : `rule_${Math.random()}`,
            field: r.field,
            operator: r.operator,
            value: r.value ?? "",
            value2: r.value2 ?? undefined,
            style: r.style,
          }))
          .slice(0, 30); // cap at 30 rules
      }

      updatedDefinition = {
        ...definition,
        primaryEntity: {
          ...definition.primaryEntity,
          fields: (definition.primaryEntity?.fields || []).map((field: any) => ({
            ...field,
            visible: visibilityMap.has(field.name)
              ? visibilityMap.get(field.name)!
              : field.visible,
          })),
        },
        dashboard: {
          ...definition.dashboard,
          metrics: Array.isArray(activeMetrics)
            ? activeMetrics
            : definition.dashboard?.metrics || [],
        },
        conditionalRules: cleanedRules,
      };
    }

        const updateData: any = {
      name: name.trim(),
      theme,
      definition: updatedDefinition as Prisma.InputJsonValue,
    };

    if (removeLogo === true) {
      // Clear the logo URL (blob deletion is optional — can be added later)
      updateData.logoUrl = null;
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      theme: updated.theme,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}