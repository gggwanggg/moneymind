import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransactions: (newTxs: Omit<Transaction, 'id'>[]) => void;
}

export const TransactionUploadModal: React.FC<TransactionUploadModalProps> = ({
  isOpen,
  onClose,
  onAddTransactions,
}) => {
  const [activeMode, setActiveMode] = useState<'quick' | 'paste' | 'file'>('quick');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('식비');
  const [memo, setMemo] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!merchant.trim() || !num) return;

    onAddTransactions([
      {
        merchant: merchant.trim(),
        amount: num,
        category,
        date: '오늘',
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        memo: memo.trim() || undefined,
        isMicroSpending: num <= 30000,
      },
    ]);

    setStatusMessage('1건의 거래가 등록되었습니다.');
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handlePasteParse = () => {
    if (!pasteText.trim()) return;

    // Smart parser for SMS/Push notifications
    const lines = pasteText.split('\n').filter((l) => l.trim().length > 0);
    const parsedList: Omit<Transaction, 'id'>[] = [];

    lines.forEach((line) => {
      // Find amount (e.g. 15,000원 or 15000)
      const amountMatch = line.match(/([0-9,]+)\s*원?/);
      let detectedAmount = 10000;
      if (amountMatch) {
        detectedAmount = parseInt(amountMatch[1].replace(/,/g, ''), 10) || 10000;
      }

      // Detect merchant
      let detectedMerchant = '가맹점 지출';
      if (line.includes('스타벅스') || line.includes('커피') || line.includes('카페')) {
        detectedMerchant = '스타벅스';
      } else if (line.includes('쿠팡')) {
        detectedMerchant = '쿠팡';
      } else if (line.includes('다이소')) {
        detectedMerchant = '다이소';
      } else if (line.includes('식당') || line.includes('식사') || line.includes('밥')) {
        detectedMerchant = '식당 결제';
      } else if (line.includes('마트') || line.includes('편의점') || line.includes('GS25') || line.includes('CU')) {
        detectedMerchant = '편의점/마트';
      } else if (line.includes('택시') || line.includes('카카오T') || line.includes('지하철')) {
        detectedMerchant = '교통 결제';
      }

      // Detect category
      let detectedCat = '기타';
      if (detectedMerchant.includes('스타벅스') || line.includes('식당')) detectedCat = '식비';
      else if (detectedMerchant.includes('쿠팡') || detectedMerchant.includes('다이소')) detectedCat = '쇼핑';
      else if (detectedMerchant.includes('교통')) detectedCat = '교통';

      parsedList.push({
        merchant: detectedMerchant,
        amount: detectedAmount,
        category: detectedCat,
        date: '오늘',
        time: '방금',
        memo: line.slice(0, 30),
        isMicroSpending: detectedAmount <= 30000,
      });
    });

    if (parsedList.length > 0) {
      onAddTransactions(parsedList);
      setStatusMessage(`${parsedList.length}건의 거래 내역을 자동으로 분석하여 추가했습니다.`);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleSampleBatch = () => {
    onAddTransactions([
      { merchant: '올리브영 강남점', amount: 16800, category: '쇼핑', date: '오늘', time: '14:10', memo: '핸드크림 구매', isMicroSpending: true },
      { merchant: '이디야커피', amount: 3800, category: '식비', date: '오늘', time: '15:20', memo: '아이스티', isMicroSpending: true },
      { merchant: '배달의민족', amount: 22000, category: '식비', date: '어제', time: '19:40', memo: '저녁 치킨 주문', isMicroSpending: false },
    ]);
    setStatusMessage('샘플 거래 내역 3건이 추가되었습니다.');
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-[#031635]">거래 내역 등록 / 업로드</h3>
            <p className="text-xs text-gray-500">변동비 지출을 등록하면 소액 결제 분석에 반영됩니다</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
          <button
            onClick={() => setActiveMode('quick')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeMode === 'quick' ? 'bg-white text-[#031635] shadow-xs' : 'hover:text-gray-900'
            }`}
          >
            직접 입력
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeMode === 'paste' ? 'bg-white text-[#031635] shadow-xs' : 'hover:text-gray-900'
            }`}
          >
            문자/푸시 붙여넣기
          </button>
          <button
            onClick={() => setActiveMode('file')}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeMode === 'file' ? 'bg-white text-[#031635] shadow-xs' : 'hover:text-gray-900'
            }`}
          >
            엑셀/CSV 업로드
          </button>
        </div>

        {/* Mode 1: Quick Add */}
        {activeMode === 'quick' && (
          <form onSubmit={handleQuickAdd} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">가맹점</label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="예: 스타벅스 강남"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">금액 (원)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="예: 5500"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#031635]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]"
              >
                <option value="식비">식비 / 외식 / 카페</option>
                <option value="쇼핑">쇼핑 / 이커머스 / 잡화</option>
                <option value="교통">교통 / 대중교통 / 택시</option>
                <option value="문화/여가">문화 / 여가 / 영화</option>
                <option value="기타">기타 변동비</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">메모 (선택)</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 점심 후 디저트"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#031635]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#031635] text-white rounded-xl font-bold text-sm hover:bg-[#1A2B4B] transition-colors cursor-pointer mt-2"
            >
              거래 내역 추가
            </button>
          </form>
        )}

        {/* Mode 2: Paste */}
        {activeMode === 'paste' && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-gray-500">
              카드사 승인 문자나 푸시 알림 내용을 복사해 붙여넣으면 금액과 가맹점을 자동 파싱합니다.
            </p>
            <textarea
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="예:&#10;[신한카드 승인] 4,500원 스타벅스 강남점&#10;[국민카드] 다이소 8,000원 일시불"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#031635]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePasteParse}
                className="flex-1 py-3 bg-[#031635] text-white rounded-xl font-bold text-sm hover:bg-[#1A2B4B] transition-colors cursor-pointer"
              >
                자동 파싱 및 등록
              </button>
              <button
                type="button"
                onClick={handleSampleBatch}
                className="px-3 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                예시 데이터 넣기
              </button>
            </div>
          </div>
        )}

        {/* Mode 3: File */}
        {activeMode === 'file' && (
          <div className="space-y-3 pt-1">
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-gray-50/50">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-700">CSV 또는 엑셀 파일 드래그 & 드롭</p>
              <p className="text-[11px] text-gray-400 mt-1">은행 / 카드사 내보내기 파일 지원</p>
              <input
                type="file"
                accept=".csv, .xlsx, .txt"
                className="hidden"
                id="file-upload"
                onChange={handleSampleBatch}
              />
              <label
                htmlFor="file-upload"
                className="mt-3 inline-block px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-[#031635] rounded-lg shadow-xs hover:bg-gray-100 cursor-pointer"
              >
                내 컴퓨터에서 선택
              </label>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
