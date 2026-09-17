import { prisma } from "@/lib/prisma";

export type AccessRole = "owner" | "editor" | "viewer";

export interface AccessResult {
  ok: true;
  role: AccessRole;
  application: any;
}

export interface AccessDenied {
  ok: false;
  reason: "not_found" | "unauthorized";
}

/**
 * Checks whether the given user has access to the given application.
 * Returns the role and application if so.
 *
 * Roles:
 *   owner  — created the app; full control
 *   editor — added via invite with "editor" role; can edit records
 *   viewer — added via invite with "viewer" role; read-only
 */
export async function checkAppAccess(
  userId: string,
  applicationId: string
): Promise<AccessResult | AccessDenied> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) return { ok: false, reason: "not_found" };

  // Owner?
  if (application.userId === userId) {
    return { ok: true, role: "owner", application };
  }

  // Member?
  const member = await prisma.appMember.findUnique({
    where: {
      applicationId_userId: {
        applicationId,
        userId,
      },
    },
  });

  if (member) {
    return {
      ok: true,
      role: member.role as AccessRole,
      application,
    };
  }

  return { ok: false, reason: "unauthorized" };
}

/**
 * Checks whether the given user can edit records in the given app.
 * Owners and editors can; viewers cannot.
 */
export async function checkEditAccess(
  userId: string,
  applicationId: string
): Promise<AccessResult | AccessDenied> {
  const result = await checkAppAccess(userId, applicationId);
  if (!result.ok) return result;

  if (result.role === "viewer") {
    return { ok: false, reason: "unauthorized" };
  }

  return result;
}