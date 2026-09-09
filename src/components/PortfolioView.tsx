import { useMemo, useState, type CSSProperties } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Download,
  PieChart,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { PortfolioConfig } from '../types';
import { BudgetPieChart } from './BudgetPieChart';
import {
  applyBudgetPreset,
  BUDGET_PRESETS,
  calculateBudget,
  formatBudgetPercent,
  getBudgetItems,
  MAX_BUDGET_AMOUNT,
  saveBudgetPortfolio,
} from '../utils/budgetPortfolio';

interface PortfolioViewProps {
  portfolio: PortfolioConfig;
  onSavePortfolio: (portfolio: PortfolioConfig) => void;
  onNavigateToSpending: () => void;
}

const money = (amount: number) => amount.toLocaleString('ko-KR');
const parseMoney = (value: string): number | null => {
  const digits = value.replace(/,/g, '').trim();
  if (!/^\d*$/.test(digits)) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount <= MAX_BUDGET_AMOUNT
    ? amount
    : null;
};

export function PortfolioView({
  portfolio,
  onSavePortfolio,
  onNavigateToSpending,
}: PortfolioViewProps) {
  const [salary, setSalary] = useState(portfolio.salary);
  const [items, setItems] = useState(() => getBudgetItems(portfolio));
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const result = useMemo(() => calculateBudget(salary, items), [salary, items]);
  const json = JSON.stringify(result, null, 2);
  const canSave = salary > 0 && !result.isOverBudget;

  const changeSalary = (value: string) => {
    const amount = parseMoney(value);
    if (amount === null) return;
    setSalary(amount);
    setSelectedPreset(null);
    setSaved(false);
  };

  const changeAmount = (id: string, amount: number) => {
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, amount } : item)),
    );
    setSelectedPreset(null);
    setSaved(false);
  };

  const downloadJson = () => {
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'moneymind-budget.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-emerald-700">
            MY MONTHLY BUDGET
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#031635] sm:text-3xl">
            월급 예산 포트폴리오
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            내 월급이 어디로 가는지, 한눈에 확인하고 계획하세요.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          실시간 예산 계산
        </span>
      </div>

      <section
        aria-label="월급과 예산 요약"
        className="overflow-hidden rounded-3xl bg-[#031635] p-5 text-white shadow-xl shadow-slate-200/60 sm:p-7"
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <label
              htmlFor="budget-salary"
              className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300"
            >
              <Wallet className="h-4 w-4" />
              이번 달 실수령 월급
            </label>
            <div className="flex items-center gap-3 border-b border-white/25 pb-2 focus-within:border-emerald-400">
              <input
                id="budget-salary"
                inputMode="numeric"
                type="text"
                value={salary ? money(salary) : ''}
                placeholder="월급 입력"
                onChange={(event) => changeSalary(event.target.value)}
                className="min-w-0 w-full bg-transparent text-3xl font-bold tabular-nums text-white outline-none placeholder:text-slate-500 sm:text-4xl"
              />
              <span className="text-lg text-slate-300">원</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              월급을 변경해도 설정한 예산 금액은 유지됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-300">배정한 총 예산</p>
              <p className="mt-2 break-all text-xl font-bold tabular-nums sm:text-2xl">
                {money(result.totalBudget)}
                <span className="ml-1 text-xs font-normal">원</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">
                월급의 {formatBudgetPercent(result.totalPercent)}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-4 ${result.isOverBudget ? 'border-red-400/30 bg-red-400/10' : 'border-emerald-400/20 bg-emerald-400/10'}`}
            >
              <p className="text-xs text-slate-300">
                {result.isOverBudget ? '초과한 금액' : '남은 금액'}
              </p>
              <p
                className={`mt-2 break-all text-xl font-bold tabular-nums sm:text-2xl ${result.isOverBudget ? 'text-red-300' : 'text-emerald-300'}`}
              >
                {money(Math.abs(result.remainingAmount))}
                <span className="ml-1 text-xs font-normal">원</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {result.isOverBudget
                  ? '예산 조정이 필요해요'
                  : '추가로 배정할 수 있어요'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        role="status"
        aria-live="polite"
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${salary === 0 ? 'border-slate-200 bg-white text-slate-600' : result.isOverBudget ? 'border-red-200 bg-red-50 text-red-700' : result.remainingAmount > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
      >
        {salary > 0 && result.remainingAmount === 0 ? (
          <Check className="h-5 w-5 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0" />
        )}
        <p>
          {salary === 0 ? (
            result.warnings.join(' ')
          ) : result.isOverBudget ? (
            <>
              총 예산이 월급의 100%를{' '}
              <strong>
                {formatBudgetPercent(result.exceededPercent)} 초과
              </strong>
              했습니다. {money(-result.remainingAmount)}원을 줄여주세요.
            </>
          ) : result.remainingAmount > 0 ? (
            <>
              100%까지{' '}
              <strong>
                {formatBudgetPercent(result.unallocatedPercent)} 부족
              </strong>
              합니다. {money(result.remainingAmount)}원이 아직 배정되지
              않았어요.
            </>
          ) : (
            <>
              <strong>100% 배정 완료!</strong> 월급에 맞게 예산을 설정했어요.
            </>
          )}
        </p>
      </div>

      <section
        aria-labelledby="budget-distribution-title"
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-ambient sm:p-7"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2
              id="budget-distribution-title"
              className="flex items-center gap-2 text-lg font-bold text-[#031635]"
            >
              <PieChart className="h-5 w-5 text-emerald-600" />
              한눈에 보는 예산 분포
            </h2>
            <p className="mt-1.5 text-xs text-slate-500">
              금액을 조정하면 차트와 월급 대비 비율이 함께 바뀝니다.
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
            KRW
          </span>
        </div>
        <div className="grid items-center gap-7 sm:grid-cols-2">
          <BudgetPieChart result={result} />
          <div className="space-y-1">
            {result.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2.5 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: item.exceedsFortyPercent
                        ? '#EF4444'
                        : item.color,
                    }}
                  />
                  {item.name}
                </span>
                <span
                  className={`font-semibold tabular-nums ${item.exceedsFortyPercent ? 'text-red-600' : 'text-slate-800'}`}
                >
                  {formatBudgetPercent(item.percent)}
                  <span className="ml-3 hidden text-xs font-normal text-slate-400 lg:inline">
                    {money(item.amount)}원
                  </span>
                </span>
              </div>
            ))}
            {result.remainingAmount > 0 && (
              <div className="flex justify-between border-t border-slate-100 px-2 pt-3 text-sm text-slate-500">
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  미배정
                </span>
                <span className="tabular-nums">
                  {formatBudgetPercent(result.unallocatedPercent)}
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
          {result.isOverBudget
            ? '초과 상태에서는 파이 크기가 총 배정 예산 기준으로 표시됩니다. 범례와 툴팁의 비율은 월급 기준입니다.'
            : '미배정 금액까지 포함한 월급 전체를 표시합니다.'}{' '}
          월급의 40%를 넘는 항목은 빨간색으로 강조합니다.
        </p>
      </section>

      <section aria-labelledby="budget-presets-title" className="space-y-3">
        <div>
          <h2
            id="budget-presets-title"
            className="flex items-center gap-2 text-base font-bold text-[#031635]"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            어디서 시작할지 고민이라면
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            추천 비율 3가지 중 선택하세요. 적용하면 전체 예산을 다시 배정합니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={!salary}
              aria-pressed={selectedPreset === preset.id}
              onClick={() => {
                setItems(applyBudgetPreset(salary, preset.id));
                setSelectedPreset(preset.id);
                setSaved(false);
              }}
              className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${selectedPreset === preset.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
            >
              <span className="flex items-center justify-between text-sm font-bold text-[#031635]">
                {preset.name}
                {selectedPreset === preset.id ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                )}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {preset.description}
              </span>
              <span className="mt-3 block text-xs font-semibold text-emerald-700">
                저축 {preset.saving}% · 고정비 {preset.fixed}% · 생활비{' '}
                {preset.living}%
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          템플릿의 고정비는 주거비에, 생활비는 식비 70%·기타 생활비 30%로
          배정합니다. 투자·기타 예산은 적용 후 직접 조정할 수 있습니다.
        </p>
      </section>

      <section aria-labelledby="budget-input-title" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2
              id="budget-input-title"
              className="text-lg font-bold text-[#031635]"
            >
              카테고리별 예산 설정
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              슬라이더를 움직이거나 원하는 금액을 직접 입력하세요.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-400">
            {items.length}개 항목
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {result.items.map((item) => {
            const color = item.exceedsFortyPercent ? '#EF4444' : item.color;
            const max = Math.max(salary, item.amount, 10000);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition-colors ${item.exceedsFortyPercent ? 'border-red-200 bg-red-50/60' : 'border-slate-100 bg-white shadow-ambient'}`}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <label
                    htmlFor={`budget-amount-${item.id}`}
                    className="flex items-center gap-2 text-sm font-bold text-[#031635]"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {item.name}
                  </label>
                  <span
                    className={`rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${item.exceedsFortyPercent ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-600'}`}
                  >
                    {formatBudgetPercent(item.percent)}
                  </span>
                </div>
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                  <input
                    id={`budget-amount-${item.id}`}
                    type="text"
                    inputMode="numeric"
                    value={item.amount ? money(item.amount) : ''}
                    placeholder="0"
                    onChange={(event) => {
                      const amount = parseMoney(event.target.value);
                      if (amount !== null) changeAmount(item.id, amount);
                    }}
                    className="min-w-0 w-full bg-transparent text-right text-lg font-bold tabular-nums text-[#031635] outline-none"
                  />
                  <span className="text-sm text-slate-400">원</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={max}
                  step={1}
                  value={item.amount}
                  aria-label={`${item.name} 예산 슬라이더`}
                  aria-valuetext={`${money(item.amount)}원, 월급 대비 ${formatBudgetPercent(item.percent)}`}
                  onChange={(event) =>
                    changeAmount(item.id, Number(event.target.value))
                  }
                  className="budget-slider focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4"
                  style={
                    {
                      '--budget-color': color,
                      background: `linear-gradient(to right, ${color} ${(item.amount / max) * 100}%, #E2E8F0 ${(item.amount / max) * 100}%)`,
                    } as CSSProperties
                  }
                />
                <div className="mt-2 flex justify-between text-[11px] tabular-nums text-slate-400">
                  <span>0원</span>
                  <span>{money(max)}원</span>
                </div>
                {item.exceedsFortyPercent && (
                  <p className="mt-3 flex items-center gap-1 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    월급의 40%를 초과한 항목입니다.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div aria-live="polite">
          <p className="text-sm font-semibold text-[#031635]">
            {saved
              ? '예산 포트폴리오가 저장되었습니다.'
              : '나에게 맞는 예산을 완성해보세요.'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {!salary
              ? '저장하려면 월급을 입력해주세요.'
              : result.isOverBudget
                ? '초과한 예산을 조정한 뒤 저장할 수 있습니다.'
                : '저장하면 홈과 소비 분석에도 반영됩니다.'}
          </p>
        </div>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            onSavePortfolio(saveBudgetPortfolio(portfolio, result));
            setSaved(true);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Check className="h-4 w-4" />
          예산 저장하기
        </button>
      </div>
      {saved && (
        <button
          type="button"
          onClick={onNavigateToSpending}
          className="flex items-center gap-1 text-sm font-semibold text-emerald-700"
        >
          소비 지출 분석 보기
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-600">
          예산 데이터 JSON 보기
        </summary>
        <div className="mt-4">
          <button
            type="button"
            onClick={downloadJson}
            className="mb-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Download className="h-4 w-4" />
            JSON 다운로드
          </button>
          <pre
            className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-emerald-200"
            aria-label="예산 계산 JSON 결과"
          >
            {json}
          </pre>
        </div>
      </details>
    </div>
  );
}
