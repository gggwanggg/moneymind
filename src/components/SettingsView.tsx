import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  RotateCcw, 
  Lock, 
  Check, 
  Download, 
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { ApiKeyConfig } from '../types';

interface SettingsViewProps {
  apiKeyConfig: ApiKeyConfig;
  onUpdateApiKey: (config: ApiKeyConfig) => void;
  onResetData: () => void;
  onDisconnect: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiKeyConfig,
  onUpdateApiKey,
  onResetData,
  onDisconnect,
}) => {
  const [apiKey, setApiKey] = useState(apiKeyConfig.apiKey);
  const [secretKey, setSecretKey] = useState(apiKeyConfig.secretKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateApiKey({
      ...apiKeyConfig,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExecuteReset = () => {
    onResetData();
    setResetConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight mb-1 font-sans">
          설정 및 API 관리
        </h1>
        <p className="text-sm text-[#44474E]">
          은행 연동 API 키 관리 및 데이터 설정
        </p>
      </div>

      {/* API Key Management Card */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#031635] text-base">API 연동 정보</h3>
              <p className="text-xs text-emerald-600 font-semibold">
                ● 정상 연동 중 ({apiKeyConfig.bankName || '마이데이터'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisconnect}
            className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
          >
            연동 해제
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">API KEY</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#031635] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">SECRET KEY</label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full p-3 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#031635] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#031635] hover:bg-[#1A2B4B] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            API 키 변경사항 저장
          </button>

          {saveSuccess && (
            <p className="text-center text-xs text-emerald-600 font-semibold animate-in fade-in">
              ✓ API 키 정보가 성공적으로 업데이트되었습니다.
            </p>
          )}
        </form>
      </section>

      {/* Data Management Card */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 space-y-4">
        <h3 className="font-bold text-[#031635] text-base">데이터 초기화</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          초기 목업 시연 데이터(월급 300만원, 쿠팡/다이소 소액 결제 패턴)로 데이터를 재설정할 수 있습니다.
        </p>

        {resetConfirm ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-red-700">모든 설정을 초기 상태로 되돌리시겠습니까?</p>
            <div className="flex gap-2">
              <button
                onClick={handleExecuteReset}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                네, 초기화합니다
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>샘플 데이터로 초기화</span>
          </button>
        )}
      </section>

      {/* Security Note */}
      <div className="text-center flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="w-3.5 h-3.5" />
        <span>MoneyMind 엔터프라이즈 레벨 AES-256 비트 보안 암호화 적용</span>
      </div>
    </div>
  );
};
