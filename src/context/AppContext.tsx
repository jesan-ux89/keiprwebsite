'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { billsAPI, usersAPI, authAPI, rolloverAPI, secondaryIncomeAPI, spendingAPI, bankingAPI, subscriptionsAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import { cacheGet, cacheSet, cacheInvalidateGroups, cacheClear, INITIAL_CACHE_META, type CacheMeta, type InvalidationGroup } from '../lib/localCache';

/**
 * AppContext — PORTED FROM MOBILE APP (src/context/AppContext.tsx)
 * Keep in sync with mobile: mapApiBill, mapIncomeSource, payment logic, etc.
 */

// ── Currency ────────────────────────────────────────────────
export const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
];

type CurrencyInfo = typeof CURRENCIES[0];

// ── Bill type (matches mobile exactly) ──────────────────────
export interface Bill {
  id: string;
  name: string;
  category: string;
  dueDay: number;
  total: number;
  isSplit: boolean;
  isRecurring: boolean;
  isAutoPay: boolean;
  funded: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p1done: boolean;
  p2done: boolean;
  p3done: boolean;
  p4done: boolean;
  splitIds: string[]; // IDs of bill_splits rows for API calls
  status: 'regular' | 'detected' | 'confirmed'; // detected = auto-found, confirmed = user approved
  detectedMerchant?: string;
  detectedAt?: string;
  possibleDuplicateOf?: string;
  possibleDuplicateName?: string;
  paidWith?: string | null; // Credit card name or null for bank account (direct)
  isQuickExpense?: boolean; // True for quick spends logged from Dashboard
  isInternalTransfer?: boolean; // True for savings transfers, internal account moves
  expenseType?: string; // 'fixed' (default) or 'flexible'
  pinnedPaycheck?: number | null; // Manual paycheck assignment override (1 or 2, null = auto)
  endsOn?: string | null; // ISO date string — last month this bill applies (e.g. car loan payoff)
  // Detection explanation metadata — why this bill was auto-detected
  detectionReason?: string | null;
  detectionConfidence?: number | null; // 0.0-1.0, derived from CV (1 - cv)
  detectionOccurrences?: number | null;
  detectionAvgInterval?: number | null;
  detectionCv?: number | null;
  funding?: {
    totalDue: number;
    setAside: number;
    stillNeeded: number;
    percentReady: number;
    stages: Array<{
      sortOrder: number;
      amount: number;
      isSetAside: boolean;
      setAsideAt: string | null;
      aiReasoning: string | null;
      aiConfidence: number | null;
      source: 'system' | 'user' | 'ai_accountant' | 'detection_engine';
    }>;
  } | null;
}

// ── Bill payment type (matches mobile: periodMonth/periodYear) ──
export interface BillPayment {
  id: string;
  billId: string;
  periodMonth: number;
  periodYear: number;
  paycheckNumber?: number | null; // For split bills: which paycheck (1-4). NULL for non-split.
  paidAt: string;
}

// ── Income source type (matches mobile: typicalAmount, isPrimary) ──
export interface IncomeSource {
  id: string;
  name: string;
  frequency: string;
  typicalAmount: number;
  nextPayDate?: string;
  isPrimary?: boolean;
  isOneTime?: boolean;
}

// ── Category type ──────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// ── Secondary Income Allocation types ──────────────────────
export interface SecondaryAllocation {
  id: string;
  incomeSourceId: string;
  periodMonth: number;
  periodYear: number;
  paycheckNumber: number;
  action: 'savings' | 'bill';
  amount: number;
  billId?: string;
  billName?: string;
  sourceName?: string;
  note?: string;
}

export interface SideIncomeSummary {
  incomeSourceId: string;
  name: string;
  amount: number;
  frequency: string;
  totalAllocated: number;
  totalToSavings: number;
  totalToBills: number;
  remaining: number;
  byPaycheck: Record<number, { allocated: number; toSavings: number; toBills: number }>;
}

// ── Monthly Rollover type ──────────────────────────────────
export interface MonthlyRollover {
  id: string;
  periodMonth: number;
  periodYear: number;
  previousLeftover: number;
  action: 'rolled_over' | 'fresh_start' | 'pending';
  rolloverAmount: number;
  decidedAt?: string;
}

