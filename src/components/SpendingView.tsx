import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Upload, 
  Utensils, 
  ShoppingBag, 
  Train, 
  Coffee, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  Plus,
  ReceiptText,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { PortfolioConfig, Transaction, SpendingAdvice } from '../types';
import { analyzeSpendingAgainstPortfolio } from '../utils/aiAdvisor';

interface SpendingViewProps {
  portfolio: PortfolioConfig;
  transactions: Transaction[];
  onOpenUploadModal: () => void;
  onNavigateToMicro: () => void;
  onDeleteTransaction?: (id: string) => void;
}

export const SpendingView: React.FC<SpendingViewProps> = ({
  portfolio,
  transactions,
  onOpenUploadModal,
  onNavigateToMicro,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeAdviceModal, setActiveAdviceModal] = useState(false);

  // Run analytical calculations
  const { categorySpend, totalSpend, categoryPercentages, adviceList, mainAlert } = 
    analyzeSpendingAgainstPortfolio(portfolio, transactions);

  // Category visual metadata
  const categoriesList = [
    { name: '식비', color: '#10B981', percent: categoryPercentages['식비'] || 35, amount: categorySpend['식비'] || 157500 },
    { name: '쇼핑', color: '#F59E0B', percent: categoryPercentages['쇼핑'] || 25, amount: categorySpend['쇼핑'] || 112500 },
    { name: '교통', color: '#3B82F6', percent: categoryPercentages['교통'] || 20, amount: categorySpend['교통'] || 90000 },
    { name: '문화/여가', color: '#8B5CF6', percent: categoryPercentages['문화/여가'] || 15, amount: categorySpend['문화/여가'] || 67500 },
    { name: '기타', color: '#EF4444', percent: categoryPercentages['기타'] || 5, amount: categorySpend['기타'] || 22500 },
  ];

  // Helper for transaction icons
  const getTxIcon = (category: string, merchant: string) => {
    if (merchant.includes('카페') || merchant.includes('스타벅스') || category.includes('카페')) {
      return <Coffee className="w-5 h-5 text-emerald-600" />;
    }
    if (category.includes('식비') || category.includes('외식') || merchant.includes('식당')) {
      return <Utensils className="w-5 h-5 text-emerald-600" />;
    }
    if (category.includes('쇼핑') || merchant.includes('백화점') || merchant.includes('쿠팡') || merchant.includes('다이소')) {
      return <ShoppingBag className="w-5 h-5 text-purple-600" />;
    }
    if (category.includes('교통') || merchant.includes('지하철') || merchant.includes('버스')) {
      return <Train className="w-5 h-5 text-blue-600" />;
    }
    return <ReceiptText className="w-5 h-5 text-gray-500" />;
  };

  const getTxBg = (category: string, merchant: string) => {
    if (merchant.includes('카페') || category.includes('식비')) return 'bg-emerald-50';
    if (category.includes('쇼핑')) return 'bg-purple-50';
    if (category.includes('교통')) return 'bg-blue-50';
    return 'bg-gray-100';
  };

  // Filtered transactions if user clicks a category
  const filteredTransactions = selectedCategory
    ? transactions.filter((t) => t.category.includes(selectedCategory) || (selectedCategory === '기타' && !['식비', '쇼핑', '교통', '문화/여가'].some(c => t.category.includes(c))))
    : transactions;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight mb-1 font-sans">
            소비 지출 분석
          </h1>
          <p className="text-sm text-[#44474E]">
            이번 달의 지출 패턴을 확인하세요.
          </p>
        </div>

        {/* Action shortcut to Micro Spending */}
        <button
          type="button"
          onClick={onNavigateToMicro}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-800 font-semibold text-xs sm:text-sm rounded-full shadow-sm hover:shadow transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>소액 결제 리포트 보기</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      </div>

      {/* Insight Card (Red/Coral banner) */}
      {mainAlert && (
        <div className="bg-[#FFDAD6]/60 border border-[#FFDAD6] rounded-2xl p-4 sm:p-5 shadow-sm flex items-start gap-3.5 sm:gap-4 transition-all">
          <div className="w-10 h-10 rounded-full bg-[#BA1A1A] flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#BA1A1A] text-base mb-1">
                {mainAlert.title}
              </h2>
              <button
                onClick={() => setActiveAdviceModal(true)}
                className="text-xs font-semibold text-red-800 underline hover:text-red-950 cursor-pointer"
              >
                AI 조언 전체보기
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#410002] leading-relaxed">
              {mainAlert.message}
            </p>
          </div>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pie Chart Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#031635] text-lg">카테고리별 지출</h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                전체보기
              </button>
            )}
          </div>

          {/* SVG Donut Chart */}
          <div className="relative w-52 h-52 my-3">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulatedPercent = 0;
                return categoriesList.map((cat, i) => {
                  const strokeDasharray = `${cat.percent} ${100 - cat.percent}`;
                  const strokeDashoffset = -accumulatedPercent;
                  accumulatedPercent += cat.percent;

                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth="14"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                      onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    />
                  );
                });
              })()}
            </svg>

            {/* Inner Total text */}
            <div className="absolute inset-0 m-auto w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner pointer-events-none">
              <span className="text-xs text-[#75777F] font-medium">총 지출</span>
              <span className="font-mono text-xl font-extrabold text-[#031635] mt-0.5">
                ₩{totalSpend.toLocaleString()}
              </span>
              {selectedCategory && (
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  [{selectedCategory}]
                </span>
              )}
            </div>
          </div>

          {/* Category Legend List */}
          <div className="w-full space-y-3 mt-4 pt-4 border-t border-gray-100">
            {categoriesList.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className={`flex justify-between items-center p-2 rounded-xl cursor-pointer transition-colors ${
                  selectedCategory === cat.name ? 'bg-emerald-50/70 ring-1 ring-emerald-300' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-semibold text-[#191C1E]">{cat.name}</span>
                  <span className="text-xs text-[#75777F] font-mono">{cat.percent}%</span>
                </div>
                <span className="font-mono text-sm font-bold text-[#191C1E]">
                  ₩{cat.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction List Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-[#031635] text-lg">최근 거래 내역</h3>
              <p className="text-xs text-gray-400">변동비 지출 목록 ({filteredTransactions.length}건)</p>
            </div>
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 bg-[#031635] hover:bg-[#1A2B4B] text-white text-xs font-bold px-3.5 py-2 rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[380px] pr-1">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center pb-3 border-b border-[#E1E2E4]/80 last:border-0 hover:bg-gray-50/60 p-1.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTxBg(tx.category, tx.merchant)}`}>
                    {getTxIcon(tx.category, tx.merchant)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191C1E] leading-snug">
                      {tx.merchant}
                    </p>
                    <p className="text-xs text-[#75777F] mt-0.5">
                      {tx.category} • {tx.date} {tx.time || ''}
                    </p>
                    {tx.memo && (
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 italic">
                        "{tx.memo}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-[#191C1E] block">
                    -₩{tx.amount.toLocaleString()}
                  </span>
                  {tx.isMicroSpending && (
                    <span className="inline-block text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.2 rounded mt-0.5">
                      소액
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Quick Add Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={onOpenUploadModal}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              내역 직접 추가하기
            </button>
            <span className="text-[11px] text-gray-400 font-mono">
              월급 배분 예산과 실시간 연동
            </span>
          </div>
        </div>
      </div>

      {/* AI Advice Modal */}
      {activeAdviceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-[#031635]">AI 소비 & 포트폴리오 진단</h3>
              </div>
              <button
                onClick={() => setActiveAdviceModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {adviceList.map((adv) => (
                <div
                  key={adv.id}
                  className={`p-3.5 rounded-2xl border ${
                    adv.type === 'danger'
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : adv.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <h4 className="font-bold text-xs sm:text-sm mb-1">{adv.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{adv.message}</p>
                </div>
              ))}

              <div className="p-3.5 bg-[#f8f9fb] rounded-2xl border border-gray-200 text-xs text-gray-700 space-y-1.5">
                <p className="font-bold text-[#031635]">💡 머니마인드 제안</p>
                <p>• 월급 ₩{portfolio.salary.toLocaleString()} 중 생활비 목표 ₩{((portfolio.salary * (portfolio.categories.find(c => c.id === 'living')?.percent || 50)) / 100).toLocaleString()} 대비 현재 변동비 총 지출은 ₩{totalSpend.toLocaleString()}입니다.</p>
                <p>• 다이소, 쿠팡, 카페 등 잦은 소액 결제(건당 2만원 이하)를 묶어서 관리하면 월 최대 10~15만원의 잉여 자금을 추가 저축/투자할 수 있습니다.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveAdviceModal(false)}
              className="w-full bg-[#031635] text-white font-bold py-3 rounded-xl hover:bg-[#1A2B4B] transition-colors cursor-pointer"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
