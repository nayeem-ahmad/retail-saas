export interface ImportConfig<T extends object> {
  requiredFields: string[];
  castRow: (raw: Record<string, unknown>) => T;
  findDuplicate: (row: T, tenantId: string) => Promise<string | null>;
  create: (row: T, tenantId: string) => Promise<void>;
  update: (id: string, row: T, tenantId: string) => Promise<void>;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function runImport<T extends object>(
  rawRows: Record<string, unknown>[],
  mode: 'skip' | 'upsert',
  tenantId: string,
  config: ImportConfig<T>,
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rawRows.length; i++) {
    const rowNum = i + 2;
    const raw = rawRows[i];

    const missing = config.requiredFields.filter(
      (f) => raw[f] === undefined || raw[f] === null || String(raw[f]).trim() === '',
    );
    if (missing.length) {
      result.errors.push(`Row ${rowNum}: missing required field(s): ${missing.join(', ')}`);
      continue;
    }

    try {
      const row = config.castRow(raw);
      const existingId = await config.findDuplicate(row, tenantId);

      if (existingId) {
        if (mode === 'skip') {
          result.skipped++;
        } else {
          await config.update(existingId, row, tenantId);
          result.updated++;
        }
      } else {
        await config.create(row, tenantId);
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`Row ${rowNum}: ${err?.message ?? 'unknown error'}`);
    }
  }

  return result;
}
