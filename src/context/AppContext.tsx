'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { billsAPI, usersAPI, authAPI, rolloverAPI, secondaryIncomeAPI, spendingAPI } from '../lib/api';
import { useAuth } from './AuthContext';

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
}

// ── Bill payment type (matches mobile: periodMonth/periodYear) ──
export interface BillPayment {
  id: string;
  billId: string;
  periodMonth: number;
  periodYear: number;
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
  markBillPaid: (billId: string) => Promise<void>;
  unmarkBillPaid: (billId: string) => Promise<void>;
  isBillPaid: (billId: string) => boolean;
  toggleSplitPaid: (billId: string, paycheckNum: number) => Promise<void>;
  isSplitPaid: (billId: string, paycheckNum: number) => boolean;
  refreshPayments: () => Promise<void>;

  // Income sources
  incomeSources: IncomeSource[];
  incomeLoading: boolean;
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
  fetchSpendingBudgets: () => Promise<void>;
  fetchSpendingSummary: () => Promise<void>;
  fetchAvailableNumber: () => Promise<void>;
  fetchCreditCards: () => Promise<void>;

  // Quick expense
  logQuickExpense: (name: string, amount: number, category?: string) => Promise<void>;
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
  confirmDetectedBill: async () => {},
  confirmAsOneTime: async () => {},
  dismissDetectedBill: async () => {},
  linkDuplicateBill: async () => {},

  tier: 'free',
  isPro: false,
  isUltra: false,
  canSplit: () => false,
  maxForwardMonths: 1,

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
  fetchSpendingBudgets: async () => {},
  fetchSpendingSummary: async () => {},
  fetchAvailableNumber: async () => {},
  fetchCreditCards: async () => {},

