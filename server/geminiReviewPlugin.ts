import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

interface ReviewItem {
  rowNumber: number;
  merchant: string;
  amount: number;
  recurringMonths: number;
  currentCategory: string;
  currentReason: string;
}

const CATEGORIES = ['식비', '카페', '쇼핑', '교통', '주거', '통신', '보험', '구독', '의료', '교육', '여가', '금융', '기타'];

const sendJson = (response: ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
};

const readableError = (error: unknown) => {
  const fallback = error instanceof Error ? error.message : 'AI 검토 중 오류가 발생했습니다.';
  try {
    const parsed = JSON.parse(fallback) as { error?: { message?: string } };
    return parsed.error?.message || fallback;
  } catch {
    return fallback;
  }
};

const readJson = async (request: IncomingMessage) => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new Error('요청 데이터가 너무 큽니다.');
  }
  return JSON.parse(body) as { items?: ReviewItem[] };
};

const isReviewItem = (item: unknown): item is ReviewItem => {
  if (!item || typeof item !== 'object') return false;
  const value = item as Record<string, unknown>;
  return Number.isInteger(value.rowNumber)
    && typeof value.merchant === 'string'
    && typeof value.amount === 'number'
    && typeof value.recurringMonths === 'number'
    && typeof value.currentCategory === 'string'
    && typeof value.currentReason === 'string';
};

const createHandler = (model: string) =>
  async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'POST 요청만 허용됩니다.' });
      return;
    }
    const requestApiKey = request.headers['x-gemini-api-key'];
    const resolvedApiKey = Array.isArray(requestApiKey) ? requestApiKey[0] : requestApiKey;
    if (!resolvedApiKey) {
      sendJson(response, 401, { error: '설정 화면에서 Gemini API 키를 입력해주세요.' });
      return;
    }

    try {
      const body = await readJson(request);
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50 || !body.items.every(isReviewItem)) {
        sendJson(response, 400, { error: '검토 항목 형식이 올바르지 않습니다.' });
        return;
      }

      const allowedRows = new Set(body.items.map((item) => item.rowNumber));
      const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
      const result = await ai.models.generateContent({
        model,
        contents: [
          '당신은 한국 은행 거래내역 분류 검토자입니다.',
          '규칙으로 분류하기 어려운 항목만 검토합니다.',
          `분류카테고리는 반드시 다음 중 하나만 사용하세요: ${CATEGORIES.join(', ')}.`,
          '상호명, 출금액, 반복 개월 수를 근거로 추정하고, 모르면 기타로 분류하세요.',
          'reason은 개인정보를 새로 추론하지 말고 40자 이내 한국어로 작성하세요.',
          JSON.stringify(body.items),
        ].join('\n'),
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                rowNumber: { type: 'INTEGER' },
                category: { type: 'STRING', enum: CATEGORIES },
                confidence: { type: 'INTEGER', minimum: 0, maximum: 100 },
                reason: { type: 'STRING' },
              },
              required: ['rowNumber', 'category', 'confidence', 'reason'],
            },
          },
        },
      });

      const reviews = JSON.parse(result.text || '[]') as unknown;
      if (!Array.isArray(reviews) || reviews.length !== body.items.length) throw new Error('AI 응답 항목 수가 일치하지 않습니다.');
      const valid = reviews.every((review) => {
        if (!review || typeof review !== 'object') return false;
        const value = review as Record<string, unknown>;
        return typeof value.rowNumber === 'number'
          && allowedRows.has(value.rowNumber)
          && typeof value.category === 'string'
          && CATEGORIES.includes(value.category)
          && typeof value.confidence === 'number'
          && typeof value.reason === 'string';
      });
      if (!valid) throw new Error('AI 응답 형식이 올바르지 않습니다.');
      sendJson(response, 200, { reviews });
    } catch (error) {
      sendJson(response, 500, { error: readableError(error) });
    }
  };

export const geminiReviewPlugin = (model: string): Plugin => {
  const handler = createHandler(model);
  return {
    name: 'moneymind-gemini-review',
    configureServer(server) {
      server.middlewares.use('/api/ai/review-transactions', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai/review-transactions', handler);
    },
  };
};