// ── Context type ────────────────────────────────────────────
interface AppContextType {
  // Bills
  bills: Bill[];
  billsLoading: boolean;
  refreshBills: () => Promise<void>;
  addBill: (data: Record<string, unknown>) => Promise<Bill>;
  updateBill: (id: string, data: Record<string, unknown>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  getBill: (id: string) => Bill | undefined;

  // Bill payments (tracker) — matches mobile API
  billPayments: BillPayment[];
  paymentsLoading: boolean;
  markBillPaid: (billId: string, periodMonth?: number, periodYear?: number, paycheckNumber?: number) => Promise<void>;
  unmarkBillPaid: (billId: string, periodMonth?: number, periodYear?: number, paycheckNumber?: number) => Promise<void>;
  isBillPaid: (billId: string, periodMonth?: number, periodYear?: number) => boolean;
  toggleSplitPaid: (billId: string, paycheckNum: number, periodMonth?: number, periodYear?: number) => Promise<void>;
  isSplitPaid: (billId: string, paycheckNum: number, periodMonth?: number, periodYear?: number) => boolean;
  refreshPayments: () => Promise<void>;

  // Income sources
  incomeSources: IncomeSource[];
  incomeLoading: boolean;
  incomeFetchSucceeded: boolean;
  refreshIncomeSources: () => Promise<void>;
  addIncomeSource: (data: Record<string, unknown>) => Promise<IncomeSource>;
  updateIncomeSource: (id: string, data: Record<string, unknown>) => Promise<IncomeSource>;
  deleteIncomeSource: (id: string) => Promise<void>;
  setPrimaryIncomeSource: (id: string) => Promise<void>;

  // Categories
  categories: Category[];
  categoriesLoading: boolean;
  refreshCategories: () => Promise<void>;

  // Currency
  currency: CurrencyInfo;
  setCurrencyCode: (code: string) => void;
  fmt: (amount: number) => string;

  // Detected transactions
  detectedBills: Bill[];
  detectedCount: number;
  pendingConfirmationsCount: number;
  refreshPendingConfirmations: () => Promise<void>;
  confirmDetectedBill: (billId: string, overrides?: Record<string, unknown>) => Promise<void>;
  confirmAsOneTime: (billId: string) => Promise<void>;
  dismissDetectedBill: (billId: string) => Promise<void>;
  linkDuplicateBill: (billId: string, targetBillId: string) => Promise<void>;

  // Subscription
  tier: 'free' | 'pro' | 'ultra';
  isPro: boolean;
  isUltra: boolean;
  canSplit: (billId?: string) => boolean;
  maxForwardMonths: number;
  refreshSubscription: () => Promise<void>;

  // Secondary income allocations
  sideIncomeSummary: SideIncomeSummary[];
  sideIncomeAllocations: SecondaryAllocation[];
  sideIncomeLoading: boolean;
  allocateSideIncome: (data: { incomeSourceId: string; paycheckNumber: number; action: 'savings' | 'bill'; amount: number; billId?: string; note?: string }) => Promise<void>;
  removeAllocation: (id: string) => Promise<void>;
  refreshSideIncome: () => Promise<void>;

  // Rollover
  currentRollover: MonthlyRollover | null;
  rolloverLoading: boolean;
  decideRollover: (action: 'rolled_over' | 'fresh_start') => Promise<void>;
  refreshRollover: () => Promise<void>;

  // User info
  userName: string;
  userInitials: string;

  // Spending budgets (Full Dollar Tracking)
  spendingBudgets: any[];
  spendingSummary: any[];
  availableNumber: number | null;
  availableBreakdown: any;
  creditCards: any[];
  plaidCards: any[];
  fetchSpendingBudgets: () => Promise<void>;
  fetchSpendingSummary: () => Promise<void>;
  fetchAvailableNumber: () => Promise<void>;
  fetchCreditCards: () => Promise<void>;

  // Budget suggestions (auto-budget engine)
  budgetSuggestions: any | null;
  fetchBudgetSuggestions: () => Promise<void>;

  // Banking cache (stale-while-revalidate)
  bankAccounts: any[];
  bankAccountsLoading: boolean;
  bankTransactions: any[];
  bankTransactionsLoading: boolean;
  fetchBankAccounts: (force?: boolean) => Promise<void>;
  fetchBankTransactions: (params?: { accountId?: string; days?: number; limit?: number }, force?: boolean) => Promise<void>;
  invalidateBankingCache: () => void;

  // Quick expense
  logQuickExpense: (name: string, amount: number, category?: string) => Promise<string | null>;

  // Cache metadata
  cacheMeta: CacheMeta;

  // Freshness timestamps (from backend)
  availableCalculatedAt: string | null;
  balanceFreshnessAt: string | null;
  transactionsSyncedAt: string | null;

  // Onboarding budget setup status
  budgetSetupStatus: string | null;

  // Initial load flag (prevents premature onboarding redirect)
  initialDataLoaded: boolean;
}

const defaultCurrency = CURRENCIES[0];

const AppContext = createContext<AppContextType>({
  bills: [],
  billsLoading: false,
  refreshBills: async () => {},
  addBill: async () => ({} as Bill),
  updateBill: async () => ({} as Bill),
  deleteBill: async () => {},
  getBill: () => undefined,

  billPayments: [],
  paymentsLoading: false,
  markBillPaid: async () => {},
  unmarkBillPaid: async () => {},
  isBillPaid: () => false,
  toggleSplitPaid: async () => {},
  isSplitPaid: () => false,
  refreshPayments: async () => {},

  incomeSources: [],
  incomeLoading: false,
  incomeFetchSucceeded: false,
  refreshIncomeSources: async () => {},
  addIncomeSource: async () => ({} as IncomeSource),
  updateIncomeSource: async () => ({} as IncomeSource),
  deleteIncomeSource: async () => {},
  setPrimaryIncomeSource: async () => {},

  categories: [],
  categoriesLoading: false,
  refreshCategories: async () => {},

  currency: defaultCurrency,
  setCurrencyCode: () => {},
  fmt: (n) => `$${n.toLocaleString()}`,

  detectedBills: [],
  detectedCount: 0,
  pendingConfirmationsCount: 0,
  refreshPendingConfirmations: async () => {},
  confirmDetectedBill: async () => {},
  confirmAsOneTime: async () => {},
  dismissDetectedBill: async () => {},
  linkDuplicateBill: async () => {},

  tier: 'free',
  isPro: false,
  isUltra: false,
  canSplit: () => false,
  maxForwardMonths: 1,
  refreshSubscription: async () => {},

  sideIncomeSummary: [],
  sideIncomeAllocations: [],
  sideIncomeLoading: false,
  allocateSideIncome: async () => {},
  removeAllocation: async () => {},
  refreshSideIncome: async () => {},
  currentRollover: null,
  rolloverLoading: false,
  decideRollover: async () => {},
  refreshRollover: async () => {},

  userName: '',
  userInitials: '',

  // Spending budgets (Full Dollar Tracking)
  spendingBudgets: [],
  spendingSummary: [],
  availableNumber: null,
  availableBreakdown: null,
  creditCards: [],
  plaidCards: [],
  fetchSpendingBudgets: async () => {},
  fetchSpendingSummary: async () => {},
  fetchAvailableNumber: async () => {},
  fetchCreditCards: async () => {},

  // Budget suggestions
  budgetSuggestions: null,
  fetchBudgetSuggestions: async () => {},

  // Banking cache
  bankAccounts: [],
  bankAccountsLoading: false,
  bankTransactions: [],
  bankTransactionsLoading: false,
  fetchBankAccounts: async () => {},
  fetchBankTransactions: async () => {},
  invalidateBankingCache: () => {},

  // Quick expense
  logQuickExpense: async () => null,

  cacheMeta: INITIAL_CACHE_META,
  availableCalculatedAt: null,
  balanceFreshnessAt: null,
  transactionsSyncedAt: null,

  budgetSetupStatus: null,

  // Initial load flag
  initialDataLoaded: false,
});

// ── Map API response to app Bill type (MATCHES MOBILE mapApiBill) ──
function mapApiBill(raw: Record<string, unknown>): Bill {
  const total = parseFloat(String(raw.total_amount)) || 0;
  const isSplit = raw.is_split || false;
  const splits = isSplit ? (Array.isArray(raw.bill_splits) ? raw.bill_splits as Record<string, unknown>[] : []) : [];

  let p1: number, p2: number, p3: number, p4: number;
  let p1done: boolean, p2done: boolean, p3done: boolean, p4done: boolean;
  let funded: number;
  let splitIds: string[] = [];

  if (isSplit && splits.length > 0) {
    // Sort splits by sort_order to ensure correct mapping (matches mobile)
    const sorted = [...splits].sort((a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
    );
    p1 = parseFloat(String(sorted[0]?.amount)) || 0;
    p2 = sorted.length > 1 ? (parseFloat(String(sorted[1]?.amount)) || 0) : 0;
    p3 = sorted.length > 2 ? (parseFloat(String(sorted[2]?.amount)) || 0) : 0;
    p4 = sorted.length > 3 ? (parseFloat(String(sorted[3]?.amount)) || 0) : 0;
    p1done = Boolean(sorted[0]?.is_saved_to_savings);
    p2done = sorted.length > 1 ? Boolean(sorted[1]?.is_saved_to_savings) : false;
    p3done = sorted.length > 2 ? Boolean(sorted[2]?.is_saved_to_savings) : false;
    p4done = sorted.length > 3 ? Boolean(sorted[3]?.is_saved_to_savings) : false;
    splitIds = sorted.map((s) => String(s.id));
    funded = sorted.reduce((sum: number, s) =>
      sum + (s.is_saved_to_savings ? (parseFloat(String(s.amount)) || 0) : 0), 0
    );
  } else {
    p1 = total;
    p2 = 0;
    p3 = 0;
    p4 = 0;
    p1done = false;
    p2done = false;
    p3done = false;
    p4done = false;
    funded = 0;
  }

  const categoryObj = raw.budget_categories as Record<string, unknown> | null;

  return {
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    category: String(categoryObj?.name || raw.category_name || 'Other'),
    dueDay: Number(raw.due_day_of_month) || 1,
    total,
    isSplit: Boolean(isSplit),
    isRecurring: raw.is_recurring !== false, // Default to true (matches mobile)
    isAutoPay: Boolean(raw.is_auto_pay),
    funded,
    p1, p2, p3, p4,
    p1done, p2done, p3done, p4done,
    splitIds,
    status: (raw.status as Bill['status']) || 'regular',
    detectedMerchant: raw.detected_merchant ? String(raw.detected_merchant) : undefined,
    detectedAt: raw.detected_at ? String(raw.detected_at) : undefined,
    possibleDuplicateOf: raw.possible_duplicate_of ? String(raw.possible_duplicate_of) : undefined,
    possibleDuplicateName: raw.possible_duplicate_name ? String(raw.possible_duplicate_name) : undefined,
    paidWith: typeof raw.paid_with === 'string' ? raw.paid_with : null,
    isQuickExpense: raw.is_quick_expense === true,
    isInternalTransfer: raw.is_internal_transfer === true,
    expenseType: (raw.expense_type as string) || 'fixed',
    pinnedPaycheck: raw.pinned_paycheck != null ? Number(raw.pinned_paycheck) : null,
    endsOn: raw.ends_on ? String(raw.ends_on) : null,
    // Detection explanation metadata
    detectionReason: raw.detection_reason ? String(raw.detection_reason) : null,
    detectionConfidence: raw.detection_confidence != null ? Number(raw.detection_confidence) : null,
    detectionOccurrences: raw.detection_occurrences != null ? Number(raw.detection_occurrences) : null,
    detectionAvgInterval: raw.detection_avg_interval != null ? Number(raw.detection_avg_interval) : null,
    detectionCv: raw.detection_cv != null ? Number(raw.detection_cv) : null,
    funding: (raw.funding as Bill['funding']) || null,
  };
}

// ── Map API income source (MATCHES MOBILE) ──────────────────
function mapIncomeSource(raw: Record<string, unknown>): IncomeSource {
  return {
    id: String(raw.id || ''),
    name: String(raw.name || 'Income'),
    frequency: String(raw.frequency || 'biweekly'),
    typicalAmount: parseFloat(String(raw.typical_amount || raw.typicalAmount || 0)) || 0,
    nextPayDate: raw.next_pay_date ? String(raw.next_pay_date) : (raw.nextPayDate ? String(raw.nextPayDate) : undefined),
    isPrimary: Boolean(raw.is_primary || raw.isPrimary || false),
    isOneTime: Boolean(raw.is_one_time || raw.isOneTime || false),
  };
}

// ── Auto-advance nextPayDate if in the past (MATCHES MOBILE) ──
function autoAdvancePayDates(sources: IncomeSource[]): IncomeSource[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const MAX_ADVANCES = 100;

  return sources.map((src) => {
    if (!src.nextPayDate) return src;
    const payDate = new Date(src.nextPayDate + 'T00:00:00');
    if (payDate >= today) return src;

    const freq = src.frequency?.toLowerCase() || '';
    let advancedDate = new Date(payDate);
    let safetyCounter = 0;

    if (freq === 'weekly') {
      while (advancedDate < today && safetyCounter < MAX_ADVANCES) {
        safetyCounter++;
        advancedDate.setDate(advancedDate.getDate() + 7);
      }
    } else if (freq === 'biweekly' || freq === 'bi-weekly') {
      while (advancedDate < today && safetyCounter < MAX_ADVANCES) {
        safetyCounter++;
        advancedDate.setDate(advancedDate.getDate() + 14);
      }
    } else if (freq === 'twicemonthly' || freq === 'twice a month' || freq === 'semimonthly') {
      while (advancedDate < today && safetyCounter < MAX_ADVANCES) {
        safetyCounter++;
        if (advancedDate.getDate() < 16) {
          advancedDate = new Date(advancedDate.getFullYear(), advancedDate.getMonth(), 16);
        } else {
          advancedDate = new Date(advancedDate.getFullYear(), advancedDate.getMonth() + 1, 1);
        }
      }
    } else {
      while (advancedDate < today && safetyCounter < MAX_ADVANCES) {
        safetyCounter++;
        advancedDate.setMonth(advancedDate.getMonth() + 1);
      }
    }

    const newDateStr = advancedDate.toISOString().split('T')[0];
    console.log(`[Auto-advance] ${src.name}: ${src.nextPayDate} → ${newDateStr}`);

    // Persist to backend silently
    usersAPI.updateIncomeSource(src.id, { nextPayDate: newDateStr }).catch(() => {});

    return { ...src, nextPayDate: newDateStr };
  });
}

// ── Provider ────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);

  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomeFetchSucceeded, setIncomeFetchSucceeded] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // ── Cache metadata + freshness timestamps ──────────────────
  const [cacheMeta, setCacheMeta] = useState<CacheMeta>(INITIAL_CACHE_META);
  const [availableCalculatedAt, setAvailableCalculatedAt] = useState<string | null>(null);
  const [balanceFreshnessAt, setBalanceFreshnessAt] = useState<string | null>(null);
  const [transactionsSyncedAt, setTransactionsSyncedAt] = useState<string | null>(null);
  const [budgetSetupStatus, setBudgetSetupStatus] = useState<string | null>(null);
  const prevUidRef = useRef<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [sideIncomeSummary, setSideIncomeSummary] = useState<SideIncomeSummary[]>([]);
  const [sideIncomeAllocations, setSideIncomeAllocations] = useState<SecondaryAllocation[]>([]);
  const [sideIncomeLoading, setSideIncomeLoading] = useState(false);
  const [currentRollover, setCurrentRollover] = useState<MonthlyRollover | null>(null);
  const [rolloverLoading, setRolloverLoading] = useState(false);

