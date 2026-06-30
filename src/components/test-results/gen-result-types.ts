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
