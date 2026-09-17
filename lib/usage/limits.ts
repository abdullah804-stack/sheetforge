import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  maxApps: 3,
  maxRecordsPerApp: 1000,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxAiPerMonth: 10,
  maxEditsPerMonth: 500,
};

/**
 * Returns true if the given email is an admin (bypasses all limits).
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Checks whether a monthly counter needs to be reset (30-day rolling window).
 * Returns the fresh count and reset timestamp.
 */
export function checkMonthlyReset(
  count: number,
  resetAt: Date,
  now: Date = new Date()
): { count: number; resetAt: Date; didReset: boolean } {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  if (now.getTime() - resetAt.getTime() >= THIRTY_DAYS_MS) {
    return { count: 0, resetAt: now, didReset: true };
  }
  return { count, resetAt, didReset: false };
}

/* ------------------------------------------------------------------ */
/* Specific limit checks                                               */
/* ------------------------------------------------------------------ */

export async function checkAppLimit(
  userId: string,
  email: string
): Promise<{ ok: true } | { ok: false; used: number; max: number }> {
  if (isAdmin(email)) return { ok: true };

  const count = await prisma.application.count({ where: { userId } });
  if (count >= FREE_LIMITS.maxApps) {
    return { ok: false, used: count, max: FREE_LIMITS.maxApps };
  }
  return { ok: true };
}

export async function checkRecordLimit(
  applicationId: string,
  email: string,
  addingCount: number = 1
): Promise<{ ok: true } | { ok: false; used: number; max: number }> {
  if (isAdmin(email)) return { ok: true };

  const count = await prisma.record.count({ where: { applicationId } });
  if (count + addingCount > FREE_LIMITS.maxRecordsPerApp) {
    return {
      ok: false,
      used: count,
      max: FREE_LIMITS.maxRecordsPerApp,
    };
  }
  return { ok: true };
}

export async function checkAndIncrementAiUsage(
  userId: string,
  email: string
): Promise<{ ok: true } | { ok: false; used: number; max: number }> {
  if (isAdmin(email)) return { ok: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, used: 0, max: FREE_LIMITS.maxAiPerMonth };

  const { count, resetAt, didReset } = checkMonthlyReset(
    user.monthlyAiUsage,
    user.monthlyAiResetAt
  );

  if (count >= FREE_LIMITS.maxAiPerMonth) {
    return {
      ok: false,
      used: count,
      max: FREE_LIMITS.maxAiPerMonth,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyAiUsage: count + 1,
      monthlyAiResetAt: resetAt,
    },
  });

  return { ok: true };
}

export async function checkAndIncrementEditUsage(
  userId: string,
  email: string
): Promise<{ ok: true } | { ok: false; used: number; max: number }> {
  if (isAdmin(email)) return { ok: true };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, used: 0, max: FREE_LIMITS.maxEditsPerMonth };

  const { count, resetAt } = checkMonthlyReset(
    user.monthlyEditUsage,
    user.monthlyEditResetAt
  );

  if (count >= FREE_LIMITS.maxEditsPerMonth) {
    return {
      ok: false,
      used: count,
      max: FREE_LIMITS.maxEditsPerMonth,
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthlyEditUsage: count + 1,
      monthlyEditResetAt: resetAt,
    },
  });

  return { ok: true };
}

/**
 * Returns the current usage numbers for display on the Settings page.
 */
export async function getUsageSnapshot(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const appCount = await prisma.application.count({ where: { userId } });

  const ai = checkMonthlyReset(user.monthlyAiUsage, user.monthlyAiResetAt);
  const edits = checkMonthlyReset(
    user.monthlyEditUsage,
    user.monthlyEditResetAt
  );

  return {
    apps: { used: appCount, max: FREE_LIMITS.maxApps },
    ai: { used: ai.count, max: FREE_LIMITS.maxAiPerMonth },
    edits: { used: edits.count, max: FREE_LIMITS.maxEditsPerMonth },
    recordsPerApp: { max: FREE_LIMITS.maxRecordsPerApp },
    fileSize: { max: FREE_LIMITS.maxFileSizeBytes },
  };
}