import React from 'react';
import { 
  PieChart as PieIcon, 
  Wallet, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard,
  Flame
} from 'lucide-react';
import { PortfolioConfig, Transaction, MicroSpendingLimit, NavTab } from '../types';

interface HomeViewProps {
  portfolio: PortfolioConfig;
  transactions: Transaction[];
  microLimit: MicroSpendingLimit;
  onNavigate: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  portfolio,
  transactions,
  microLimit,
  onNavigate,
}) => {
  const totalSpend = transactions.reduce((acc, t) => acc + t.amount, 0);
  const livingCategory = portfolio.categories.find((c) => c.id === 'living');
  const livingBudget = livingCategory ? (portfolio.salary * livingCategory.percent) / 100 : 1500000;
  const usedRatio = Math.round((microLimit.currentUsed / (microLimit.monthlyLimit || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-[#031635] via-[#1A2B4B] to-[#0A2240] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-300 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MoneyMind 스마트 자산 관리</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              이번 달 현명한 소비와<br />완벽한 포트폴리오를 만들어보세요
            </h1>
            <p className="text-sm text-gray-300">
              월급 <span className="text-emerald-400 font-mono font-bold">₩{portfolio.salary.toLocaleString()}</span> 기준으로 최적의 자산 배분과 소액 결제 누수를 방지합니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={() => onNavigate('portfolio')}
              className="px-5 py-3 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>포트폴리오 설정</span>
            </button>
            <button
              onClick={() => onNavigate('spending')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PieIcon className="w-4 h-4" />
              <span>소비 지출 분석</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Portfolio Snapshot */}
        <div
          onClick={() => onNavigate('portfolio')}
          className="bg-white rounded-3xl p-5 shadow-ambient border border-gray-100/90 hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                나만의 포트폴리오
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-[#031635] font-mono">
              ₩{portfolio.salary.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              생활비 {(portfolio.categories.find(c => c.id === 'living')?.percent ?? 50).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}% • 저축 {(portfolio.categories.find(c => c.id === 'saving')?.percent ?? 30).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}% • 투자 {(portfolio.categories.find(c => c.id === 'investment')?.percent ?? 15).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform">
            <span>비율 조정하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Spending Alert */}
        <div
          onClick={() => onNavigate('spending')}
          className="bg-white rounded-3xl p-5 shadow-ambient border border-gray-100/90 hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                이번 달 지출 현황
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <PieIcon className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-[#031635] font-mono">
              ₩{totalSpend.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                식비 85% 경고
              </span>
              <span className="text-xs text-gray-500">예산 대비 안정적 추이</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">
            <span>지출 내역 & 파이차트</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Micro-spending Leak */}
        <div
          onClick={() => onNavigate('micro')}
          className="bg-white rounded-3xl p-5 shadow-ambient border border-gray-100/90 hover:border-red-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                소액 결제 누수 경고
              </span>
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-[#031635] font-mono">
              {(microLimit.currentUsed / 10000).toLocaleString()}만원 누수
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              쿠팡 12회, 다이소 8회, 스타벅스 6회 빈번 결제
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-red-700 font-bold group-hover:translate-x-0.5 transition-transform">
            <span>소액 결제 리포트 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-ambient border border-gray-100/90 space-y-4">
        <h3 className="font-bold text-[#031635] text-lg">주요 분석 리포트 바로가기</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => onNavigate('spending')}
            className="p-4 rounded-2xl bg-[#F8F9FB] hover:bg-[#EDE9FE]/50 border border-gray-100 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#031635] text-sm">카테고리별 지출 파이차트</h4>
              <p className="text-xs text-gray-500">식비, 쇼핑, 교통 등 비중 시각화</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('micro')}
            className="p-4 rounded-2xl bg-[#F8F9FB] hover:bg-[#D1FAE5]/50 border border-gray-100 transition-all cursor-pointer flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#031635] text-sm">소액 결제 패턴 & 월간 한도</h4>
              <p className="text-xs text-gray-500">다이소/쿠팡 등 빈번 결제 그룹화 리포트</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
