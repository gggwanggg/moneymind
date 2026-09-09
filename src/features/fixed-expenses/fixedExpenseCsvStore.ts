import defaultCsvText from '../../data/data-set.csv?raw';

export interface FixedExpenseCsvSnapshot {
  csvText: string;
  fileName: string;
  source: 'sample' | 'uploaded';
}

const defaultSnapshot: FixedExpenseCsvSnapshot = {
  csvText: defaultCsvText,
  fileName: 'data-set.csv',
  source: 'sample',
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
  snapshot = { csvText, fileName, source: 'uploaded' };
  emitChange();
};

export const resetFixedExpenseCsv = () => {
  snapshot = defaultSnapshot;
  emitChange();
};
