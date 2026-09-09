import { useMemo, useState, useSyncExternalStore } from 'react';
import { Building2, CalendarDays, CheckCircle2, ChevronDown, FileSpreadsheet, House, Radio, RefreshCw, ShieldCheck, Tv } from 'lucide-react';
import { analyzeFixedExpenses, FixedExpense } from './analyzeFixedExpenses';
import { getFixedExpenseCsvSnapshot, subscribeToFixedExpenseCsv } from './fixedExpenseCsvStore';

const won = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`;

const iconFor = (expense: FixedExpense) => {
  if (expense.merchant.includes('월세')) return <House className={'w-5 h-5'} />;
  if (expense.merchant.includes('관리비')) return <Building2 className={'w-5 h-5'} />;
  if (expense.category === '통신') return <Radio className={'w-5 h-5'} />;
  if (expense.category === '보험') return <ShieldCheck className={'w-5 h-5'} />;
  return <Tv className={'w-5 h-5'} />;
};

export const FixedExpenseView = () => {
  const csvData = useSyncExternalStore(
    subscribeToFixedExpenseCsv,
    getFixedExpenseCsvSnapshot,
    getFixedExpenseCsvSnapshot,
  );
  const analysis = useMemo(() => analyzeFixedExpenses(csvData.csvText), [csvData.csvText]);
  const [category, setCategory] = useState('전체');
  const [showGuide, setShowGuide] = useState(false);
  const categories = ['전체', ...new Set(analysis.expenses.map((item) => item.category))];
  const expenses = category === '전체'
    ? analysis.expenses
    : analysis.expenses.filter((item) => item.category === category);
  const maxMonthly = Math.max(...analysis.monthlyTotals.map((item) => item.amount), 1);

  return (
    <div className={'max-w-5xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12'}>
      <div className={'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'}>
        <div>
          <div className={'inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-2'}>
            <FileSpreadsheet className={'w-4 h-4'} /> {csvData.fileName} 자동 분석
          </div>
          <h1 className={'text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight'}>고정비 지출</h1>
          <p className={'text-sm text-[#44474E] mt-1'}>반복 지출을 찾아 매달 빠져나갈 금액을 미리 확인하세요.</p>
        </div>
        <button type={'button'} onClick={() => setShowGuide((value) => !value)}
          className={'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-bold text-[#031635] hover:border-emerald-400 transition-colors cursor-pointer'}>
          <RefreshCw className={'w-4 h-4 text-emerald-600'} /> 분석 기준 보기
          <ChevronDown className={`w-4 h-4 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showGuide && (
        <div className={'rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950'}>
          같은 지출처가 2개월 이상 반복되고 월세·관리비·통신·보험·구독 키워드에 해당하면 고정비 후보로 분류합니다.
        </div>
      )}

      <section className={'grid grid-cols-1 sm:grid-cols-3 gap-4'}>
        <article className={'sm:col-span-2 rounded-3xl bg-[#031635] p-6 text-white shadow-xl relative overflow-hidden'}>
          <div className={'absolute -right-16 -top-20 w-56 h-56 rounded-full bg-emerald-400/15 blur-2xl'} />
          <div className={'relative'}>
            <p className={'text-xs text-emerald-200 font-bold tracking-wider'}>최근 월 예상 고정비</p>
            <p className={'text-3xl sm:text-4xl font-extrabold font-mono mt-2'}>{won(analysis.latestMonthlyTotal)}</p>
            <div className={'flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-gray-300'}>
              <span>{analysis.expenses.length}개 반복 항목</span>
              <span>월평균 {won(analysis.averageMonthlyTotal)}</span>
              <span>{analysis.periodLabel}</span>
            </div>
          </div>
        </article>
        <article className={'rounded-3xl bg-white border border-gray-100 p-5 shadow-ambient flex flex-col justify-between'}>
          <div className={'w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center'}>
            <CheckCircle2 className={'w-5 h-5'} />
          </div>
          <div>
            <p className={'text-3xl font-extrabold text-[#031635]'}>{analysis.analyzedTransactions}</p>
            <p className={'text-xs text-gray-500 mt-1'}>분석한 출금 거래</p>
          </div>
        </article>
      </section>

      <section className={'rounded-3xl bg-white border border-gray-100 p-5 sm:p-6 shadow-ambient'}>
        <div className={'flex items-center justify-between mb-6'}>
          <div>
            <h2 className={'font-bold text-lg text-[#031635]'}>월별 고정비 흐름</h2>
            <p className={'text-xs text-gray-500 mt-1'}>중복 거래를 제외한 월별 대표 금액입니다.</p>
          </div>
          <CalendarDays className={'w-5 h-5 text-emerald-600'} />
        </div>
        <div className={'grid grid-cols-3 gap-4 h-44 items-end'}>
          {analysis.monthlyTotals.map((item) => (
            <div key={item.month} className={'h-full flex flex-col justify-end items-center gap-2'}>
              <span className={'text-xs font-bold text-[#031635] font-mono'}>{won(item.amount)}</span>
              <div className={'w-full max-w-24 rounded-t-2xl bg-gradient-to-t from-emerald-600 to-emerald-300 transition-all'}
                style={{ height: `${Math.max(18, (item.amount / maxMonthly) * 112)}px` }} />
              <span className={'text-xs font-semibold text-gray-500'}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={'rounded-3xl bg-white border border-gray-100 p-5 sm:p-6 shadow-ambient'}>
        <div className={'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5'}>
          <div>
            <h2 className={'font-bold text-lg text-[#031635]'}>감지된 고정비</h2>
            <p className={'text-xs text-gray-500 mt-1'}>최근 결제액과 반복 주기를 기준으로 정렬했습니다.</p>
          </div>
          <div className={'flex gap-2 overflow-x-auto pb-1'}>
            {categories.map((item) => (
              <button key={item} type={'button'} onClick={() => setCategory(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${category === item ? 'bg-[#031635] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={'divide-y divide-gray-100'}>
          {expenses.map((expense) => (
            <article key={expense.id} className={'py-4 first:pt-0 last:pb-0 flex items-center gap-3 sm:gap-4'}>
              <div className={'w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0'}>
                {iconFor(expense)}
              </div>
              <div className={'min-w-0 flex-1'}>
                <div className={'flex items-center gap-2'}>
                  <h3 className={'font-bold text-sm text-[#031635] truncate'}>{expense.merchant}</h3>
                  <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500'}>{expense.category}</span>
                </div>
                <p className={'text-xs text-gray-500 mt-1'}>매월 {expense.paymentDay}일경 · {expense.activeMonths}개월 반복</p>
              </div>
              <div className={'text-right shrink-0'}>
                <p className={'font-mono font-extrabold text-sm sm:text-base text-[#031635]'}>{won(expense.monthlyAmount)}</p>
                <p className={'text-[10px] font-bold text-emerald-700 mt-1'}>일치도 {expense.confidence}%</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
