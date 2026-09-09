import type { BudgetItem, BudgetResult, PortfolioConfig } from '../types';

export const MAX_BUDGET_AMOUNT = 1_000_000_000_000;

const ITEM_DEFINITIONS: Omit<BudgetItem, 'amount'>[] = [
  { id: 'housing', name: '주거비', group: 'fixed', color: '#6366F1' },
  { id: 'food', name: '식비', group: 'living', color: '#F59E0B' },
  { id: 'living', name: '기타 생활비', group: 'living', color: '#0EA5E9' },
  { id: 'saving', name: '저축', group: 'saving', color: '#10B981' },
  { id: 'investment', name: '투자', group: 'investment', color: '#A855F7' },
  { id: 'etc', name: '기타 예산', group: 'etc', color: '#64748B' },
];

export const BUDGET_PRESETS = [
  {
    id: 'saving',
    name: '저축 집중형',
    description: '목돈 마련을 우선으로',
    saving: 50,
    fixed: 30,
    living: 20,
  },
  {
    id: 'balanced',
    name: '균형 생활형',
    description: '저축과 일상의 균형',
    saving: 30,
    fixed: 40,
    living: 30,
  },
  {
    id: 'flexible',
    name: '생활 여유형',
    description: '생활 예산을 넉넉하게',
    saving: 20,
    fixed: 40,
    living: 40,
  },
] as const;

export function formatBudgetPercent(percent: number | null): string {
  if (percent === null) return '—';
  if (percent > 0 && percent < 0.01) return '<0.01%';
  return `${percent.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
}

function assertMoney(amount: number) {
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    amount > MAX_BUDGET_AMOUNT
  ) {
    throw new RangeError('금액은 0 이상 1조원 이하의 정수여야 합니다.');
  }
}

/** Percentages always use salary as the denominator; a missing salary has no ratio. */
export function calculateBudget(
  salary: number,
  items: BudgetItem[],
): BudgetResult {
  assertMoney(salary);
  items.forEach((item) => assertMoney(item.amount));
  const totalBudget = items.reduce((total, item) => total + item.amount, 0);
  if (!Number.isSafeInteger(totalBudget))
    throw new RangeError('예산 합계가 계산 범위를 초과했습니다.');
  const remainingAmount = salary - totalBudget;
  const ratio = (amount: number) =>
    salary > 0 ? (amount / salary) * 100 : null;
  const isOverBudget = totalBudget > salary;
  const warnings: string[] = [];
  if (salary === 0)
    warnings.push('월급을 입력하면 월급 대비 비율을 계산할 수 있습니다.');
  if (isOverBudget)
    warnings.push(
      `총 예산이 월급보다 ${(-remainingAmount).toLocaleString('ko-KR')}원 초과했습니다.`,
    );
  return {
    salary,
    totalBudget,
    remainingAmount,
    totalPercent: ratio(totalBudget),
    unallocatedPercent: ratio(Math.max(remainingAmount, 0)),
    exceededPercent: ratio(Math.max(-remainingAmount, 0)),
    isOverBudget,
    warnings,
    items: items.map((item) => ({
      ...item,
      percent: ratio(item.amount),
      exceedsFortyPercent: salary > 0 && item.amount > salary * 0.4,
    })),
  };
}

/** Preserve existing saved amounts; do not guess a housing/food split. */
export function getBudgetItems(portfolio: PortfolioConfig): BudgetItem[] {
  if (portfolio.budgetItems)
    return portfolio.budgetItems.map((item) => ({ ...item }));
  return ITEM_DEFINITIONS.map((item) => ({
    ...item,
    amount:
      portfolio.categories.find((category) => category.id === item.id)
        ?.amount ?? 0,
  }));
}

export function applyBudgetPreset(
  salary: number,
  presetId: string,
): BudgetItem[] {
  assertMoney(salary);
  const preset = BUDGET_PRESETS.find((item) => item.id === presetId);
  if (!preset) throw new Error('알 수 없는 예산 템플릿입니다.');
  const saving = Math.floor((salary * preset.saving) / 100);
  const housing = Math.floor((salary * preset.fixed) / 100);
  const living = salary - saving - housing;
  const food = Math.floor(living * 0.7);
  const amounts: Record<string, number> = {
    saving,
    housing,
    food,
    living: living - food,
  };
  return ITEM_DEFINITIONS.map((item) => ({
    ...item,
    amount: amounts[item.id] ?? 0,
  }));
}

/** Keep aggregate categories consumed by HomeView and spending analysis compatible. */
export function saveBudgetPortfolio(
  previous: PortfolioConfig,
  result: BudgetResult,
): PortfolioConfig {
  if (result.salary <= 0 || result.isOverBudget)
    throw new Error('월급과 예산 합계를 확인해주세요.');
  const budgetItems = result.items.map(
    ({ percent, exceedsFortyPercent, ...item }) => item,
  );
  const categories = previous.categories.map((category) => {
    const amount = budgetItems.reduce((total, item) => {
      const categoryId = item.group === 'fixed' ? 'living' : item.group;
      return total + (categoryId === category.id ? item.amount : 0);
    }, 0);
    return { ...category, amount, percent: (amount / result.salary) * 100 };
  });
  return {
    ...previous,
    salary: result.salary,
    categories,
    budgetItems,
    totalPercent: result.totalPercent!,
    lastUpdated: new Date().toISOString(),
    isConfirmed: true,
  };
}
