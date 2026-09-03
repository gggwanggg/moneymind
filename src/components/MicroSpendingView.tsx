import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShoppingBag, 
  Store, 
  Coffee, 
  Train, 
  Save, 
  Sliders, 
  Check, 
  Sparkles,
  ChevronDown,
  Info,
  TrendingUp,
  Plus
} from 'lucide-react';
import { MicroSpendingLimit, MerchantPattern, Transaction } from '../types';

interface MicroSpendingViewProps {
  microLimit: MicroSpendingLimit;
  patterns: MerchantPattern[];
  onSaveLimit: (newLimit: number) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const MicroSpendingView: React.FC<MicroSpendingViewProps> = ({
  microLimit,
  patterns,
  onSaveLimit,
  onAddTransaction,
}) => {
  const [newLimit, setNewLimit] = useState<number>(microLimit.monthlyLimit);
  const [selectedCategory, setSelectedCategory] = useState('쇼핑/이커머스');
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [limitSavedMsg, setLimitSavedMsg] = useState(false);

  // Compute usage ratio
  const usedRatio = Math.round((microLimit.currentUsed / (newLimit || 1)) * 100);

  const handleLimitSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setNewLimit(val);
  };

  const handleSaveLimit = () => {
    onSaveLimit(newLimit);
    setLimitSavedMsg(true);
    setTimeout(() => setLimitSavedMsg(false), 2500);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!merchantName.trim() || !numAmount) return;

    onAddTransaction({
      merchant: merchantName.trim(),
      category: selectedCategory.split('/')[0] || '기타',
      amount: numAmount,
      date: '오늘',
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      memo: memo.trim() || undefined,
      isMicroSpending: numAmount <= 30000,
    });

    setMerchantName('');
    setAmount('');
    setMemo('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const getMerchantIcon = (icon: string) => {
    switch (icon) {
      case 'shopping_bag':
        return <ShoppingBag className="w-5 h-5 text-[#6D28D9]" />;
      case 'store':
        return <Store className="w-5 h-5 text-[#4338CA]" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-[#047857]" />;
      default:
        return <Train className="w-5 h-5 text-[#334155]" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight mb-1 font-sans">
          소액 결제 분석 리포트
        </h1>
        <p className="text-sm text-[#44474E] leading-relaxed">
          무의식중에 새어 나가는 소액 결제가 이번 달 총 <span className="font-bold text-[#031635]">{(microLimit.currentUsed / 10000).toLocaleString()}만원</span>입니다.
        </p>
      </div>

      {/* Warning Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-ambient border border-gray-100/90 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#FFDAD6] flex items-center justify-center shrink-0 text-[#BA1A1A]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-[#031635] text-base mb-0.5">주의 필요</h2>
          <p className="text-xs sm:text-sm text-[#44474E]">
            지난달 대비 소액 결제가 <span className="font-bold text-[#BA1A1A]">{microLimit.percentIncrease}% 증가</span>했습니다.
          </p>
        </div>
      </div>

      {/* Major Merchant Patterns */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-[#031635] text-lg">주요 결제처 패턴</h3>
          <span className="text-[11px] font-bold text-[#75777F] tracking-widest uppercase">
            THIS MONTH
          </span>
        </div>

        <div className="space-y-4">
          {patterns.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center pb-3.5 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.badgeBg}`}
                >
                  {getMerchantIcon(item.iconName)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#191C1E] text-base">
                      {item.merchant}
                    </span>
                  </div>
                  <span className="text-xs text-[#75777F]">
                    {item.tag}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-[#191C1E]">
                  {item.totalAmount.toLocaleString()} 원
                </span>
                <span className="text-[10px] text-gray-400 block font-sans">
                  {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Monthly Micro-spending Budget Limit Setting */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 space-y-4">
        <h3 className="font-bold text-[#031635] text-lg">
          월간 소액 결제 한도 설정하기
        </h3>

        <div className="flex justify-between items-center text-sm font-semibold text-[#191C1E]">
          <span className="text-[#44474E]">현재 한도</span>
          <span className="font-mono text-base font-bold text-[#031635]">
            {newLimit.toLocaleString()} 원
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-[#E1E2E4] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedRatio >= 90 ? 'bg-red-500' : 'bg-[#006C49]'
              }`}
              style={{ width: `${Math.min(usedRatio, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-[#BA1A1A]">
              {microLimit.currentUsed.toLocaleString()} 원 사용
            </span>
            <span className="font-mono text-[#031635]">{usedRatio}%</span>
          </div>
        </div>

        {/* Limit slider */}
        <div className="pt-2">
          <div className="flex justify-between items-center text-xs text-[#75777F] mb-1 font-medium">
            <span>새 한도 금액</span>
            <span className="font-mono font-bold text-emerald-700">
              {newLimit.toLocaleString()} 원
            </span>
          </div>
          <input
            type="range"
            min={50000}
            max={500000}
            step={10000}
            value={newLimit}
            onChange={handleLimitSliderChange}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-xs text-[#75777F] font-mono">
            <span>5만</span>
            <span className="font-bold text-[#031635]">
              {newLimit.toLocaleString()} 원
            </span>
            <span>50만</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveLimit}
          className="w-full mt-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          <span>한도 변경 적용하기</span>
        </button>

        {limitSavedMsg && (
          <p className="text-center text-xs text-emerald-600 font-semibold animate-in fade-in">
            ✓ 월간 소액 결제 한도가 저장되었습니다!
          </p>
        )}
      </section>

      {/* Section: Detailed Record Manual Entry */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90">
        <h3 className="font-bold text-[#031635] text-lg mb-4">상세 기록</h3>
        
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {/* Category dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#44474E]">
              카테고리 분류
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-3 px-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:ring-2 focus:ring-[#031635] appearance-none cursor-pointer"
              >
                <option value="쇼핑/이커머스">쇼핑/이커머스</option>
                <option value="생활잡화">생활잡화 (다이소 등)</option>
                <option value="카페/간식">카페/간식</option>
                <option value="식비/외식">식비/외식</option>
                <option value="교통">교통 (지하철/버스/택시)</option>
                <option value="기타">기타 소액 결제</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Merchant & Amount in grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44474E]">
                가맹점명
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="예: 다이소 강남점"
                required
                className="w-full py-3 px-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44474E]">
                결제 금액 (원)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 4500"
                required
                className="w-full py-3 px-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-sm font-mono text-[#191C1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635]"
              />
            </div>
          </div>

          {/* Memo textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#44474E]">
              메모 (선택)
            </label>
            <textarea
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 다이소에서 티슈 구매"
              className="w-full p-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635] resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full bg-[#031635] hover:bg-[#1A2B4B] text-white font-bold text-base py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Save className="w-4 h-4" />
            <span>저장하기</span>
          </button>

          {isSaved && (
            <p className="text-center text-xs text-emerald-600 font-semibold animate-in fade-in">
              ✓ 거래 내역이 성공적으로 기록되었습니다!
            </p>
          )}
        </form>
      </section>
    </div>
  );
};
