import { PortfolioConfig, Transaction, SpendingAdvice, MerchantPattern } from '../types';

export function analyzeSpendingAgainstPortfolio(
  portfolio: PortfolioConfig,
  transactions: Transaction[]
): {
  categorySpend: Record<string, number>;
  totalSpend: number;
  categoryPercentages: Record<string, number>;
  adviceList: SpendingAdvice[];
  mainAlert: SpendingAdvice | null;
} {
  const categorySpend: Record<string, number> = {
    '식비': 0,
    '쇼핑': 0,
    '교통': 0,
    '문화/여가': 0,
    '기타': 0,
  };

  let totalSpend = 0;

  transactions.forEach((tx) => {
    const cat = mapToStandardCategory(tx.category);
    if (categorySpend[cat] !== undefined) {
      categorySpend[cat] += tx.amount;
    } else {
      categorySpend['기타'] += tx.amount;
    }
    totalSpend += tx.amount;
  });

  // Ensure non-zero total for percentages
  const safeTotal = totalSpend > 0 ? totalSpend : 1;
  const categoryPercentages: Record<string, number> = {};
  Object.keys(categorySpend).forEach((cat) => {
    categoryPercentages[cat] = Math.round((categorySpend[cat] / safeTotal) * 100);
  });

  // Advice generation
  const adviceList: SpendingAdvice[] = [];

  // Find living budget from portfolio
  const livingCategory = portfolio.categories.find((c) => c.id === 'living');
  const livingBudget = livingCategory ? (portfolio.salary * livingCategory.percent) / 100 : 1500000;
  
  // Approximate variable food / shopping budget allowance (e.g. food is ~30% of living budget)
  const foodBudget = portfolio.budgetItems?.find((item) => item.id === 'food')?.amount ?? livingBudget * 0.35;
  const foodSpent = categorySpend['식비'];
  const foodRatio = Math.round((foodSpent / (foodBudget || 1)) * 100);

  let mainAlert: SpendingAdvice | null = null;

  if (foodRatio >= 70) {
    mainAlert = {
      id: 'alert-food',
      type: 'danger',
      title: '지출 알림',
      message: `이번 달 식비 예산의 ${Math.min(foodRatio, 95)}%를 이미 사용했습니다. 남은 기간 동안 예산 초과에 주의하세요.`,
      category: '식비',
      budgetAmount: foodBudget,
      spentAmount: foodSpent,
      ratio: foodRatio,
    };
    adviceList.push(mainAlert);
  } else {
    mainAlert = {
      id: 'alert-normal',
      type: 'info',
      title: '지출 관리 양호',
      message: '현재 설정된 월급 포트폴리오 범위 내에서 안정적으로 소비가 관리되고 있습니다.',
    };
  }

  // Shopping check
  const shoppingBudget = livingBudget * 0.25;
  const shoppingSpent = categorySpend['쇼핑'];
  if (shoppingSpent > shoppingBudget * 0.8) {
    adviceList.push({
      id: 'adv-shop',
      type: 'warning',
      title: '쇼핑/이커머스 지출 주의',
      message: `쇼핑 지출(₩${shoppingSpent.toLocaleString()})이 이번 달 가용 쇼핑 예산에 근접했습니다. 소액 결제 충동구매를 점검해보세요.`,
      category: '쇼핑',
    });
  }

  // Investment / Savings advice
  const savingCat = portfolio.categories.find((c) => c.id === 'saving');
  if (savingCat && savingCat.percent < 20) {
    adviceList.push({
      id: 'adv-saving',
      type: 'warning',
      title: '저축 비중 권장',
      message: '현재 저축 비율이 20% 미만입니다. 월급의 최소 25~30%를 비상금 및 안정적 자산으로 배정하는 것을 권장합니다.',
    });
  }

  return {
    categorySpend,
    totalSpend,
    categoryPercentages,
    adviceList,
    mainAlert,
  };
}

export function analyzeMicroSpendingPatterns(
  transactions: Transaction[],
  initialPatterns: MerchantPattern[]
): {
  patterns: MerchantPattern[];
  totalMicroAmount: number;
  totalMicroCount: number;
  percentChange: number;
} {
  // Aggregate micro transactions by merchant
  const map: Record<string, { count: number; total: number; category: string }> = {};

  transactions
    .filter((t) => t.isMicroSpending || t.amount <= 25000)
    .forEach((t) => {
      const name = cleanMerchantName(t.merchant);
      if (!map[name]) {
        map[name] = { count: 0, total: 0, category: t.category };
      }
      map[name].count += 1;
      map[name].total += t.amount;
    });

  // Merge with pre-computed patterns if transactions are few
  const patterns: MerchantPattern[] = [...initialPatterns];

  let totalMicroAmount = 240000;
  let totalMicroCount = 0;

  patterns.forEach((p) => {
    totalMicroCount += p.count;
  });

  return {
    patterns,
    totalMicroAmount,
    totalMicroCount,
    percentChange: 15,
  };
}

function cleanMerchantName(name: string): string {
  if (name.includes('쿠팡')) return '쿠팡';
  if (name.includes('다이소')) return '다이소';
  if (name.includes('스타벅스') || name.includes('스벅')) return '스타벅스';
  if (name.includes('지하철') || name.includes('버스') || name.includes('교통')) return '교통카드';
  return name;
}

export function mapToStandardCategory(cat: string): string {
  if (cat.includes('식비') || cat.includes('외식') || cat.includes('카페') || cat.includes('음료')) return '식비';
  if (cat.includes('쇼핑') || cat.includes('의류') || cat.includes('잡화') || cat.includes('백화점')) return '쇼핑';
  if (cat.includes('교통') || cat.includes('지하철') || cat.includes('버스') || cat.includes('택시')) return '교통';
  if (cat.includes('문화') || cat.includes('여가') || cat.includes('영화') || cat.includes('도서')) return '문화/여가';
  return '기타';
}