  // Spending budgets (Full Dollar Tracking)
  const [spendingBudgets, setSpendingBudgets] = useState<any[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<any[]>([]);
  const [availableNumber, setAvailableNumber] = useState<number | null>(null);
  const [availableBreakdown, setAvailableBreakdown] = useState<any>(null);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [budgetSuggestions, setBudgetSuggestions] = useState<any>(null);
  const [plaidCards, setPlaidCards] = useState<any[]>([]);

  // Banking cache state (stale-while-revalidate)
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [bankTransactionsLoading, setBankTransactionsLoading] = useState(false);
  // SWR state lives in refs so fetch callbacks have stable identity. If we used
  // useState here, the callbacks would get new identities on every fetch, which
  // would refire any effect that has them in its deps → infinite loop spamming
  // /api/banking/accounts and /api/banking-data/all-transactions.
  const bankAccountsLastFetchedRef = useRef<number | null>(null);
  const bankTransactionsLastFetchedRef = useRef<number | null>(null);
  const bankAccountsLengthRef = useRef<number>(0);
  const bankTransactionsLengthRef = useRef<number>(0);
  const bankTxnParamsRef = useRef<string>('');

  const BANKING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const [currencyCode, setCurrencyCodeState] = useState('USD');
  const [tier, setTier] = useState<'free' | 'pro' | 'ultra'>('free');
  const isPro = tier === 'pro' || tier === 'ultra';
  const isUltra = tier === 'ultra';
  const FREE_SPLIT_LIMIT = 1;
  const maxForwardMonths = isPro ? 99 : 1;

  function canSplit(billId?: string): boolean {
    if (isPro) return true;
    const existingSplits = bills.filter(b => b.isSplit);
    if (billId && existingSplits.some(b => b.id === billId)) return true;
    return existingSplits.length < FREE_SPLIT_LIMIT;
  }

  async function refreshSubscription() {
    try {
      const res = await subscriptionsAPI.getStatus();
      const plan = res.data?.plan || 'free';
      if (plan === 'pro' || plan === 'ultra') setTier(plan);
      else setTier('free');
    } catch (err) {
      console.log('refreshSubscription error:', (err as any)?.message);
    }
  }

  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  // User info from Firebase
  const userName = user?.displayName || '';
  const userInitials = userName
    ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email ? user.email[0].toUpperCase() : '?';

  // Format money — matches mobile fmt()
  const fmt = (amount: number | null | undefined): string => {
    if (amount == null || isNaN(amount)) return `${currency.symbol}0`;
    if (currency.code === 'JPY') {
      return `${currency.symbol}${Math.round(amount).toLocaleString()}`;
    }
    return `${currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // ── Fetch bills ─────────────────────────────────────────
  const fetchBills = useCallback(async () => {
    if (!user) return;
    setBillsLoading(true);
    try {
      const res = await billsAPI.getAll();
      const billsArray = Array.isArray(res.data?.bills) ? res.data.bills : [];
      const mapped = billsArray.map((b: Record<string, unknown>) => mapApiBill(b));
      setBills(mapped);
      cacheSet(user.uid, 'bills', mapped);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setBillsLoading(false);
    }
  }, [user]);

  // ── Fetch income sources ─────────────────────────────────
  const fetchIncomeSources = useCallback(async () => {
    if (!user) return;
    setIncomeLoading(true);
    try {
      const res = await usersAPI.getIncomeSources();
      const sourcesArray = Array.isArray(res.data?.incomeSources)
        ? res.data.incomeSources
        : (Array.isArray(res.data?.income_sources) ? res.data.income_sources : []);
      const mapped = sourcesArray.map((s: Record<string, unknown>) => mapIncomeSource(s));
      const advanced = autoAdvancePayDates(mapped);
      setIncomeSources(advanced);
      setIncomeFetchSucceeded(true);
      cacheSet(user.uid, 'income', advanced);
    } catch (error) {
      console.error('Failed to fetch income sources:', error);
      // Don't set incomeFetchSucceeded — prevents false onboarding redirect on API failure
    } finally {
      setIncomeLoading(false);
    }
  }, [user]);

  // ── Fetch categories ─────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    setCategoriesLoading(true);
    try {
      const res = await usersAPI.getCategories();
      const cats = (res.data?.categories || []).map((c: Record<string, unknown>) => ({
        id: String(c.id),
        name: String(c.name),
        color: String(c.color || '#0C4A6E'),
        icon: c.icon ? String(c.icon) : undefined,
      }));
      setCategories(cats);
      cacheSet(user.uid, 'categories', cats);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user]);

  // ── Fetch payments for prev/current/next month (MATCHES MOBILE) ────
  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const now = new Date();
      const periods = [-1, 0, 1].map(offset => {
        const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
      });
      const responses = await Promise.all(
        periods.map(period => billsAPI.getPayments(period.year, period.month))
      );
      const payments: BillPayment[] = responses.flatMap(response => {
        const paymentsArray = Array.isArray(response.data?.payments) ? response.data.payments : [];
        return paymentsArray.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          billId: String(p.bill_id),
          periodMonth: Number(p.period_month),
          periodYear: Number(p.period_year),
          paycheckNumber: p.paycheck_number != null ? Number(p.paycheck_number) : null,
          paidAt: String(p.paid_at || ''),
        }));
      });
      setBillPayments(payments);
      cacheSet(user.uid, 'payments', payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  }, [user]);

  // ── Fetch secondary income (MATCHES MOBILE) ─────────────
  const fetchSideIncome = useCallback(async () => {
    if (!user) return;
    setSideIncomeLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const [summaryRes, allocRes] = await Promise.all([
        secondaryIncomeAPI.getSummary(month, year),
        secondaryIncomeAPI.getAllocations(month, year),
      ]);
      setSideIncomeSummary((summaryRes.data?.summary || []).map((s: Record<string, unknown>) => ({
        incomeSourceId: String(s.incomeSourceId),
        name: String(s.name),
        amount: parseFloat(String(s.amount)) || 0,
        frequency: String(s.frequency || ''),
        totalAllocated: parseFloat(String(s.totalAllocated)) || 0,
        totalToSavings: parseFloat(String(s.totalToSavings)) || 0,
        totalToBills: parseFloat(String(s.totalToBills)) || 0,
        remaining: parseFloat(String(s.remaining)) || 0,
        byPaycheck: (s.byPaycheck || {}) as Record<number, { allocated: number; toSavings: number; toBills: number }>,
      })));
      setSideIncomeAllocations((allocRes.data?.allocations || []).map((a: Record<string, unknown>) => ({
        id: String(a.id),
        incomeSourceId: String(a.income_source_id),
        periodMonth: Number(a.period_month),
        periodYear: Number(a.period_year),
        paycheckNumber: Number(a.paycheck_number),
        action: String(a.action) as 'savings' | 'bill',
        amount: parseFloat(String(a.amount)) || 0,
        billId: a.bill_id ? String(a.bill_id) : undefined,
        billName: (a.bills as Record<string, unknown>)?.name ? String((a.bills as Record<string, unknown>).name) : undefined,
        sourceName: (a.income_sources as Record<string, unknown>)?.name ? String((a.income_sources as Record<string, unknown>).name) : undefined,
        note: a.note ? String(a.note) : undefined,
      })));
    } catch (error) {
      console.error('Failed to fetch side income:', error);
    } finally {
      setSideIncomeLoading(false);
    }
  }, [user]);

  const allocateSideIncome = async (data: { incomeSourceId: string; paycheckNumber: number; action: 'savings' | 'bill'; amount: number; billId?: string; note?: string }) => {
    const now = new Date();
    try {
      await secondaryIncomeAPI.allocate({
        incomeSourceId: data.incomeSourceId,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        paycheckNumber: data.paycheckNumber,
        action: data.action,
        amount: data.amount,
        billId: data.billId || undefined,
        note: data.note || undefined,
      });
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
      await fetchSideIncome();
    } catch (error) {
      console.error('allocateSideIncome failed:', error);
      throw error;
    }
  };

  const removeAllocation = async (id: string) => {
    setSideIncomeAllocations(prev => prev.filter(a => a.id !== id));
    try {
      await secondaryIncomeAPI.removeAllocation(id);
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
      await fetchSideIncome();
    } catch (error) {
      console.error('removeAllocation failed:', error);
      fetchSideIncome();
    }
  };

  // ── Fetch rollover (MATCHES MOBILE) ──────────────────────
  const fetchRollover = useCallback(async () => {
    if (!user) return;
    setRolloverLoading(true);
    try {
      const res = await rolloverAPI.getCurrent();
      const r = res.data?.rollover;
      if (r) {
        setCurrentRollover({
          id: r.id,
          periodMonth: r.period_month,
          periodYear: r.period_year,
          previousLeftover: parseFloat(r.previous_leftover) || 0,
          action: r.action,
          rolloverAmount: parseFloat(r.rollover_amount) || 0,
          decidedAt: r.decided_at || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to fetch rollover:', error);
    } finally {
      setRolloverLoading(false);
    }
  }, [user]);

  const decideRollover = async (action: 'rolled_over' | 'fresh_start') => {
    if (!currentRollover) return;
    const newAmount = action === 'rolled_over' ? currentRollover.previousLeftover : 0;
    setCurrentRollover(prev => prev ? { ...prev, action, rolloverAmount: newAmount, decidedAt: new Date().toISOString() } : null);
    try {
      await rolloverAPI.decide({
        action,
        periodMonth: currentRollover.periodMonth,
        periodYear: currentRollover.periodYear,
      });
      if (user) cacheInvalidateGroups(user.uid, ['available']);
    } catch (error) {
      console.error('decideRollover failed:', error);
      fetchRollover();
    }
  };

  // ── Fetch spending budgets (Full Dollar Tracking) ─────────
  const fetchSpendingBudgets = useCallback(async () => {
    if (!user) {
      setSpendingBudgets([]);
      return;
    }
    try {
      const res = await spendingAPI.getBudgets();
      setSpendingBudgets(res.data?.budgets || []);
    } catch (err) {
      console.log('fetchSpendingBudgets error:', (err as any)?.message);
    }
  }, [user]);

  // ── Fetch spending summary ───────────────────────────────
  const fetchSpendingSummary = useCallback(async () => {
    if (!user) {
      setSpendingSummary([]);
      return;
    }
    try {
      const res = await spendingAPI.getSummary();
      const cats = res.data?.categories || [];
      setSpendingSummary(cats);
      cacheSet(user.uid, 'budgetSummary', cats);
    } catch (err) {
      console.log('fetchSpendingSummary error:', (err as any)?.message);
    }
  }, [user]);

  // ── Fetch available number ───────────────────────────────
  const fetchAvailableNumber = useCallback(async () => {
    if (!user) {
      setAvailableNumber(null);
      setAvailableBreakdown(null);
      return;
    }
    try {
      const res = await spendingAPI.getAvailable();
      const num = res.data?.available?.availableNumber ?? null;
      const breakdown = res.data?.available || null;
      setAvailableNumber(num);
      setAvailableBreakdown(breakdown);
      // Capture freshness timestamps from backend
      if (res.data?.available?.calculatedAt) setAvailableCalculatedAt(res.data.available.calculatedAt);
      if (res.data?.available?.balanceFreshnessAt) setBalanceFreshnessAt(res.data.available.balanceFreshnessAt);
      // Persist to localStorage for next cold start
      if (num !== null && breakdown) {
        cacheSet(user.uid, 'available', { num, breakdown, calculatedAt: res.data?.available?.calculatedAt, balanceFreshnessAt: res.data?.available?.balanceFreshnessAt });
      }
    } catch (err) {
      console.log('fetchAvailableNumber error:', (err as any)?.message);
    }
  }, [user]);

  // ── Fetch budget suggestions ─────────────────────────────
  const fetchBudgetSuggestions = useCallback(async () => {
    if (!user) {
      setBudgetSuggestions(null);
      return;
    }
    try {
      const res = await spendingAPI.getSuggested();
      setBudgetSuggestions(res.data || null);
    } catch (err) {
      // 403 = not Ultra tier (backend gates this) — silent
      if ((err as any)?.response?.status !== 403) {
        console.log('fetchBudgetSuggestions error:', (err as any)?.message);
      }
    }
  }, [user]);

  // ── Fetch credit cards ───────────────────────────────────
  const fetchCreditCards = useCallback(async () => {
    if (!user) {
      setCreditCards([]);
      setPlaidCards([]);
      return;
    }
    try {
      const res = await billsAPI.getCreditCards();
      setCreditCards(res.data?.creditCards || []);
      setPlaidCards(res.data?.plaidCards || []);
    } catch (err) {
      console.log('fetchCreditCards error:', (err as any)?.message);
    }
  }, [user]);

  // ── Banking cache fetchers (stale-while-revalidate) ──────
  // SWR state in refs keeps callback identity stable. See ref declarations above.
  const fetchBankAccounts = useCallback(async (force?: boolean) => {
    if (!user || !isUltra) return;
    const now = Date.now();
    const lastFetched = bankAccountsLastFetchedRef.current;
    const isFresh = lastFetched && (now - lastFetched) < BANKING_CACHE_TTL;
    if (isFresh && !force && bankAccountsLengthRef.current > 0) return;
    if (bankAccountsLengthRef.current === 0) setBankAccountsLoading(true);
    try {
      const res = await bankingAPI.getAccounts();
      const accts = res.data?.accounts || [];
      setBankAccounts(accts);
      bankAccountsLengthRef.current = accts.length;
      bankAccountsLastFetchedRef.current = Date.now();
      cacheSet(user.uid, 'accounts', accts);
      // Capture transactionsSyncedAt from lastSyncAt if present
      if (res.data?.lastSyncAt) setTransactionsSyncedAt(res.data.lastSyncAt);
    } catch (err) {
      console.log('fetchBankAccounts failed:', (err as any)?.message);
    } finally {
      setBankAccountsLoading(false);
    }
  }, [user, isUltra]);

  const fetchBankTransactions = useCallback(async (params?: { accountId?: string; days?: number; limit?: number }, force?: boolean) => {
    if (!user || !isUltra) return;
    const now = Date.now();
    const paramsKey = JSON.stringify(params || {});
    const lastFetched = bankTransactionsLastFetchedRef.current;
    const isFresh = lastFetched && (now - lastFetched) < BANKING_CACHE_TTL;
    const sameParams = bankTxnParamsRef.current === paramsKey;
    if (isFresh && sameParams && !force && bankTransactionsLengthRef.current > 0) return;
    if (bankTransactionsLengthRef.current === 0 || !sameParams) setBankTransactionsLoading(true);
    bankTxnParamsRef.current = paramsKey;
    try {
      const res = await bankingAPI.getAllTransactions({
        category: 'all',
        days: params?.days || 90,
        limit: params?.limit || 300,
        offset: 0,
        ...(params?.accountId ? { accountId: params.accountId } : {}),
      });
      const txns = res.data?.transactions || [];
      setBankTransactions(txns);
      bankTransactionsLengthRef.current = txns.length;
      bankTransactionsLastFetchedRef.current = Date.now();
      cacheSet(user.uid, 'transactions', txns);
    } catch (err) {
      console.log('fetchBankTransactions failed:', (err as any)?.message);
    } finally {
      setBankTransactionsLoading(false);
    }
  }, [user, isUltra]);

  const invalidateBankingCache = useCallback(() => {
    bankAccountsLastFetchedRef.current = null;
    bankTransactionsLastFetchedRef.current = null;
  }, []);

  // ── Log quick expense ────────────────────────────────────
  const logQuickExpense = useCallback(async (name: string, amount: number, category?: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const res = await billsAPI.quickExpense({ name, amount, category });
      const billId = res.data?.bill?.id || null;
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
      await Promise.all([fetchBills(), fetchAvailableNumber()]);
      return billId;
    } catch (err) {
      console.log('logQuickExpense error:', (err as any)?.message);
      throw err;
    }
  }, [user, fetchBills, fetchAvailableNumber]);

  // ── Hydrate from localStorage on cold start ────────────────
  // Runs once per user change. Sets cached data immediately so UI is not blank.
  // Does NOT set lastFetched timestamps — syncAndFetch still fires and overwrites.
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    // Clear previous user's data if uid changed
    if (prevUidRef.current && prevUidRef.current !== uid) {
      cacheClear(prevUidRef.current);
    }
    prevUidRef.current = uid;

    const cachedBills = cacheGet<Bill[]>(uid, 'bills');
    const cachedIncome = cacheGet<IncomeSource[]>(uid, 'income');
    const cachedPayments = cacheGet<BillPayment[]>(uid, 'payments');
    const cachedCategories = cacheGet<Category[]>(uid, 'categories');
    const cachedAccounts = cacheGet<any[]>(uid, 'accounts');
    const cachedTransactions = cacheGet<any[]>(uid, 'transactions');
    const cachedAvailable = cacheGet<{ num: number; breakdown: any; calculatedAt?: string; balanceFreshnessAt?: string }>(uid, 'available');
    const cachedBudgetSummary = cacheGet<any[]>(uid, 'budgetSummary');
    const cachedConfirmations = cacheGet<{ count: number }>(uid, 'confirmations');

    let hydrated = false;
    if (cachedBills) { setBills(cachedBills); hydrated = true; }
    if (cachedIncome) { setIncomeSources(cachedIncome); setIncomeFetchSucceeded(true); hydrated = true; }
    if (cachedPayments) { setBillPayments(cachedPayments); hydrated = true; }
    if (cachedCategories) { setCategories(cachedCategories); hydrated = true; }
    if (cachedAccounts) { setBankAccounts(cachedAccounts); bankAccountsLengthRef.current = cachedAccounts.length; hydrated = true; }
    if (cachedTransactions) { setBankTransactions(cachedTransactions); bankTransactionsLengthRef.current = cachedTransactions.length; hydrated = true; }
    if (cachedAvailable) {
      setAvailableNumber(cachedAvailable.num);
      setAvailableBreakdown(cachedAvailable.breakdown);
      if (cachedAvailable.calculatedAt) setAvailableCalculatedAt(cachedAvailable.calculatedAt);
      if (cachedAvailable.balanceFreshnessAt) setBalanceFreshnessAt(cachedAvailable.balanceFreshnessAt);
      hydrated = true;
    }
    if (cachedBudgetSummary) { setSpendingSummary(cachedBudgetSummary); hydrated = true; }
    if (cachedConfirmations) { setPendingConfirmationsCount(cachedConfirmations.count); hydrated = true; }

    if (hydrated) {
      setCacheMeta(prev => ({ ...prev, hydratedFromCache: true, lastHydratedAt: Date.now() }));
    }
  }, [user]);

  // ── Initial fetch + sync user profile ─────────────────────
  useEffect(() => {
    if (!user) {
      setInitialDataLoaded(false);
      setTier('free');
      return;
    }

    async function syncAndFetch() {
      // Sync user profile (currency, tier, etc.)
      try {
        const token = await user!.getIdToken();
        let userData = null;
        try {
          const loginRes = await authAPI.login(token);
          userData = loginRes.data?.user;
        } catch (loginErr: unknown) {
          const err = loginErr as { response?: { status?: number; data?: { code?: string } } };
          if (err?.response?.status === 404 || err?.response?.data?.code === 'USER_NOT_FOUND') {
            try {
              const registerRes = await authAPI.register(
                token,
                user!.displayName || user!.email?.split('@')[0] || 'Keipr User'
              );
              userData = registerRes.data?.user;
            } catch (regErr) {
              console.log('Auto-registration failed:', regErr);
            }
          }
        }

        if (userData) {
          if (userData.currency) setCurrencyCodeState(userData.currency);
          const dbPlan = userData.plan || 'free';
          if (dbPlan === 'pro' || dbPlan === 'ultra') setTier(dbPlan);
          else setTier('free');
          if (userData.budget_setup_status) setBudgetSetupStatus(userData.budget_setup_status);
        }
      } catch (err) {
        console.log('Login sync unavailable:', err);
      }

      // Fetch data (revalidate — overwrites cache hydration with fresh API data)
      await Promise.all([fetchBills(), fetchIncomeSources(), fetchCategories(), fetchPayments(), fetchRollover(), fetchSideIncome(), fetchSpendingBudgets(), fetchSpendingSummary(), fetchAvailableNumber(), fetchCreditCards(), refreshPendingConfirmations(), fetchBudgetSuggestions()]);
      setCacheMeta(prev => ({ ...prev, lastRefreshedAt: Date.now(), refreshInProgress: false }));
      setInitialDataLoaded(true);
    }

    syncAndFetch();
  }, [user, fetchBills, fetchIncomeSources, fetchCategories, fetchPayments, fetchRollover, fetchSideIncome]);

  // ── Poll budget_setup_status while importing/analyzing ─────
  // Checks /auth/me every 10s until status flips to 'ready' or 10 min elapses.
  useEffect(() => {
    if (!user) return;
    if (budgetSetupStatus !== 'importing' && budgetSetupStatus !== 'analyzing') return;

    const POLL_INTERVAL = 10_000;  // 10 seconds
    const MAX_POLL_MS = 10 * 60 * 1000; // 10 minutes
    const startedAt = Date.now();

    const timer = setInterval(async () => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        clearInterval(timer);
        setBudgetSetupStatus(null); // timeout — hide banner
        return;
      }
      try {
        const res = await authAPI.me();
        const status = res.data?.user?.budget_setup_status || null;
        setBudgetSetupStatus(status);
        if (status === 'ready' || status === null) {
          clearInterval(timer);
          // Status is ready — refresh all data to pick up AI changes
          if (status === 'ready') {
            Promise.all([fetchBills(), fetchIncomeSources(), fetchPayments(), fetchAvailableNumber(), fetchSpendingSummary()]).catch(() => {});
          }
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL);

    return () => clearInterval(timer);
  }, [user, budgetSetupStatus, fetchBills, fetchIncomeSources, fetchPayments, fetchAvailableNumber, fetchSpendingSummary]);

  // ── Auto-fetch banking data once tier is known as Ultra ───
  useEffect(() => {
    if (user && isUltra) {
      fetchBankAccounts(true);
      fetchBankTransactions(undefined, true);
    }
  }, [user, isUltra, fetchBankAccounts, fetchBankTransactions]);

  // ── Bill CRUD ─────────────────────────────────────────────
  const addBill = async (data: Record<string, unknown>): Promise<Bill> => {
    // Map app field names → backend field names (mirrors mobile AppContext)
    const matchedCat = categories.find(c => c.name.toLowerCase() === ((data.category as string) || '').toLowerCase());
    const apiData = {
      name: data.name,
      totalAmount: data.total,
      dueDayOfMonth: data.dueDay,
      isRecurring: data.isRecurring,
      isSplit: data.isSplit,
      splitCount: data.isSplit
        ? ([data.p1, data.p2, data.p3, data.p4].filter(v => (v as number || 0) > 0).length || 2)
        : 1,
      categoryId: matchedCat?.id || null,
      categoryName: (data.category as string) || null,
      isAutoPay: data.isAutoPay || false,
      paidWith: data.paidWith || null,
      expenseType: data.expenseType || 'fixed',
    };
    const res = await billsAPI.create(apiData);
    const bill = mapApiBill(res.data?.bill || res.data);
    setBills(prev => [...prev, bill]);
    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);

    // If split, set split allocations
    if (data.isSplit && bill.id) {
      const splits = [];
      for (let i = 1; i <= 4; i++) {
        const amt = data[`p${i}`] as number || 0;
        if (amt > 0) splits.push({ amount: amt, sortOrder: i });
      }
      if (splits.length > 0) {
        try {
          await billsAPI.setSplits(bill.id, splits);
        } catch (e) {
          console.warn('Failed to set splits:', e);
        }
      }
    }

    return bill;
  };

  const updateBill = async (id: string, data: Record<string, unknown>): Promise<Bill> => {
    // Map app field names → backend field names (mirrors mobile AppContext)
    const apiData: Record<string, unknown> = {};
    if (data.name !== undefined) apiData.name = data.name;
    if (data.total !== undefined) apiData.totalAmount = data.total;
    if (data.dueDay !== undefined) apiData.dueDayOfMonth = data.dueDay;
    if (data.isRecurring !== undefined) apiData.isRecurring = data.isRecurring;
    if (data.isAutoPay !== undefined) apiData.isAutoPay = data.isAutoPay;
    if (data.isSplit !== undefined) {
      apiData.isSplit = data.isSplit;
      apiData.splitCount = data.isSplit
        ? ([data.p1, data.p2, data.p3, data.p4].filter(v => (v as number || 0) > 0).length || 2)
        : 1;
    }
    if (data.category !== undefined) {
      const matchedCat = categories.find(c => c.name.toLowerCase() === ((data.category as string) || '').toLowerCase());
      apiData.categoryId = matchedCat?.id || null;
      apiData.categoryName = (data.category as string) || null;
    }
    if (data.paidWith !== undefined) apiData.paidWith = data.paidWith;
    if (data.expenseType !== undefined) apiData.expenseType = data.expenseType;
    const res = await billsAPI.update(id, apiData);
    const bill = mapApiBill(res.data?.bill || res.data);
    setBills(prev => prev.map((b) => (b.id === id ? bill : b)));

    // If split, update split allocations
    if (data.isSplit) {
      const splits = [];
      for (let i = 1; i <= 4; i++) {
        const amt = data[`p${i}`] as number || 0;
        if (amt > 0) splits.push({ amount: amt, sortOrder: i });
      }
      if (splits.length > 0) {
        try {
          await billsAPI.setSplits(id, splits);
          // Refresh bills to get fresh splitIds — required for toggleSplitPaid to work
          await fetchBills();
        } catch (e) {
          console.warn('Failed to set splits:', e);
        }
      }
    }

    // Refresh credit cards if paidWith changed
    if (data.paidWith !== undefined) {
      fetchCreditCards().catch(() => {});
    }

    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
    return bill;
  };

  const deleteBill = async (id: string) => {
    await billsAPI.delete(id);
    setBills(prev => prev.filter((b) => b.id !== id));
    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
    // Refresh available number so quick expense deletions restore the balance
    fetchAvailableNumber();
  };

  const getBill = (id: string) => bills.find((b) => b.id === id);

  // ── Payment operations (MATCHES MOBILE — per-paycheck scoped) ──────────────────
  // For non-split bills: only match rows where paycheckNumber is null.
  // This prevents a split P1 payment from accidentally counting as whole-bill paid.
  const isBillPaid = (billId: string, periodMonth?: number, periodYear?: number): boolean => {
    return billPayments.some((p) =>
      p.billId === billId &&
      p.paycheckNumber == null &&
      (periodMonth == null || p.periodMonth === periodMonth) &&
      (periodYear == null || p.periodYear === periodYear)
    );
  };

  const markBillPaid = async (billId: string, periodMonth?: number, periodYear?: number, paycheckNumber?: number) => {
    const now = new Date();
    const month = periodMonth ?? now.getMonth() + 1;
    const year = periodYear ?? now.getFullYear();
    // Optimistic
    const tempPayment: BillPayment = {
      id: Date.now().toString(),
      billId,
      periodMonth: month,
      periodYear: year,
      paycheckNumber: paycheckNumber ?? null,
      paidAt: now.toISOString(),
    };
    setBillPayments(prev => [...prev, tempPayment]);
    try {
      const response = await billsAPI.markPaid({ billId, periodMonth: month, periodYear: year, paycheckNumber: paycheckNumber ?? undefined });
      const created = response.data?.payment;
      if (created) {
        setBillPayments(prev =>
          prev.map(p => p.id === tempPayment.id ? { ...tempPayment, id: created.id } : p)
        );
      }
      if (user) cacheInvalidateGroups(user.uid, ['tracker', 'available']);
    } catch (err) {
      console.log('markBillPaid API failed:', err);
    }
  };

  const unmarkBillPaid = async (billId: string, periodMonth?: number, periodYear?: number, paycheckNumber?: number) => {
    const payments = billPayments.filter(p =>
      p.billId === billId &&
      (periodMonth == null || p.periodMonth === periodMonth) &&
      (periodYear == null || p.periodYear === periodYear) &&
      (paycheckNumber == null || p.paycheckNumber === paycheckNumber)
    );
    if (payments.length === 0) return;
    // Optimistic: remove matching payment records for this bill/period
    setBillPayments(prev => prev.filter(p => !payments.some(payment => payment.id === p.id)));
    try {
      for (const payment of payments) {
        await billsAPI.unmarkPaid(payment.id);
      }
      if (user) cacheInvalidateGroups(user.uid, ['tracker', 'available']);
    } catch (err) {
      console.log('unmarkBillPaid API failed:', err);
      setBillPayments(prev => [...prev, ...payments]); // rollback
    }
  };

  // Per-split paid tracking — period-scoped (MATCHES MOBILE)
  // Checks bill_payments with paycheckNumber + period instead of global p1done/p2done flags.
  const isSplitPaid = (billId: string, paycheckNum: number, periodMonth?: number, periodYear?: number): boolean => {
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.isSplit) return isBillPaid(billId, periodMonth, periodYear);

    // If period is specified, check bill_payments for this specific period + paycheck
    if (periodMonth != null && periodYear != null) {
      return billPayments.some(p =>
        p.billId === billId &&
        p.paycheckNumber === paycheckNum &&
        p.periodMonth === periodMonth &&
        p.periodYear === periodYear
      );
    }

    // Fallback to legacy p1done/p2done when no period specified (backward compat)
    if (paycheckNum === 1) return bill.p1done;
    if (paycheckNum === 2) return bill.p2done;
    if (paycheckNum === 3) return bill.p3done;
    if (paycheckNum === 4) return bill.p4done;
    return false;
  };

  // toggleSplitPaid now uses period-scoped bill_payments instead of the global
  // is_saved_to_savings flag on bill_splits.
  const toggleSplitPaid = async (billId: string, paycheckNum: number, periodMonth?: number, periodYear?: number) => {
    if (paycheckNum < 1 || paycheckNum > 4) return;
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.isSplit) {
      // Non-split: toggle period-scoped paid state
      if (isBillPaid(billId, periodMonth, periodYear)) await unmarkBillPaid(billId, periodMonth, periodYear);
      else await markBillPaid(billId, periodMonth, periodYear);
      return;
    }

    // Split bill: toggle via bill_payments with paycheckNumber
    const month = periodMonth ?? new Date().getMonth() + 1;
    const year = periodYear ?? new Date().getFullYear();
    const currentlyPaid = isSplitPaid(billId, paycheckNum, month, year);

    if (currentlyPaid) {
      await unmarkBillPaid(billId, month, year, paycheckNum);
    } else {
      await markBillPaid(billId, month, year, paycheckNum);
    }
  };

  const refreshPayments = async () => { await fetchPayments(); };
  const refreshBills = async () => { await fetchBills(); };
  const refreshIncomeSources = async () => { await fetchIncomeSources(); };
  const refreshCategories = async () => { await fetchCategories(); };

  // ── Detected bills (computed from bills state) ──────────
  const detectedBills = bills.filter(b => b.status === 'detected');
  const detectedCount = detectedBills.length;

  // ── Pending confirmations (medium-confidence matches needing review) ──
  const [pendingConfirmationsCount, setPendingConfirmationsCount] = useState(0);

  const refreshPendingConfirmations = useCallback(async () => {
    try {
      const res = await bankingAPI.getConfirmations();
      const confirmations = res.data?.confirmations || [];
      const count = confirmations.length;
      setPendingConfirmationsCount(count);
      if (user) cacheSet(user.uid, 'confirmations', { count });
    } catch {
      // Silently fail — not critical
    }
  }, [isUltra, user]);

  const confirmDetectedBill = async (billId: string, overrides?: Record<string, unknown>) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'confirmed' } : b));
    try {
      await billsAPI.confirmDetected(billId, overrides || {});
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available', 'review']);
      refreshBills().catch(() => {});
    } catch (err) {
      console.log('confirmDetectedBill failed:', (err as Error)?.message);
      await refreshBills();
    }
  };

  const confirmAsOneTime = async (billId: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'confirmed', isRecurring: false } : b));
    try {
      await billsAPI.confirmDetected(billId, { oneTime: true });
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available', 'review']);
      refreshBills().catch(() => {});
      refreshPayments().catch(() => {});
    } catch (err) {
      console.log('confirmAsOneTime failed:', (err as Error)?.message);
      await refreshBills();
    }
  };

  const dismissDetectedBill = async (billId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    try {
      await billsAPI.dismissDetected(billId);
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'review']);
    } catch (err) {
      console.log('dismissDetectedBill failed:', (err as Error)?.message);
      await refreshBills();
    }
  };

  const linkDuplicateBill = async (billId: string, targetBillId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    try {
      await billsAPI.linkDuplicate(billId, targetBillId);
      if (user) cacheInvalidateGroups(user.uid, ['budget', 'available', 'review']);
      await refreshBills(); // Refresh to sync with server
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || (err as Error)?.message || 'Unknown error';
      console.log('linkDuplicateBill failed:', msg);
      alert(`Link failed: ${msg}`);
      await refreshBills(); // Rollback by re-fetching
    }
  };

  // ── Income source CRUD ────────────────────────────────────
  const addIncomeSource = async (data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.addIncomeSource(data);
    const source = mapIncomeSource(res.data?.incomeSource || res.data?.income_source || res.data);
    setIncomeSources(prev => [...prev, source]);
    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
    return source;
  };

  const updateIncomeSource = async (id: string, data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.updateIncomeSource(id, data);
    const source = mapIncomeSource(res.data?.incomeSource || res.data?.income_source || res.data);
    setIncomeSources(prev => prev.map((s) => (s.id === id ? source : s)));
    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
    return source;
  };

  const deleteIncomeSource = async (id: string) => {
    const wasPrimary = incomeSources.find(s => s.id === id)?.isPrimary;
    await usersAPI.deleteIncomeSource(id);
    if (user) cacheInvalidateGroups(user.uid, ['budget', 'available']);
    setIncomeSources(prev => {
      const remaining = prev.filter((s) => s.id !== id);
      // If deleted source was primary, promote the first remaining
      if (wasPrimary && remaining.length > 0 && !remaining.some(s => s.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });
  };

  const setPrimaryIncomeSource = async (id: string) => {
    // Optimistic: unset all, set chosen one
    setIncomeSources(prev => prev.map(s => ({ ...s, isPrimary: s.id === id })));
    try {
      await usersAPI.updateIncomeSource(id, { isPrimary: true });
    } catch (err) {
      console.log('setPrimaryIncomeSource API sync failed:', (err as Error)?.message);
    }
  };

  const setCurrencyCode = (code: string) => {
    setCurrencyCodeState(code);
  };

  return (
    <AppContext.Provider
      value={{
        bills,
        billsLoading,
        refreshBills,
        addBill,
        updateBill,
        deleteBill,
        getBill,
        detectedBills,
        detectedCount,
        confirmDetectedBill,
        confirmAsOneTime,
        dismissDetectedBill,
        linkDuplicateBill,

        billPayments,
        paymentsLoading,
        markBillPaid,
        unmarkBillPaid,
        isBillPaid,
        toggleSplitPaid,
        isSplitPaid,
        refreshPayments,

        incomeSources,
        incomeLoading,
        incomeFetchSucceeded,
        refreshIncomeSources,
        addIncomeSource,
        updateIncomeSource,
        deleteIncomeSource,
        setPrimaryIncomeSource,

        categories,
        categoriesLoading,
        refreshCategories,

        currency,
        setCurrencyCode,
        fmt,

        sideIncomeSummary,
        sideIncomeAllocations,
        sideIncomeLoading,
        allocateSideIncome,
        removeAllocation,
        refreshSideIncome: fetchSideIncome,

        currentRollover,
        rolloverLoading,
        decideRollover,
        refreshRollover: fetchRollover,

        tier,
        isPro,
        isUltra,
        canSplit,
        maxForwardMonths,
        refreshSubscription,

        userName,
        userInitials,

        spendingBudgets,
        spendingSummary,
        availableNumber,
        availableBreakdown,
        creditCards,
        plaidCards,
        fetchSpendingBudgets,
        fetchSpendingSummary,
        fetchAvailableNumber,
        fetchCreditCards,

        budgetSuggestions,
        fetchBudgetSuggestions,

        bankAccounts, bankAccountsLoading, bankTransactions, bankTransactionsLoading,
        fetchBankAccounts, fetchBankTransactions, invalidateBankingCache,

        logQuickExpense,

        pendingConfirmationsCount,
        refreshPendingConfirmations,

        cacheMeta,
        availableCalculatedAt,
        balanceFreshnessAt,
        transactionsSyncedAt,

        budgetSetupStatus,

        initialDataLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
