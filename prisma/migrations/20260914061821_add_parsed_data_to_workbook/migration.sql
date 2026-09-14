-- AlterTable
ALTER TABLE "Workbook" ADD COLUMN     "parseError" TEXT,
ADD COLUMN     "parsedData" JSONB;
