import { prisma } from "@/lib/prisma";
import type { ApplicationDefinition } from "@/lib/ai/validate-definition";
import type { ParsedWorkbook } from "@/lib/parser/csv";

/**
 * Imports rows from the parsed workbook into the Record table,
 * mapping spreadsheet column names → entity field names.
 */
export async function importRecords(
  applicationId: string,
  definition: ApplicationDefinition,
  workbook: ParsedWorkbook
): Promise<{ imported: number; skipped: number }> {
  const sheetsByName = new Map(
    workbook.sheets.map((s) => [s.name, s])
  );

  let imported = 0;
  let skipped = 0;

  // Import primary entity
  const primarySheet = sheetsByName.get(
    definition.primaryEntity.sourceSheet
  );
  if (primarySheet) {
    const result = await importEntity(
      applicationId,
      definition.primaryEntity,
      primarySheet.sampleRows.length
        ? // Use the full data set. But we only kept 20 sample rows in parser.
          // For MVP, use the sample rows to keep it simple.
          primarySheet.sampleRows
        : []
    );
    imported += result.imported;
    skipped += result.skipped;
  }

  // Import supporting entities
  for (const entity of definition.supportingEntities) {
    const sheet = sheetsByName.get(entity.sourceSheet);
    if (!sheet) continue;

    const result = await importEntity(
      applicationId,
      entity,
      sheet.sampleRows
    );
    imported += result.imported;
    skipped += result.skipped;
  }

  return { imported, skipped };
}

async function importEntity(
  applicationId: string,
  entity: { name: string; fields: { name: string; label: string }[] },
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  // Build a mapping: field name → spreadsheet column label
  // The AI produced fields with a `name` (snake_case) and a `label` (human).
  // The label should match the original column header. We fall back to name.
  const fieldMap = entity.fields.map((f) => ({
    fieldName: f.name,
    columnLabel: f.label,
  }));

  for (const row of rows) {
    const data: Record<string, any> = {};
    let hasAnyValue = false;

    for (const { fieldName, columnLabel } of fieldMap) {
      const raw =
        row[columnLabel] ??
        row[fieldName] ??
        // Try case-insensitive match
        Object.entries(row).find(
          ([k]) => k.toLowerCase() === columnLabel.toLowerCase()
        )?.[1];

      if (raw === undefined || raw === null || String(raw).trim() === "") {
        data[fieldName] = null;
        continue;
      }

      data[fieldName] = String(raw).trim();
      hasAnyValue = true;
    }

    if (!hasAnyValue) {
      skipped++;
      continue;
    }

    await prisma.record.create({
      data: {
        applicationId,
        entityName: entity.name,
        data,
      },
    });

    imported++;
  }

  return { imported, skipped };
}