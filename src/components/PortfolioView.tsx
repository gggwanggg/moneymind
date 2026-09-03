import React, { useState } from 'react';
import { Home, PiggyBank, TrendingUp, MoreHorizontal, CheckCircle, CreditCard, Sparkles, Sliders, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PortfolioConfig, PortfolioCategory } from '../types';

interface PortfolioViewProps {
  portfolio: PortfolioConfig;
  onSavePortfolio: (portfolio: PortfolioConfig) => void;
  onNavigateToSpending: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  onSavePortfolio,
  onNavigateToSpending,
}) => {
  const [salary, setSalary] = useState<number>(portfolio.salary);
  const [salaryInput, setSalaryInput] = useState<string>(portfolio.salary.toLocaleString());
  const [categories, setCategories] = useState<PortfolioCategory[]>(portfolio.categories);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Calculate total percentage
  const totalPercent = categories.reduce((sum, c) => sum + c.percent, 0);

  // Update salary
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = parseInt(rawVal, 10) || 0;
    setSalary(numVal);
    setSalaryInput(numVal > 0 ? numVal.toLocaleString() : '');
    
    // Recalculate category amounts
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        amount: Math.round((numVal * cat.percent) / 100),
      }))
    );
  };

  // Update specific category percent
  const handleSliderChange = (id: string, newPercent: number) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === id) {
          return {
            ...cat,
            percent: newPercent,
            amount: Math.round((salary * newPercent) / 100),
          };
        }
        return cat;
      })
    );
  };

  // Preset distributions
  const applyPreset = (presetName: string) => {
    let newDist: Record<string, number> = {};
    if (presetName === 'default') {
      newDist = { living: 50, saving: 30, investment: 15, etc: 5 };
    } else if (presetName === '503020') {
      newDist = { living: 50, saving: 30, investment: 20, etc: 0 };
    } else if (presetName === 'growth') {
      newDist = { living: 40, saving: 15, investment: 40, etc: 5 };
    } else if (presetName === 'frugal') {
      newDist = { living: 40, saving: 45, investment: 10, etc: 5 };
    }

    setCategories((prev) =>
      prev.map((cat) => {
        const p = newDist[cat.id] ?? cat.percent;
        return {
          ...cat,
          percent: p,
          amount: Math.round((salary * p) / 100),
        };
      })
    );
  };

  // Auto balance to 100%
  const autoBalance = () => {
    if (totalPercent === 100 || totalPercent === 0) return;
    const factor = 100 / totalPercent;
    let accumulated = 0;
    
    const adjusted = categories.map((cat, idx) => {
      if (idx === categories.length - 1) {
        const lastP = 100 - accumulated;
        return {
          ...cat,
          percent: Math.max(0, lastP),
          amount: Math.round((salary * Math.max(0, lastP)) / 100),
        };
      }
      const p = Math.round(cat.percent * factor);
      accumulated += p;
      return {
        ...cat,
        percent: p,
        amount: Math.round((salary * p) / 100),
      };
    });
    setCategories(adjusted);
  };

  // Confirm portfolio
  const handleConfirm = () => {
    const updated: PortfolioConfig = {
      salary,
      categories,
      totalPercent,
      lastUpdated: new Date().toISOString(),
      isConfirmed: true,
    };
    onSavePortfolio(updated);

    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#10B981', '#031635', '#6366F1', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2800);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'living':
        return <Home className="w-4 h-4 text-red-500" />;
      case 'saving':
        return <PiggyBank className="w-4 h-4 text-emerald-600" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryBg = (id: string) => {
    switch (id) {
      case 'living':
        return 'bg-red-100/70 text-red-600';
      case 'saving':
        return 'bg-emerald-100 text-emerald-800';
      case 'investment':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight mb-1.5 font-sans">
          나만의 포트폴리오 구성
        </h1>
        <p className="text-sm text-[#44474E]">
          자산 증식의 첫걸음, 완벽한 비율을 찾아보세요.
        </p>
      </div>

      {/* Section 1: Salary Input */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/80 relative overflow-hidden transition-shadow hover:shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#B6C6EF]/20 rounded-bl-full pointer-events-none -z-0" />
        <div className="relative z-10">
          <label className="block text-xs font-bold text-[#44474E] tracking-wider uppercase mb-3" htmlFor="salary">
            월급을 입력해주세요
          </label>
          <div className="flex items-center relative group">
            <span className="absolute left-1 text-[#75777F]">
              <CreditCard className="w-6 h-6" />
            </span>
            <input
              id="salary"
              type="text"
              value={salaryInput}
              onChange={handleSalaryChange}
              placeholder="0"
              className="w-full bg-transparent border-b-2 border-[#C5C6CF] focus:border-[#031635] border-t-0 border-x-0 rounded-none py-2 pl-10 pr-10 text-2xl sm:text-3xl font-bold text-[#031635] focus:ring-0 transition-colors font-mono text-right outline-none"
            />
            <span className="absolute right-1 text-xl sm:text-2xl font-bold text-[#44474E]">
              원
            </span>
          </div>

          {/* Quick salary chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-2 border-t border-gray-50">
            <span className="text-[11px] text-gray-400 font-medium mr-1">빠른 설정:</span>
            {[2500000, 3000000, 3500000, 4000000, 5000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setSalary(val);
                  setSalaryInput(val.toLocaleString());
                  setCategories((prev) =>
                    prev.map((cat) => ({
                      ...cat,
                      amount: Math.round((val * cat.percent) / 100),
                    }))
                  );
                }}
                className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors cursor-pointer ${
                  salary === val
                    ? 'bg-[#031635] text-white font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {(val / 10000).toLocaleString()}만원
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Recommendation & Sliders */}
      <section className="space-y-3">
        <div className="flex justify-between items-end px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#031635]">
              MoneyMind 추천 포트폴리오
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              각 항목의 슬라이더를 조절하여 나만의 목표 %를 설정하세요
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-[#75777F] uppercase tracking-wider block">총합계</span>
            <div
              className={`font-mono text-lg font-extrabold ${
                totalPercent === 100
                  ? 'text-[#10B981]'
                  : totalPercent > 100
                  ? 'text-red-500'
                  : 'text-amber-500'
              }`}
            >
              {totalPercent}%
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 shrink-0 text-[11px]">추천 템플릿:</span>
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 text-gray-700 font-medium whitespace-nowrap cursor-pointer transition-all"
          >
            기본 추천 (50/30/15/5)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('503020')}
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 text-gray-700 font-medium whitespace-nowrap cursor-pointer transition-all"
          >
            50:30:20 황금룰
          </button>
          <button
            type="button"
            onClick={() => applyPreset('growth')}
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 text-gray-700 font-medium whitespace-nowrap cursor-pointer transition-all"
          >
            적극 투자형
          </button>
          <button
            type="button"
            onClick={() => applyPreset('frugal')}
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 text-gray-700 font-medium whitespace-nowrap cursor-pointer transition-all"
          >
            알뜰 저축형
          </button>
        </div>

        {totalPercent !== 100 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
            <span>
              {totalPercent < 100
                ? `${100 - totalPercent}%가 아직 미배분되었습니다.`
                : `합계가 100%를 ${totalPercent - 100}% 초과했습니다.`}
            </span>
            <button
              onClick={autoBalance}
              className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              100% 자동조정
            </button>
          </div>
        )}

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-5 shadow-ambient border border-gray-100/80 flex flex-col justify-between relative group hover:border-gray-300 transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryBg(cat.id)}`}>
                    {getCategoryIcon(cat.id)}
                  </div>
                  <div>
                    <span className="font-bold text-[#031635] text-base">{cat.name}</span>
                    <span className="text-[11px] text-gray-400 block -mt-0.5">{cat.description.split(',')[0]}</span>
                  </div>
                </div>
                <span className="font-mono text-xl font-extrabold text-[#031635]">
                  {cat.percent}%
                </span>
              </div>

              <div className="mt-auto pt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={cat.percent}
                  onChange={(e) => handleSliderChange(cat.id, parseInt(e.target.value, 10) || 0)}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-[#75777F] font-mono">
                  <span>0%</span>
                  <span className="font-semibold text-[#191C1E]">
                    {cat.amount.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-lg py-4 rounded-full shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>포트폴리오 확정하기</span>
          <CheckCircle className="w-5 h-5" />
        </button>

        {showSavedToast && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-800 text-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>포트폴리오가 성공적으로 확정되었습니다!</span>
            </div>
            <button
              onClick={onNavigateToSpending}
              className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
            >
              지출 분석 보기 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