  // Quick expense
  logQuickExpense: async () => {},
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
      setBills(billsArray.map((b: Record<string, unknown>) => mapApiBill(b)));
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
    } catch (error) {
      console.error('Failed to fetch income sources:', error);
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
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, [user]);

  // ── Fetch payments for current month (MATCHES MOBILE) ────
  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const now = new Date();
      const res = await billsAPI.getPayments(now.getFullYear(), now.getMonth() + 1);
      const paymentsArray = Array.isArray(res.data?.payments) ? res.data.payments : [];
      setBillPayments(paymentsArray.map((p: Record<string, unknown>) => ({
        id: String(p.id),
        billId: String(p.bill_id),
        periodMonth: Number(p.period_month),
        periodYear: Number(p.period_year),
        paidAt: String(p.paid_at || ''),
      })));
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
      setSpendingSummary(res.data?.categories || []);
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
      setAvailableNumber(res.data?.available?.availableNumber ?? null);
      setAvailableBreakdown(res.data?.available || null);
    } catch (err) {
      console.log('fetchAvailableNumber error:', (err as any)?.message);
    }
  }, [user]);

  // ── Fetch credit cards ───────────────────────────────────
  const fetchCreditCards = useCallback(async () => {
    if (!user) {
      setCreditCards([]);
      return;
    }
    try {
      const res = await billsAPI.getCreditCards();
      setCreditCards(res.data?.creditCards || []);
    } catch (err) {
      console.log('fetchCreditCards error:', (err as any)?.message);
    }
  }, [user]);

  // ── Log quick expense ────────────────────────────────────
  const logQuickExpense = useCallback(async (name: string, amount: number, category?: string) => {
    if (!user) return;
    try {
      await billsAPI.quickExpense({ name, amount, category });
      await Promise.all([fetchBills(), fetchAvailableNumber()]);
    } catch (err) {
      console.log('logQuickExpense error:', (err as any)?.message);
      throw err;
    }
  }, [user, fetchBills, fetchAvailableNumber]);

  // ── Initial fetch + sync user profile ─────────────────────
  useEffect(() => {
    if (!user) return;

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
        }
      } catch (err) {
        console.log('Login sync unavailable:', err);
      }

      // Fetch data
      await Promise.all([fetchBills(), fetchIncomeSources(), fetchCategories(), fetchPayments(), fetchRollover(), fetchSideIncome(), fetchSpendingBudgets(), fetchSpendingSummary(), fetchAvailableNumber(), fetchCreditCards()]);
    }

    syncAndFetch();
  }, [user, fetchBills, fetchIncomeSources, fetchCategories, fetchPayments, fetchRollover, fetchSideIncome]);

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
    };
    const res = await billsAPI.create(apiData);
    const bill = mapApiBill(res.data?.bill || res.data);
    setBills(prev => [...prev, bill]);

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

    return bill;
  };

  const deleteBill = async (id: string) => {
    await billsAPI.delete(id);
    setBills(prev => prev.filter((b) => b.id !== id));
  };

  const getBill = (id: string) => bills.find((b) => b.id === id);

  // ── Payment operations (MATCHES MOBILE) ──────────────────
  const isBillPaid = (billId: string): boolean => {
    return billPayments.some((p) => p.billId === billId);
  };

  const markBillPaid = async (billId: string) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    // Optimistic
    const tempPayment: BillPayment = {
      id: Date.now().toString(),
      billId,
      periodMonth: month,
      periodYear: year,
      paidAt: now.toISOString(),
    };
    setBillPayments(prev => [...prev, tempPayment]);
    try {
      const response = await billsAPI.markPaid({ billId, periodMonth: month, periodYear: year });
      const created = response.data?.payment;
      if (created) {
        setBillPayments(prev =>
          prev.map(p => p.id === tempPayment.id ? { ...tempPayment, id: created.id } : p)
        );
      }
    } catch (err) {
      console.log('markBillPaid API failed:', err);
    }
  };

  const unmarkBillPaid = async (billId: string) => {
    const payments = billPayments.filter(p => p.billId === billId);
    if (payments.length === 0) return;
    // Optimistic: remove all payments for this bill
    setBillPayments(prev => prev.filter(p => p.billId !== billId));
    try {
      for (const payment of payments) {
        await billsAPI.unmarkPaid(payment.id);
      }
    } catch (err) {
      console.log('unmarkBillPaid API failed:', err);
      setBillPayments(prev => [...prev, ...payments]); // rollback
    }
  };

  // Per-split paid tracking (MATCHES MOBILE)
  const isSplitPaid = (billId: string, paycheckNum: number): boolean => {
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.isSplit) return isBillPaid(billId);
    if (paycheckNum === 1) return bill.p1done;
    if (paycheckNum === 2) return bill.p2done;
    if (paycheckNum === 3) return bill.p3done;
    if (paycheckNum === 4) return bill.p4done;
    return false;
  };

  const toggleSplitPaid = async (billId: string, paycheckNum: number) => {
    if (paycheckNum < 1 || paycheckNum > 4) return;
    const bill = bills.find(b => b.id === billId);
    if (!bill || !bill.isSplit) {
      // Non-split: toggle global paid state
      if (isBillPaid(billId)) await unmarkBillPaid(billId);
      else await markBillPaid(billId);
      return;
    }

    // Split bill: toggle the specific paycheck's done state
    const splitIndex = paycheckNum - 1;
    const splitId = bill.splitIds[splitIndex];
    if (!splitId) {
      console.log(`[toggleSplitPaid] No splitId for bill ${billId} paycheck ${paycheckNum}`);
      return;
    }

    const doneKey = `p${paycheckNum}done` as keyof Bill;
    const currentlyDone = bill[doneKey] as boolean;

    // Optimistic update
    setBills(prev => prev.map(b =>
      b.id === billId ? { ...b, [doneKey]: !currentlyDone } : b
    ));

    try {
      if (currentlyDone) {
        await billsAPI.unmarkSaved(splitId);
      } else {
        await billsAPI.markSaved(splitId);
      }
    } catch (err) {
      console.log('toggleSplitPaid API failed:', err);
      // Rollback
      setBills(prev => prev.map(b =>
        b.id === billId ? { ...b, [doneKey]: currentlyDone } : b
      ));
    }
  };

  const refreshPayments = async () => { await fetchPayments(); };
  const refreshBills = async () => { await fetchBills(); };
  const refreshIncomeSources = async () => { await fetchIncomeSources(); };
  const refreshCategories = async () => { await fetchCategories(); };

  // ── Detected bills (computed from bills state) ──────────
  const detectedBills = bills.filter(b => b.status === 'detected');
  const detectedCount = detectedBills.length;

  const confirmDetectedBill = async (billId: string, overrides?: Record<string, unknown>) => {
    try {
      await billsAPI.confirmDetected(billId, overrides || {});
      await refreshBills();
    } catch (err) {
      console.log('confirmDetectedBill failed:', (err as Error)?.message);
    }
  };

  const confirmAsOneTime = async (billId: string) => {
    try {
      await billsAPI.confirmDetected(billId, { oneTime: true });
      await refreshBills();
      await refreshPayments();
    } catch (err) {
      console.log('confirmAsOneTime failed:', (err as Error)?.message);
    }
  };

  const dismissDetectedBill = async (billId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    try {
      await billsAPI.dismissDetected(billId);
    } catch (err) {
      console.log('dismissDetectedBill failed:', (err as Error)?.message);
      await refreshBills();
    }
  };

  const linkDuplicateBill = async (billId: string, targetBillId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    try {
      await billsAPI.linkDuplicate(billId, targetBillId);
    } catch (err) {
      console.log('linkDuplicateBill failed:', (err as Error)?.message);
      await refreshBills();
    }
  };

  // ── Income source CRUD ────────────────────────────────────
  const addIncomeSource = async (data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.addIncomeSource(data);
    const source = mapIncomeSource(res.data?.incomeSource || res.data?.income_source || res.data);
    setIncomeSources(prev => [...prev, source]);
    return source;
  };

  const updateIncomeSource = async (id: string, data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.updateIncomeSource(id, data);
    const source = mapIncomeSource(res.data?.incomeSource || res.data?.income_source || res.data);
    setIncomeSources(prev => prev.map((s) => (s.id === id ? source : s)));
    return source;
  };

  const deleteIncomeSource = async (id: string) => {
    const wasPrimary = incomeSources.find(s => s.id === id)?.isPrimary;
    await usersAPI.deleteIncomeSource(id);
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

        userName,
        userInitials,

        spendingBudgets,
        spendingSummary,
        availableNumber,
        availableBreakdown,
        creditCards,
        fetchSpendingBudgets,
        fetchSpendingSummary,
        fetchAvailableNumber,
        fetchCreditCards,

        logQuickExpense,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
