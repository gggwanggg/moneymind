export type NavTab = 'home' | 'portfolio' | 'spending' | 'micro' | 'settings';

export interface ApiKeyConfig {
  apiKey: string;
  secretKey: string;
  isConnected: boolean;
  connectedAt?: string;
  bankName?: string;
}

export interface PortfolioCategory {
  id: string;
  name: string;
  percent: number;
  amount: number;
  color: string;
  bgColor: string;
  iconName: string;
  description: string;
}

export interface PortfolioConfig {
  salary: number;
  categories: PortfolioCategory[];
  totalPercent: number;
  lastUpdated: string;
  isConfirmed: boolean;
  budgetItems?: BudgetItem[];
}

export type BudgetGroup = 'fixed' | 'living' | 'saving' | 'investment' | 'etc';

export interface BudgetItem {
  id: string;
  name: string;
  group: BudgetGroup;
  amount: number;
  color: string;
}

export interface BudgetResult {
  salary: number;
  totalBudget: number;
  remainingAmount: number;
  totalPercent: number | null;
  unallocatedPercent: number | null;
  exceededPercent: number | null;
  isOverBudget: boolean;
  warnings: string[];
  items: (BudgetItem & { percent: number | null; exceedsFortyPercent: boolean })[];
}

export interface Transaction {
  id: string;
  merchant: string;
  category: string; // '외식' | '쇼핑' | '교통' | '문화/여가' | '카페' | '생활잡화' | '기타'
  subCategory?: string;
  amount: number;
  date: string;
  time?: string;
  memo?: string;
  isMicroSpending: boolean; // 소액 결제 여부 (보통 20,000원 이하 또는 빈번 결제처)
  paymentMethod?: string;
}

export interface MerchantPattern {
  id: string;
  merchant: string;
  count: number;
  totalAmount: number;
  category: string;
  iconName: string;
  badgeBg: string;
  badgeColor: string;
  tag: string;
}

export interface MicroSpendingLimit {
  monthlyLimit: number;
  currentUsed: number;
  lastMonthUsed: number;
  percentIncrease: number;
  warningThreshold: number; // e.g. 80%
}

export interface SpendingAdvice {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  category?: string;
  budgetAmount?: number;
  spentAmount?: number;
  ratio?: number;
}
