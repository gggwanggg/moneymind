import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { PortfolioView } from './components/PortfolioView';
import { SpendingView } from './components/SpendingView';
import { MicroSpendingView } from './components/MicroSpendingView';
import { FixedExpenseView } from './features/fixed-expenses/FixedExpenseView';
import { SettingsView } from './components/SettingsView';
import { BottomNavigation, DesktopSidebar } from './components/Navigation';
import { TransactionUploadModal } from './components/TransactionUploadModal';
import { 
  PortfolioConfig, 
  Transaction, 
  MicroSpendingLimit, 
  MerchantPattern, 
  NavTab 
} from './types';
import { 
  INITIAL_PORTFOLIO, 
  INITIAL_TRANSACTIONS, 
  INITIAL_MICRO_LIMIT, 
  INITIAL_MERCHANT_PATTERNS 
} from './utils/initialData';

const STORAGE_KEYS = {
  PORTFOLIO: 'moneymind_portfolio_v1',
  TRANSACTIONS: 'moneymind_transactions_v1',
  MICRO_LIMIT: 'moneymind_micro_limit_v1',
  MERCHANT_PATTERNS: 'moneymind_merchant_patterns_v1',
};

export default function App() {
  // Gemini credentials remain in memory and disappear on refresh.
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const [portfolio, setPortfolio] = useState<PortfolioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
    } catch {
      return INITIAL_PORTFOLIO;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [microLimit, setMicroLimit] = useState<MicroSpendingLimit>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MICRO_LIMIT);
      return saved ? JSON.parse(saved) : INITIAL_MICRO_LIMIT;
    } catch {
      return INITIAL_MICRO_LIMIT;
    }
  });

  const [merchantPatterns, setMerchantPatterns] = useState<MerchantPattern[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_PATTERNS);
      return saved ? JSON.parse(saved) : INITIAL_MERCHANT_PATTERNS;
    } catch {
      return INITIAL_MERCHANT_PATTERNS;
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('portfolio');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Remove credentials saved by earlier versions of the app.
  useEffect(() => {
    localStorage.removeItem('moneymind_api_config_v1');
  }, []);

  // Sync to local storage on state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MICRO_LIMIT, JSON.stringify(microLimit));
  }, [microLimit]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MERCHANT_PATTERNS, JSON.stringify(merchantPatterns));
  }, [merchantPatterns]);

  // Handlers
  const handleSavePortfolio = (newPortfolio: PortfolioConfig) => {
    setPortfolio(newPortfolio);
  };

  const handleSaveMicroLimit = (newLimit: number) => {
    setMicroLimit((prev) => ({
      ...prev,
      monthlyLimit: newLimit,
    }));
  };

  const handleAddTransactions = (newTxs: Omit<Transaction, 'id'>[]) => {
    const created: Transaction[] = newTxs.map((t, idx) => ({
      ...t,
      id: `tx-custom-${Date.now()}-${idx}`,
    }));

    setTransactions((prev) => [...created, ...prev]);

    // Recalculate micro spending amount and patterns
    let addedMicro = 0;
    created.forEach((t) => {
      if (t.isMicroSpending) {
        addedMicro += t.amount;
        
        // Update patterns if merchant matches
        setMerchantPatterns((prevPatterns) => {
          const matchIdx = prevPatterns.findIndex((p) => t.merchant.includes(p.merchant) || p.merchant.includes(t.merchant));
          if (matchIdx >= 0) {
            const updated = [...prevPatterns];
            updated[matchIdx] = {
              ...updated[matchIdx],
              count: updated[matchIdx].count + 1,
              totalAmount: updated[matchIdx].totalAmount + t.amount,
              tag: `${updated[matchIdx].count + 1}회 결제`,
            };
            return updated;
          } else {
            return [
              {
                id: `pattern-${Date.now()}`,
                merchant: t.merchant,
                count: 1,
                totalAmount: t.amount,
                category: t.category,
                iconName: 'shopping_bag',
                badgeBg: 'bg-indigo-100',
                badgeColor: 'text-indigo-700',
                tag: '1회 결제',
              },
              ...prevPatterns,
            ];
          }
        });
      }
    });

    if (addedMicro > 0) {
      setMicroLimit((prev) => ({
        ...prev,
        currentUsed: prev.currentUsed + addedMicro,
      }));
    }
  };

  const handleResetData = () => {
    setPortfolio(INITIAL_PORTFOLIO);
    setTransactions(INITIAL_TRANSACTIONS);
    setMicroLimit(INITIAL_MICRO_LIMIT);
    setMerchantPatterns(INITIAL_MERCHANT_PATTERNS);
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.MICRO_LIMIT);
    localStorage.removeItem(STORAGE_KEYS.MERCHANT_PATTERNS);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#191C1E] flex flex-col antialiased selection:bg-[#10B981] selection:text-white">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isApiConnected={Boolean(geminiApiKey)}
      />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar (visible on md screens and up) */}
        <DesktopSidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 w-full transition-all">
          {currentTab === 'home' && (
            <HomeView
              portfolio={portfolio}
              transactions={transactions}
              microLimit={microLimit}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'portfolio' && (
            <PortfolioView
              portfolio={portfolio}
              onSavePortfolio={handleSavePortfolio}
              onNavigateToSpending={() => setCurrentTab('spending')}
            />
          )}

          {currentTab === 'spending' && (
            <SpendingView
              portfolio={portfolio}
              transactions={transactions}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onNavigateToMicro={() => setCurrentTab('micro')}
            />
          )}

          {currentTab === 'micro' && (
            <MicroSpendingView
              microLimit={microLimit}
              patterns={merchantPatterns}
              onSaveLimit={handleSaveMicroLimit}
              onAddTransaction={(tx) => handleAddTransactions([tx])}
            />
          )}

          {currentTab === 'fixed' && <FixedExpenseView />}

          {currentTab === 'settings' && (
            <SettingsView
              geminiApiKey={geminiApiKey}
              onUpdateGeminiApiKey={setGeminiApiKey}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Transaction Upload & Manual Entry Modal */}
      <TransactionUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddTransactions={handleAddTransactions}
      />
    </div>
  );
}
