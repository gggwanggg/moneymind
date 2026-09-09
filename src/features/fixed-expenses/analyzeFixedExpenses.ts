export interface BankTransaction {
  date: Date;
  merchant: string;
  memo: string;
  amount: number;
  classifiedCategory?: string;
  classifiedConfidence?: number;
}

export interface FixedExpense {
  id: string;
  merchant: string;
  category: string;
  monthlyAmount: number;
  averageAmount: number;
  paymentDay: number;
  activeMonths: number;
  confidence: number;
}

export interface MonthlyFixedTotal {
  month: string;
  label: string;
  amount: number;
}

export interface FixedExpenseAnalysis {
  expenses: FixedExpense[];
  monthlyTotals: MonthlyFixedTotal[];
  latestMonthlyTotal: number;
  averageMonthlyTotal: number;
  analyzedTransactions: number;
  periodLabel: string;
}

const RULES = [
  { keyword: '월세', category: '주거' },
  { keyword: '관리비', category: '주거' },
  { keyword: '통신', category: '통신' },
  { keyword: '보험', category: '보험' },
  { keyword: '넷플릭스', category: '구독' },
] as const;

const normalizeMerchant = (merchant: string): string =>
  merchant.replace(/(통신요금)\d{2}$/u, '$1').replace(/\s+/gu, '').trim();

const getCategory = (merchant: string, memo: string): string | null => {
  const target = `${merchant} ${memo}`;
  return RULES.find((rule) => target.includes(rule.keyword))?.category ?? null;
};

const monthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const average = (values: number[]): number =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

export const analyzeFixedExpenses = (csvText: string): FixedExpenseAnalysis => {
  const lines = csvText.replace(/^\uFEFF/u, '').split(/\r?\n/u).filter(Boolean);
  const headerIndex = lines.findIndex((line) => line.startsWith('거래일시,'));
  if (headerIndex < 0) throw new Error('거래일시 헤더를 찾을 수 없습니다.');

  const headers = lines[headerIndex].split(',').map((cell) => cell.trim());
  const column = (name: string) => headers.indexOf(name);
  const usesFinalClassification = column('고정비여부') >= 0
    && column('분류카테고리') >= 0
    && column('분류신뢰도') >= 0;
  const transactions: BankTransaction[] = lines.slice(headerIndex + 1).flatMap((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const dateText = cells[column('거래일시')]?.replaceAll('.', '-').replace(' ', 'T');
    const date = new Date(dateText);
    const amount = Number(cells[column('출금액')] || 0);
    const merchant = cells[column('보낸분/받는분')] || cells[column('적요')];
    if (!merchant || !amount || Number.isNaN(date.getTime())) return [];
    if (usesFinalClassification && cells[column('고정비여부')] !== 'Y') return [];
    return [{
      date,
      merchant: normalizeMerchant(merchant),
      memo: cells[column('송금메모')] || '',
      amount,
      classifiedCategory: usesFinalClassification ? cells[column('분류카테고리')] : undefined,
      classifiedConfidence: usesFinalClassification
        ? Number(cells[column('분류신뢰도')])
        : undefined,
    }];
  });

  const groups = new Map<string, BankTransaction[]>();
  transactions.forEach((item) => {
    const category = item.classifiedCategory || getCategory(item.merchant, item.memo);
    if (!category) return;
    const key = `${category}:${item.merchant}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  const expenses = Array.from(groups.entries()).flatMap(([id, items]) => {
    const byMonth = new Map<string, BankTransaction[]>();
    items.forEach((item) => {
      const key = monthKey(item.date);
      byMonth.set(key, [...(byMonth.get(key) ?? []), item]);
    });
    if (byMonth.size < 2) return [];

    const sortedAmounts = items.map((item) => item.amount).sort((a, b) => a - b);
    const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
    const representatives = Array.from(byMonth.values()).map((monthlyItems) =>
      monthlyItems.reduce((closest, item) =>
        Math.abs(item.amount - median) < Math.abs(closest.amount - median) ? item : closest,
      ),
    );
    const amounts = representatives.map((item) => item.amount);
    const averageAmount = average(amounts);
    const deviation = averageAmount
      ? Math.max(...amounts.map((amount) => Math.abs(amount - averageAmount) / averageAmount))
      : 1;
    const latest = [...representatives].sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    return [{
      id,
      merchant: latest.merchant,
      category: latest.classifiedCategory || getCategory(latest.merchant, latest.memo) || '기타',
      monthlyAmount: latest.amount,
      averageAmount: Math.round(averageAmount),
      paymentDay: Math.round(average(representatives.map((item) => item.date.getDate()))),
      activeMonths: byMonth.size,
      confidence: latest.classifiedConfidence
        ?? Math.max(70, Math.min(99, Math.round(100 - deviation * 100))),
    }];
  }).sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const months = Array.from(new Set(transactions.map((item) => monthKey(item.date)))).sort();
  const monthlyTotals = months.map((month) => {
    const amount = expenses.reduce((sum, expense) => {
      const matching = groups.get(expense.id)?.filter((item) => monthKey(item.date) === month) ?? [];
      if (!matching.length) return sum;
      const closest = matching.reduce((best, item) =>
        Math.abs(item.amount - expense.averageAmount) < Math.abs(best.amount - expense.averageAmount)
          ? item
          : best,
      );
      return sum + closest.amount;
    }, 0);
    return { month, label: `${Number(month.split('-')[1])}월`, amount };
  }).filter((item) => item.amount > 0);

  return {
    expenses,
    monthlyTotals,
    latestMonthlyTotal: expenses.reduce((sum, item) => sum + item.monthlyAmount, 0),
    averageMonthlyTotal: Math.round(average(monthlyTotals.map((item) => item.amount))),
    analyzedTransactions: transactions.length,
    periodLabel: lines[0]?.split(',')[1] ?? '분석 기간 정보 없음',
  };
};
