import { runImport, ImportConfig } from './import.util';

interface Row { name: string; description: string | null }

function makeConfig(overrides: Partial<ImportConfig<Row>> = {}): ImportConfig<Row> {
  return {
    requiredFields: ['name'],
    castRow: (raw) => ({
      name: String(raw.name ?? '').trim(),
      description: raw.description ? String(raw.description).trim() || null : null,
    }),
    findDuplicate: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates new records and returns created count', async () => {
    const config = makeConfig();
    const result = await runImport([{ name: 'A', description: 'Desc' }], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 1, updated: 0, skipped: 0, errors: [] });
    expect(config.create).toHaveBeenCalledWith({ name: 'A', description: 'Desc' }, 'tenant-1');
  });

  it('skips duplicate when mode is skip', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue('existing-id') });
    const result = await runImport([{ name: 'A' }], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 0, skipped: 1, errors: [] });
    expect(config.create).not.toHaveBeenCalled();
    expect(config.update).not.toHaveBeenCalled();
  });

  it('updates duplicate when mode is upsert', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue('existing-id') });
    const result = await runImport([{ name: 'A', description: 'New' }], 'upsert', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 1, skipped: 0, errors: [] });
    expect(config.update).toHaveBeenCalledWith('existing-id', { name: 'A', description: 'New' }, 'tenant-1');
    expect(config.create).not.toHaveBeenCalled();
  });

  it('collects error for missing required field and continues', async () => {
    const config = makeConfig({ findDuplicate: jest.fn().mockResolvedValue(null) });
    const result = await runImport(
      [{ description: 'no name' }, { name: 'B' }],
      'skip', 'tenant-1', config,
    );
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Row 2.*name/);
  });

  it('collects error on db failure and continues', async () => {
    const config = makeConfig({
      findDuplicate: jest.fn().mockResolvedValue(null),
      create: jest.fn()
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(undefined),
    });
    const result = await runImport([{ name: 'A' }, { name: 'B' }], 'skip', 'tenant-1', config);
    expect(result.created).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/Row 2.*DB error/);
  });

  it('handles empty rows array', async () => {
    const config = makeConfig();
    const result = await runImport([], 'skip', 'tenant-1', config);
    expect(result).toEqual({ created: 0, updated: 0, skipped: 0, errors: [] });
  });

  it('trims whitespace from required field before checking empty', async () => {
    const config = makeConfig();
    const result = await runImport([{ name: '   ' }], 'skip', 'tenant-1', config);
    expect(result.errors).toHaveLength(1);
    expect(config.create).not.toHaveBeenCalled();
  });
});
