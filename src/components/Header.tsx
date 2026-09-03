import React, { useState } from 'react';
import { Bell, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isApiConnected: boolean;
  onOpenApiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onTabChange,
  isApiConnected,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: '1',
      title: '소액 결제 급증 주의',
      desc: '지난달 대비 소액 결제가 15% 증가했습니다.',
      time: '10분 전',
      unread: true,
    },
    {
      id: '2',
      title: '식비 예산 소진율 85%',
      desc: '월말까지 식비 소비를 절약해보세요.',
      time: '1시간 전',
      unread: true,
    },
    {
      id: '3',
      title: '포트폴리오 배분 성공',
      desc: '월급 300만원 기준 최적 분배가 저장되었습니다.',
      time: '어제',
      unread: false,
    },
  ];

  return (
    <header className="w-full top-0 sticky z-40 bg-[#f8f9fb]/95 backdrop-blur-md border-b border-[#e1e2e4]/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        {/* Left: User Avatar & App Name */}
        <div 
          onClick={() => onTabChange('portfolio')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-[#e1e2e4] overflow-hidden ring-2 ring-emerald-500/30 ring-offset-1 shrink-0">
            <span className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-extrabold">
              M
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-[#031635] tracking-tight font-sans">
                MoneyMind
              </span>
              {isApiConnected && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  연동됨
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[#031635] hover:bg-[#e1e2e4]/70 transition-all duration-150 active:scale-95 relative cursor-pointer"
              aria-label="알림"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
                  <span className="text-sm font-bold text-[#031635]">새 알림</span>
                  <span className="text-xs text-emerald-600 font-medium">2개 미확인</span>
                </div>
                <div className="divide-y divide-gray-50 mt-1 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setShowNotifications(false)}
                      className={`p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors ${
                        n.unread ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-bold text-[#191C1E]">{n.title}</p>
                        <span className="text-[10px] text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
