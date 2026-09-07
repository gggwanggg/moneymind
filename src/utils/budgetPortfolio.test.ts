import assert from 'node:assert/strict';
import test from 'node:test';
import type { BudgetItem } from '../types';
import { INITIAL_PORTFOLIO } from './initialData';
import { analyzeSpendingAgainstPortfolio } from './aiAdvisor';
import {
  applyBudgetPreset,
  BUDGET_PRESETS,
  calculateBudget,
  formatBudgetPercent,
  getBudgetItems,
  saveBudgetPortfolio,
} from './budgetPortfolio';

const item = (amount: number): BudgetItem => ({
  id: 'saving',
  name: '저축',
  group: 'saving',
  color: '#10B981',
  amount,
});

test('salary is the denominator and unallocated amounts remain visible', () => {
  const result = calculateBudget(3_000_000, [item(900_000)]);
  assert.equal(result.items[0].percent, 30);
  assert.equal(result.totalBudget, 900_000);
  assert.equal(result.remainingAmount, 2_100_000);
  assert.equal(result.unallocatedPercent, 70);
  assert.equal(result.isOverBudget, false);
  assert.equal(calculateBudget(6_000_000, result.items).items[0].percent, 15);
});

test('exactly allocated and over-allocated budgets are distinguished', () => {
  const exact = calculateBudget(3_000_000, [item(3_000_000)]);
  assert.equal(exact.totalPercent, 100);
  assert.equal(exact.remainingAmount, 0);
  assert.equal(exact.isOverBudget, false);
  const over = calculateBudget(3_000_000, [item(3_600_000)]);
  assert.equal(over.totalPercent, 120);
  assert.equal(over.exceededPercent, 20);
  assert.equal(over.remainingAmount, -600_000);
  assert.match(over.warnings[0], /600,000원 초과/);
  assert.throws(() => saveBudgetPortfolio(INITIAL_PORTFOLIO, over));
});

test('the red emphasis starts strictly above 40%, including one won above', () => {
  assert.equal(
    calculateBudget(3_000_000, [item(1_200_000)]).items[0].exceedsFortyPercent,
    false,
  );
  assert.equal(
    calculateBudget(3_000_000, [item(1_200_001)]).items[0].exceedsFortyPercent,
    true,
  );
});

test('zero salary returns JSON-safe null ratios and cannot be saved', () => {
  for (const amount of [0, 100_000]) {
    const result = calculateBudget(0, [item(amount)]);
    assert.equal(result.totalPercent, null);
    assert.equal(result.items[0].percent, null);
    assert.equal(result.unallocatedPercent, null);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    assert.throws(() => saveBudgetPortfolio(INITIAL_PORTFOLIO, result));
  }
  assert.equal(calculateBudget(3_000_000, [item(0)]).unallocatedPercent, 100);
});

test('invalid monetary inputs are rejected instead of corrupting totals', () => {
  for (const invalid of [-1, NaN, Infinity, 0.5, 1_000_000_000_001]) {
    assert.throws(() => calculateBudget(invalid, []), RangeError);
    assert.throws(
      () => calculateBudget(3_000_000, [item(invalid)]),
      RangeError,
    );
  }
});

test('all three presets allocate the exact salary even when won amounts do not divide evenly', () => {
  for (const preset of BUDGET_PRESETS) {
    for (const salary of [0, 1, 101, 3_000_001, 1_000_000_000_000]) {
      const items = applyBudgetPreset(salary, preset.id);
      assert.equal(
        items.reduce((total, item) => total + item.amount, 0),
        salary,
      );
      assert.ok(
        items.every(
          (item) => Number.isInteger(item.amount) && item.amount >= 0,
        ),
      );
    }
  }
  const items = applyBudgetPreset(3_000_000, 'saving');
  assert.equal(items.find((item) => item.id === 'saving')!.amount, 1_500_000);
  assert.equal(items.find((item) => item.id === 'housing')!.amount, 900_000);
  assert.equal(
    items
      .filter((item) => item.group === 'living')
      .reduce((total, item) => total + item.amount, 0),
    600_000,
  );
});

test('legacy data retains its amounts and the detailed budget survives JSON persistence', () => {
  const legacy = getBudgetItems(INITIAL_PORTFOLIO);
  assert.equal(
    legacy.reduce((total, item) => total + item.amount, 0),
    3_000_000,
  );
  assert.equal(legacy.find((item) => item.id === 'living')!.amount, 1_500_000);
  assert.equal(legacy.find((item) => item.id === 'housing')!.amount, 0);
  const items = applyBudgetPreset(3_000_000, 'saving');
  const saved = saveBudgetPortfolio(
    INITIAL_PORTFOLIO,
    calculateBudget(3_000_000, items),
  );
  assert.deepEqual(getBudgetItems(JSON.parse(JSON.stringify(saved))), items);
  assert.equal(
    saved.categories.find((item) => item.id === 'living')!.amount,
    1_500_000,
  );
  assert.equal(
    saved.categories.find((item) => item.id === 'saving')!.percent,
    50,
  );
  assert.equal(
    saved.categories.find((item) => item.id === 'investment')!.percent,
    0,
  );
  assert.equal(
    INITIAL_PORTFOLIO.categories.find((item) => item.id === 'saving')!.percent,
    30,
  );
});

test('spending analysis uses the saved food budget, including a zero food budget', () => {
  for (const foodAmount of [0, 100_000]) {
    const items = applyBudgetPreset(3_000_000, 'saving').map((item) =>
      item.id === 'food' ? { ...item, amount: foodAmount } : item,
    );
    const saved = saveBudgetPortfolio(
      INITIAL_PORTFOLIO,
      calculateBudget(3_000_000, items),
    );
    const analysis = analyzeSpendingAgainstPortfolio(saved, [
      {
        id: 'test',
        merchant: '식당',
        category: '식비',
        amount: 90_000,
        date: '오늘',
        isMicroSpending: false,
      },
    ]);
    assert.equal(analysis.mainAlert?.budgetAmount, foodAmount);
  }
});

test('a one-won difference still warns even when the displayed total rounds to 100%', () => {
  const result = calculateBudget(3_000_000, [item(3_000_001)]);
  assert.equal(result.isOverBudget, true);
  assert.equal(formatBudgetPercent(result.exceededPercent), '<0.01%');
});
