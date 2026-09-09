import {
  AiClassificationOverride,
  classifyTransactionCsv,
  ClassificationResult,
} from '../transaction-classification/classifyTransactionCsv';

export interface FixedExpenseCsvSnapshot {
  csvText: string | null;
  fileName: string | null;
  source: 'empty' | 'uploaded';
  classification: ClassificationResult | null;
}

const defaultSnapshot: FixedExpenseCsvSnapshot = {
  csvText: null,
  fileName: null,
  source: 'empty',
  classification: null,
};

let snapshot = defaultSnapshot;
const listeners = new Set<() => void>();

export const getFixedExpenseCsvSnapshot = () => snapshot;

export const subscribeToFixedExpenseCsv = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emitChange = () => listeners.forEach((listener) => listener());

export const setFixedExpenseCsv = (csvText: string, fileName: string) => {
  const classification = classifyTransactionCsv(csvText);
  snapshot = { csvText, fileName, source: 'uploaded', classification };
  emitChange();
  return classification;
};

export const applyAiReviews = (reviews: AiClassificationOverride[]) => {
  if (!snapshot.csvText) throw new Error('먼저 CSV 파일을 업로드해주세요.');
  const classification = classifyTransactionCsv(snapshot.csvText, reviews);
  snapshot = { ...snapshot, classification };
  emitChange();
  return classification;
};

export const clearFixedExpenseCsv = () => {
  snapshot = defaultSnapshot;
  emitChange();
};
