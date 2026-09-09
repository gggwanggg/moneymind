export interface ClassifiedTransaction {
  rowNumber: number;
  merchant: string;
  amount: number;
  recurringMonths: number;
  fixedExpense: 'Y' | 'N';
  microPayment: 'Y' | 'N';
  category: string;
  confidence: number;
  reason: string;
  needsAiReview: boolean;
}

export interface ClassificationResult {
  csvText: string;
  rows: ClassifiedTransaction[];
  reviewCount: number;
  fixedCount: number;
  microCount: number;
}

export interface AiClassificationOverride {
  rowNumber: number;
  category: string;
  confidence: number;
  reason: string;
}

const EXTRA_HEADERS = ['고정비여부', '소액결제여부', '분류카테고리', '분류신뢰도', '분류근거'];
const quote = String.fromCharCode(34);

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === quote) {
      if (quoted && line[index + 1] === quote) { current += quote; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
};

const escapeCsvCell = (cell: string | number) => {
  const value = String(cell);
  return /[,\r\n]/u.test(value) || value.includes(quote)
    ? `${quote}${value.replaceAll(quote, quote + quote)}${quote}`
    : value;
};

const normalizeMerchant = (value: string) =>
  value.replace(/(통신요금)\d{2}$/u, '$1').replace(/\s+/gu, '').trim();

const monthKey = (value: string) => value.slice(0, 7);

const categoryOf = (merchant: string, memo: string) => {
  const target = `${merchant} ${memo}`;
  if (/월세|관리비/u.test(target)) return '주거';
  if (/통신|KT|SKT|LG유플러스/u.test(target)) return '통신';
  if (/보험/u.test(target)) return '보험';
  if (/넷플릭스|유튜브|멜론|구독/u.test(target)) return '구독';
  if (/스타벅스|카페|커피|이디야/u.test(target)) return '카페';
  if (/배달|식당|푸드/u.test(target)) return '식비';
  if (/쿠팡|다이소|마트|편의점|GS25/u.test(target)) return '쇼핑';
  if (/교통|지하철|버스|택시/u.test(target)) return '교통';
  if (/적금|저축/u.test(target)) return '저축';
  return '기타';
};

const isFixedKeyword = (merchant: string, memo: string) =>
  /월세|관리비|통신|보험|넷플릭스|정기구독/u.test(`${merchant} ${memo}`);

export const classifyTransactionCsv = (
  sourceCsv: string,
  aiOverrides: AiClassificationOverride[] = [],
): ClassificationResult => {
  const lines = sourceCsv.replace(/^\uFEFF/u, '').split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) => line.startsWith('거래일시,'));
  if (headerIndex < 0) throw new Error('거래일시 헤더를 찾을 수 없습니다.');

  const headers = parseCsvLine(lines[headerIndex]);
  const column = (name: string) => headers.indexOf(name);
  const required = ['거래일시', '적요', '보낸분/받는분', '송금메모', '출금액', '입금액'];
  if (required.some((name) => column(name) < 0)) {
    throw new Error('필수 거래 열이 없는 CSV 파일입니다.');
  }

  const sourceRows = lines.slice(headerIndex + 1).filter((line) => line.trim()).map((line, index) => {
    const cells = parseCsvLine(line);
    const merchant = normalizeMerchant(cells[column('보낸분/받는분')] || cells[column('적요')]);
    return {
      cells,
      rowNumber: headerIndex + index + 2,
      date: cells[column('거래일시')],
      merchant,
      memo: cells[column('송금메모')] || '',
      amount: Number((cells[column('출금액')] || '0').replaceAll(',', '')),
      income: Number((cells[column('입금액')] || '0').replaceAll(',', '')),
    };
  });

  const groups = new Map<string, typeof sourceRows>();
  sourceRows.forEach((row) => {
    if (!row.merchant || !row.amount) return;
    groups.set(row.merchant, [...(groups.get(row.merchant) ?? []), row]);
  });

  const overrideByRow = new Map(aiOverrides.map((override) => [override.rowNumber, override]));
  const rows = sourceRows.map((row): ClassifiedTransaction => {
    if (!row.amount && row.income) {
      return { rowNumber: row.rowNumber, merchant: row.merchant, amount: 0, recurringMonths: 0, fixedExpense: 'N', microPayment: 'N', category: '수입', confidence: 100, reason: '입금 거래', needsAiReview: false };
    }

    const matching = groups.get(row.merchant) ?? [];
    const months = new Set(matching.map((item) => monthKey(item.date))).size;
    const maxMonthlyFrequency = Math.max(...Array.from(new Set(matching.map((item) => monthKey(item.date)))).map(
      (month) => matching.filter((item) => monthKey(item.date) === month).length,
    ), 0);
    const fixedExpense = isFixedKeyword(row.merchant, row.memo) && months >= 2;
    const microPayment = row.amount > 0 && row.amount <= 30000;
    const category = categoryOf(row.merchant, row.memo);
    const confidence = fixedExpense ? 96 : microPayment ? (maxMonthlyFrequency >= 2 ? 88 : 80) : category === '기타' ? 60 : 84;
    const needsAiReview = category === '기타' || confidence < 80;
    const reason = fixedExpense
      ? `${months}개월 연속 고정비 패턴`
      : microPayment
        ? `3만원 이하 월 ${maxMonthlyFrequency}회 결제`
        : needsAiReview
          ? '규칙으로 판단하기 어려워 AI 검토 필요'
          : `${category} 키워드 규칙 일치`;

    const aiOverride = overrideByRow.get(row.rowNumber);
    if (needsAiReview && aiOverride) {
      const aiFixedExpense = months >= 2
        && ['주거', '통신', '보험', '구독'].includes(aiOverride.category);
      return {
        rowNumber: row.rowNumber,
        merchant: row.merchant,
        amount: row.amount,
        recurringMonths: months,
        fixedExpense: aiFixedExpense ? 'Y' : 'N',
        microPayment: microPayment ? 'Y' : 'N',
        category: aiOverride.category,
        confidence: Math.min(100, Math.max(0, Math.round(aiOverride.confidence))),
        reason: `AI 검토: ${aiOverride.reason}`,
        needsAiReview: false,
      };
    }

    return {
      rowNumber: row.rowNumber, merchant: row.merchant, amount: row.amount, recurringMonths: months,
      fixedExpense: fixedExpense ? 'Y' : 'N',
      microPayment: microPayment ? 'Y' : 'N',
      category, confidence, reason, needsAiReview,
    };
  });

  const derivedLines = [
    ...lines.slice(0, headerIndex),
    [...headers, ...EXTRA_HEADERS].map(escapeCsvCell).join(','),
    ...sourceRows.map((row, index) => {
      const classification = rows[index];
      return [
        ...row.cells,
        classification.fixedExpense,
        classification.microPayment,
        classification.category,
        classification.confidence,
        classification.reason,
      ].map(escapeCsvCell).join(',');
    }),
  ];

  return {
    csvText: `\uFEFF${derivedLines.join('\r\n')}\r\n`,
    rows,
    reviewCount: rows.filter((row) => row.needsAiReview).length,
    fixedCount: rows.filter((row) => row.fixedExpense === 'Y').length,
    microCount: rows.filter((row) => row.microPayment === 'Y').length,
  };
};
