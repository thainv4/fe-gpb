export interface GenGeneRow {
  geneName: string;
  status: string;
  position: string;
  nucleotideChange: string;
  variantClassification: string;
}

export interface GenResultValues {
  testingMethodGenId: string;
  geneRow: GenGeneRow;
}

export const EMPTY_GEN_GENE_ROW: GenGeneRow = {
  geneName: '',
  status: '',
  position: '',
  nucleotideChange: '',
  variantClassification: '',
};

export const EMPTY_GEN_RESULT_VALUES: GenResultValues = {
  testingMethodGenId: '',
  geneRow: { ...EMPTY_GEN_GENE_ROW },
};

export type GenGeneRowKey = keyof GenGeneRow;

export const GEN_TABLE_COLUMNS: Array<{ key: GenGeneRowKey | 'stt'; label: string }> = [
  { key: 'stt', label: 'STT' },
  { key: 'geneName', label: 'Tên Gen' },
  { key: 'status', label: 'Tình trạng' },
  { key: 'position', label: 'Vị trí' },
  { key: 'nucleotideChange', label: 'Thay đổi nucleotid/protein' },
  { key: 'variantClassification', label: 'Phân lớp biến thể' },
];

/** Phiên bản schema JSON trong RESULT_METADATA (giai đoạn 1). */
export const GEN_RESULT_METADATA_VERSION = 1;

export function serializeGenResultMetadata(geneRow: GenGeneRow): string {
  return JSON.stringify({
    genResult: { version: GEN_RESULT_METADATA_VERSION, geneRow },
  });
}

export function parseGenResultMetadata(raw?: string | null): GenGeneRow {
  if (!raw?.trim()) return { ...EMPTY_GEN_GENE_ROW };
  try {
    const parsed = JSON.parse(raw) as {
      genResult?: { geneRow?: Partial<GenGeneRow> };
    };
    return {
      ...EMPTY_GEN_GENE_ROW,
      ...(parsed?.genResult?.geneRow ?? {}),
    };
  } catch {
    return { ...EMPTY_GEN_GENE_ROW };
  }
}

export function buildGenResultValues(input: {
  testingMethodGenId?: string | null;
  resultMetadata?: string | null;
  testingMethodGen?: { id: string } | null;
}): GenResultValues {
  return {
    testingMethodGenId:
      input.testingMethodGenId?.trim() ||
      input.testingMethodGen?.id?.trim() ||
      '',
    geneRow: parseGenResultMetadata(input.resultMetadata),
  };
}

/** Plain text cho HIS-PACS UpdateResult.Conclude từ các cột bảng gene. */
export function formatGenGeneRowConclude(
  geneRow: GenGeneRow,
  options?: { rowIndex?: number; includeEmpty?: boolean },
): string {
  const { rowIndex = 1, includeEmpty = false } = options ?? {};
  const lines: string[] = [];

  for (const col of GEN_TABLE_COLUMNS) {
    if (col.key === 'stt') {
      lines.push(`${col.label}: ${rowIndex}`);
      continue;
    }
    const value = (geneRow[col.key] ?? '').trim();
    if (!value && !includeEmpty) continue;
    lines.push(`${col.label}: ${value || '—'}`);
  }

  return lines.join('\n');
}
