import { ClassifiedTransaction } from './classifyTransactionCsv';

export interface AiReviewRequest {
  rowNumber: number;
  merchant: string;
  amount: number;
  recurringMonths: number;
  currentCategory: string;
  currentReason: string;
}

export interface AiReviewResponse {
  rowNumber: number;
  category: string;
  confidence: number;
  reason: string;
}

export type AiReviewProvider = (items: AiReviewRequest[]) => Promise<AiReviewResponse[]>;

const isAiReviewResponse = (value: unknown): value is AiReviewResponse => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.rowNumber === 'number'
    && typeof item.category === 'string'
    && typeof item.confidence === 'number'
    && typeof item.reason === 'string';
};

export const requestGeminiReview = async (
  items: AiReviewRequest[],
  apiKey?: string,
): Promise<AiReviewResponse[]> => {
  if (items.length === 0) return [];
  const response = await fetch('/api/ai/review-transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-Gemini-Api-Key': apiKey } : {}),
    },
    body: JSON.stringify({ items }),
  });
  const payload = await response.json().catch(() => null) as { reviews?: unknown[]; error?: string } | null;
  if (!response.ok) throw new Error(payload?.error || 'AI 검토 요청에 실패했습니다.');
  if (!payload?.reviews || !payload.reviews.every(isAiReviewResponse)) {
    throw new Error('AI가 올바르지 않은 형식으로 응답했습니다.');
  }
  return payload.reviews;
};

export const createAiReviewQueue = (rows: ClassifiedTransaction[]): AiReviewRequest[] =>
  rows.filter((row) => row.needsAiReview).map((row) => ({
    rowNumber: row.rowNumber,
    merchant: row.merchant,
    amount: row.amount,
    recurringMonths: row.recurringMonths,
    currentCategory: row.category,
    currentReason: row.reason,
  }));

export const reviewWithAi = async (rows: ClassifiedTransaction[], provider: AiReviewProvider) =>
  provider(createAiReviewQueue(rows));
