-- CreateTable
CREATE TABLE "AppShareToken" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppShareToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppMember" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppShareToken_token_key" ON "AppShareToken"("token");

-- CreateIndex
CREATE INDEX "AppShareToken_token_idx" ON "AppShareToken"("token");

-- CreateIndex
CREATE INDEX "AppShareToken_applicationId_idx" ON "AppShareToken"("applicationId");

-- CreateIndex
CREATE INDEX "AppMember_userId_idx" ON "AppMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppMember_applicationId_userId_key" ON "AppMember"("applicationId", "userId");

-- AddForeignKey
ALTER TABLE "AppShareToken" ADD CONSTRAINT "AppShareToken_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMember" ADD CONSTRAINT "AppMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMember" ADD CONSTRAINT "AppMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
