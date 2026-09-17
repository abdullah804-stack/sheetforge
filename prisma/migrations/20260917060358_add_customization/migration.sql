-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "Application_slug_idx" ON "Application"("slug");
