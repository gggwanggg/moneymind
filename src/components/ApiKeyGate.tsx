import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiKeyConfig } from '../types';

interface ApiKeyGateProps {
  onConnect: (config: ApiKeyConfig) => void;
  initialConfig?: ApiKeyConfig;
}

export const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onConnect, initialConfig }) => {
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [secretKey, setSecretKey] = useState(initialConfig?.secretKey || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API KEY를 입력해주세요.');
      return;
    }
    if (!secretKey.trim()) {
      setError('SECRET KEY를 입력해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onConnect({
        apiKey: apiKey.trim(),
        secretKey: secretKey.trim(),
        isConnected: true,
        connectedAt: new Date().toISOString(),
        bankName: '마이데이터 오픈뱅킹 연동',
      });
    }, 600);
  };

  const handleQuickDemoFill = () => {
    setApiKey('DEMO_API_KEY');
    setSecretKey('DEMO_SECRET_KEY');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#191C1E] flex flex-col items-center justify-center p-4 selection:bg-[#10B981] selection:text-white">
      <main className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#031635] tracking-tight">
            MoneyMind
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-ambient p-6 sm:p-8 border border-gray-100">
          {/* Icon/Indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#E1E2E4] flex items-center justify-center text-[#031635] shadow-sm">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#191C1E] mb-2">
              서비스 시작을 위한 API 연동
            </h2>
            <p className="text-sm text-[#44474E] leading-relaxed">
              MoneyMind의 강력한 분석 기능을 이용하시려면 은행 API 키를 먼저 등록해야 합니다.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44474E] tracking-wider uppercase" htmlFor="apiKey">
                API KEY 입력
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#75777F]">
                  <KeyRound className="w-5 h-5" />
                </span>
                <input
                  id="apiKey"
                  name="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="예: ak_test_1234567890"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl font-mono text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Secret Key Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#44474E] tracking-wider uppercase" htmlFor="secretKey">
                SECRET KEY 입력
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#75777F]">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl font-mono text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#031635] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#031635] hover:bg-[#1A2B4B] text-white font-bold text-base py-4 rounded-xl shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>연동하기</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>테스트를 위한 키가 없으신가요?</span>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="inline-flex items-center gap-1 font-semibold text-[#006C49] hover:underline cursor-pointer bg-[#D1FAE5] px-2.5 py-1 rounded-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              데모 키 자동입력
            </button>
          </div>

          {/* Secure Footer Note */}
          <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-[#75777F]">
            <Lock className="w-4 h-4" />
            <span className="text-xs">현재는 테스트용 키만 입력하세요. 입력값은 새로고침하면 삭제됩니다.</span>
          </div>
        </div>
      </main>
    </div>
  );
};
