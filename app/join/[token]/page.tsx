import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import JoinClient from "./JoinClient";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shareToken = await prisma.appShareToken.findUnique({
    where: { token },
    include: {
      application: {
        select: {
          id: true,
          name: true,
          theme: true,
          logoUrl: true,
          userId: true,
        },
      },
    },
  });

  if (!shareToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            This invite link is invalid
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            It may have been revoked, or the link might be incomplete.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const session = await auth();
  const signedInEmail = session?.user?.email || null;

  let isOwner = false;
  let alreadyMember = false;

  if (signedInEmail) {
    const user = await prisma.user.findUnique({
      where: { email: signedInEmail },
    });
    if (user) {
      if (shareToken.application.userId === user.id) {
        isOwner = true;
      } else {
        const member = await prisma.appMember.findUnique({
          where: {
            applicationId_userId: {
              applicationId: shareToken.applicationId,
              userId: user.id,
            },
          },
        });
        alreadyMember = !!member;
      }
    }
  }

  return (
    <JoinClient
      token={token}
      appName={shareToken.application.name}
      theme={shareToken.application.theme}
      logoUrl={shareToken.application.logoUrl}
      role={shareToken.role}
      applicationId={shareToken.application.id}
      isSignedIn={!!signedInEmail}
      isOwner={isOwner}
      alreadyMember={alreadyMember}
    />
  );
}