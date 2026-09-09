import React from 'react';
import { Home, Wallet, Sparkles, Settings, PieChart, Repeat2 } from 'lucide-react';
import { NavTab } from '../types';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet className="w-5 h-5" /> },
    { id: 'spending', label: 'Spending', icon: <PieChart className="w-5 h-5" /> },
    { id: 'fixed', label: 'Fixed', icon: <Repeat2 className="w-5 h-5" /> },
    { id: 'micro', label: 'Pattern', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-3 bg-white/95 backdrop-blur-md border-t border-[#e1e2e4] shadow-lg rounded-t-2xl z-40 md:hidden">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-[#6cf8bb]/30 text-[#006c49] font-bold scale-105'
                : 'text-[#75777f] hover:text-[#191c1e] hover:bg-gray-50 font-medium'
            }`}
          >
            <div className={`${isActive ? 'text-[#006c49]' : 'text-[#75777f]'}`}>
              {item.icon}
            </div>
            <span className="text-[11px] font-bold tracking-tight mt-0.5">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export const DesktopSidebar: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'home', label: '홈 대시보드', icon: <Home className="w-5 h-5" />, desc: '자산 및 소비 요약' },
    { id: 'portfolio', label: '포트폴리오 구성', icon: <Wallet className="w-5 h-5" />, desc: '월급 배분 및 목표 %' },
    { id: 'spending', label: '소비 지출 분석', icon: <PieChart className="w-5 h-5" />, desc: '카테고리별 파이차트' },
    { id: 'fixed', label: '고정비 지출', icon: <Repeat2 className="w-5 h-5" />, desc: '월별 반복 지출 분석' },
    { id: 'micro', label: '소액 결제 리포트', icon: <Sparkles className="w-5 h-5" />, desc: '쿠팡/다이소 패턴 & 한도' },
    { id: 'settings', label: '설정 및 API', icon: <Settings className="w-5 h-5" />, desc: 'Gemini 키 및 데이터 관리' },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-[#e1e2e4] pt-20 px-4 z-30">
      <div className="mb-6 px-3">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
          메뉴 네비게이션
        </span>
      </div>

      <nav className="space-y-1.5 w-full">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#6cf8bb]/30 text-[#006c49] font-bold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
            >
              <div className={`${isActive ? 'text-[#006c49]' : 'text-gray-500'}`}>
                {item.icon}
              </div>
              <div>
                <span className="text-sm block">{item.label}</span>
                <span className="text-[10px] text-gray-400 font-normal block">{item.desc}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto mb-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 text-xs text-emerald-900">
        <p className="font-bold flex items-center gap-1.5 text-emerald-800">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          MoneyMind AI 가이드
        </p>
        <p className="text-[11px] text-emerald-700 mt-1">
          변동비 등록 시 소액 결제 패턴이 실시간으로 분류됩니다.
        </p>
      </div>
    </aside>
  );
};
