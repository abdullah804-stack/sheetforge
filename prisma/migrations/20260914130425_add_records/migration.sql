-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Record_applicationId_entityName_idx" ON "Record"("applicationId", "entityName");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
