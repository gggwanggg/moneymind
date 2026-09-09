import React, { useState, useSyncExternalStore } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Lock, 
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';
import { analyzeFixedExpenses } from '../features/fixed-expenses/analyzeFixedExpenses';
import {
  getFixedExpenseCsvSnapshot,
  clearFixedExpenseCsv,
  applyAiReviews,
  setFixedExpenseCsv,
  subscribeToFixedExpenseCsv,
} from '../features/fixed-expenses/fixedExpenseCsvStore';
import { requestGeminiReview, reviewWithAi } from '../features/transaction-classification/aiReview';

interface SettingsViewProps {
  geminiApiKey: string;
  onUpdateGeminiApiKey: (apiKey: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  geminiApiKey,
  onUpdateGeminiApiKey,
  onResetData,
}) => {
  const [apiKey, setApiKey] = useState(geminiApiKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [csvStatus, setCsvStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isReadingCsv, setIsReadingCsv] = useState(false);
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const fixedExpenseCsv = useSyncExternalStore(
    subscribeToFixedExpenseCsv,
    getFixedExpenseCsvSnapshot,
    getFixedExpenseCsvSnapshot,
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGeminiApiKey(apiKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExecuteReset = () => {
    onResetData();
    setResetConfirm(false);
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvStatus({ type: 'error', message: 'CSV 파일만 선택할 수 있습니다.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCsvStatus({ type: 'error', message: '파일 크기는 5MB 이하여야 합니다.' });
      return;
    }

    setIsReadingCsv(true);
    try {
      const buffer = await file.arrayBuffer();
      let text = new TextDecoder('utf-8').decode(buffer);
      let analysis;
      try {
        analysis = analyzeFixedExpenses(text);
      } catch {
        text = new TextDecoder('euc-kr').decode(buffer);
        analysis = analyzeFixedExpenses(text);
      }
      const classification = setFixedExpenseCsv(text, file.name);
      setCsvStatus({
        type: 'success',
        message: `${analysis.analyzedTransactions}건을 읽고 고정비 ${analysis.expenses.length}개를 찾았습니다. AI 검토 대기 ${classification.reviewCount}건`,
      });
    } catch (error) {
      setCsvStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'CSV 파일을 읽지 못했습니다.',
      });
    } finally {
      setIsReadingCsv(false);
    }
  };

  const handleDownloadClassifiedCsv = () => {
    if (!fixedExpenseCsv.classification || !fixedExpenseCsv.fileName) return;
    const blob = new Blob([fixedExpenseCsv.classification.csvText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fixedExpenseCsv.fileName.replace(/\.csv$/iu, '') + '-classified.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleAiReview = async () => {
    const classification = fixedExpenseCsv.classification;
    if (!classification || classification.reviewCount === 0) return;
    if (!geminiApiKey) {
      setCsvStatus({ type: 'error', message: '위에서 Gemini API 키를 먼저 입력하고 적용해주세요.' });
      return;
    }
    setIsAiReviewing(true);
    setCsvStatus(null);
    try {
      const reviews = await reviewWithAi(
        classification.rows,
        (items) => requestGeminiReview(items, geminiApiKey),
      );
      const updated = applyAiReviews(reviews);
      setCsvStatus({
        type: 'success',
        message: `AI가 ${reviews.length}건을 검토했습니다. 남은 검토 항목은 ${updated.reviewCount}건입니다.`,
      });
    } catch (error) {
      setCsvStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'AI 검토 요청에 실패했습니다.',
      });
    } finally {
      setIsAiReviewing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#031635] tracking-tight mb-1 font-sans">
          설정 및 API 관리
        </h1>
        <p className="text-sm text-[#44474E]">
          Gemini AI 검토 설정 및 CSV 데이터 관리
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
              <h3 className="font-bold text-[#031635] text-base">Gemini API 설정</h3>
              <p className={`text-xs font-semibold ${geminiApiKey ? 'text-emerald-600' : 'text-gray-500'}`}>
                {geminiApiKey ? '● AI Studio API 키 입력됨' : 'API 키를 입력하면 AI 검토를 사용할 수 있습니다.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setApiKey('');
              onUpdateGeminiApiKey('');
              setSaveSuccess(false);
            }}
            className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
          >
            키 지우기
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600">GEMINI API KEY</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-[#F8F9FB] border border-[#E1E2E4] rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-[#031635] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#031635] hover:bg-[#1A2B4B] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Gemini API 키 적용
          </button>

          {saveSuccess && (
            <p className="text-center text-xs text-emerald-600 font-semibold animate-in fade-in">
              ✓ 이 브라우저 메모리에 API 키를 적용했습니다.
            </p>
          )}
        </form>
      </section>

      {/* Fixed expense CSV upload */}
      <section className={'bg-white rounded-3xl p-5 sm:p-6 shadow-ambient border border-gray-100/90 space-y-4'}>
        <div className={'flex items-start justify-between gap-4'}>
          <div className={'flex items-center gap-2.5'}>
            <div className={'w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0'}>
              <FileSpreadsheet className={'w-5 h-5'} />
            </div>
            <div>
              <h3 className={'font-bold text-[#031635] text-base'}>고정비 CSV 불러오기</h3>
              <p className={'text-xs text-gray-500 mt-0.5'}>은행 거래내역을 브라우저에서만 분석합니다.</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${fixedExpenseCsv.source === 'uploaded' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {fixedExpenseCsv.source === 'uploaded' ? '업로드됨' : '파일 없음'}
          </span>
        </div>

        <label className={'block border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl p-5 text-center bg-gray-50/60 hover:bg-emerald-50/40 transition-colors cursor-pointer'}>
          <input type={'file'} accept={'.csv,text/csv'} onChange={handleCsvUpload} className={'hidden'} />
          <Upload className={'w-7 h-7 mx-auto text-emerald-600 mb-2'} />
          <p className={'text-sm font-bold text-[#031635]'}>CSV 파일 선택</p>
          <p className={'text-xs text-gray-500 mt-1'}>UTF-8 또는 EUC-KR · 최대 5MB</p>
        </label>

        <div className={'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#F8F9FB]'}>
          <div className={'min-w-0'}>
            <p className={'text-[10px] text-gray-400 font-bold'}>현재 분석 파일</p>
            <p className={'text-xs font-semibold text-gray-700 truncate mt-0.5'}>{fixedExpenseCsv.fileName ?? '업로드된 파일이 없습니다'}</p>
          </div>
          {fixedExpenseCsv.source === 'uploaded' && (
            <button type={'button'} onClick={() => { clearFixedExpenseCsv(); setCsvStatus(null); }}
              className={'text-xs font-bold text-gray-500 hover:text-[#031635] flex items-center gap-1 cursor-pointer shrink-0'}>
              <RotateCcw className={'w-3.5 h-3.5'} /> 업로드 지우기
            </button>
          )}
        </div>

        {isReadingCsv && <p className={'text-xs text-center text-gray-500'}>CSV 파일을 분석하고 있습니다...</p>}
        {csvStatus && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${csvStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {csvStatus.type === 'success' && <CheckCircle2 className={'w-4 h-4 shrink-0 mt-0.5'} />}
            <span>{csvStatus.message}</span>
          </div>
        )}

        {fixedExpenseCsv.classification && (
          <>
          <div className={'grid grid-cols-3 gap-2'}>
          <div className={'rounded-xl bg-gray-50 px-3 py-2 text-center'}>
            <p className={'text-lg font-extrabold text-[#031635]'}>{fixedExpenseCsv.classification.fixedCount}</p>
            <p className={'text-[10px] text-gray-500'}>고정비 행</p>
          </div>
          <div className={'rounded-xl bg-gray-50 px-3 py-2 text-center'}>
            <p className={'text-lg font-extrabold text-[#031635]'}>{fixedExpenseCsv.classification.microCount}</p>
            <p className={'text-[10px] text-gray-500'}>소액결제 행</p>
          </div>
          <div className={'rounded-xl bg-amber-50 px-3 py-2 text-center'}>
            <p className={'text-lg font-extrabold text-amber-800'}>{fixedExpenseCsv.classification.reviewCount}</p>
            <p className={'text-[10px] text-amber-700'}>AI 검토 대기</p>
          </div>
          </div>

          {fixedExpenseCsv.classification.reviewCount > 0 && (
            <button
              type={'button'}
              onClick={handleAiReview}
              disabled={isAiReviewing || !geminiApiKey}
              className={'w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:cursor-wait flex items-center justify-center gap-2'}
            >
              <Sparkles className={'w-4 h-4'} />
              {isAiReviewing
                ? 'AI가 검토하고 있습니다...'
                : !geminiApiKey
                  ? 'Gemini API 키를 먼저 입력해주세요'
                  : `AI로 검토하기 (${fixedExpenseCsv.classification.reviewCount}건)`}
            </button>
          )}
          <p className="text-[11px] text-gray-400 leading-relaxed">
            키는 localStorage에 저장되지 않으며 새로고침하면 사라집니다. AI 검토 때 로컬 API 서버로만 전달됩니다.
          </p>

          <button
            type={'button'}
            onClick={handleDownloadClassifiedCsv}
            disabled={fixedExpenseCsv.classification.reviewCount > 0 || isAiReviewing}
            className={'w-full py-3 bg-[#031635] hover:bg-[#1A2B4B] disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2'}
          >
            <Download className={'w-4 h-4'} />
            {fixedExpenseCsv.classification.reviewCount > 0
              ? 'AI 검토 완료 후 다운로드할 수 있습니다'
              : '최종 분류 결과 CSV 다운로드'}
          </button>
          </>
        )}

        <p className={'text-[11px] text-gray-400 leading-relaxed'}>
          원본 파일은 수정하지 않습니다. 규칙으로 분류한 별도 파일을 생성하며, 판단이 어려운 항목만 Gemini API의 검토 대상으로 전달합니다.
        </p>
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
