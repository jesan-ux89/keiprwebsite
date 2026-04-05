'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { billsAPI, usersAPI } from '../lib/api';
import { useAuth } from './AuthContext';

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
  splitIds: string[];
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'biweekly' | 'weekly' | 'twicemonthly' | 'monthly';
  nextPayDate: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  paycheckNum: number;
  isPaid: boolean;
  paidAt?: string;
}

type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'MXN' | 'JPY';

interface AppContextType {
  bills: Bill[];
  billsLoading: boolean;
  refreshBills: () => Promise<void>;
  addBill: (data: Record<string, unknown>) => Promise<Bill>;
  updateBill: (id: string, data: Record<string, unknown>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  getBill: (id: string) => Bill | undefined;

  billPayments: BillPayment[];
  paymentsLoading: boolean;
  markBillPaid: (billId: string, paycheckNum: number) => Promise<void>;
  unmarkBillPaid: (paymentId: string) => Promise<void>;
  isBillPaid: (billId: string, paycheckNum: number) => boolean;
  refreshPayments: () => Promise<void>;

  incomeSources: IncomeSource[];
  incomeLoading: boolean;
  refreshIncomeSources: () => Promise<void>;
  addIncomeSource: (data: Record<string, unknown>) => Promise<IncomeSource>;
  updateIncomeSource: (id: string, data: Record<string, unknown>) => Promise<IncomeSource>;
  deleteIncomeSource: (id: string) => Promise<void>;

  currency: Currency;
  setCurrency: (currency: Currency) => void;
  fmt: (amount: number) => string;
}

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'MXN', 'JPY'];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  MXN: 'Mex$',
  JPY: '¥',
};

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
  refreshPayments: async () => {},

  incomeSources: [],
  incomeLoading: false,
  refreshIncomeSources: async () => {},
  addIncomeSource: async () => ({} as IncomeSource),
  updateIncomeSource: async () => ({} as IncomeSource),
  deleteIncomeSource: async () => {},

  currency: 'USD',
  setCurrency: () => {},
  fmt: () => '',
});

// Convert snake_case from API to camelCase
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const camelObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = value;
  }
  return camelObj;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [bills, setBills] = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);

  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);

  const [currency, setCurrency] = useState<Currency>('USD');

  // Format money with currency symbol
  const fmt = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Fetch bills
  const refreshBills = async () => {
    if (!user) return;
    setBillsLoading(true);
    try {
      const res = await billsAPI.getAll();
      const billsArray = Array.isArray(res.data?.bills) ? res.data.bills : [];
      setBills(billsArray.map((b: Record<string, unknown>) => snakeToCamel(b) as unknown as Bill));
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setBillsLoading(false);
    }
  };

  // Fetch income sources
  const refreshIncomeSources = async () => {
    if (!user) return;
    setIncomeLoading(true);
    try {
      const res = await usersAPI.getIncomeSources();
      const sourcesArray = Array.isArray(res.data?.income_sources) ? res.data.income_sources : [];
      setIncomeSources(sourcesArray.map((s: Record<string, unknown>) => snakeToCamel(s) as unknown as IncomeSource));
    } catch (error) {
      console.error('Failed to fetch income sources:', error);
    } finally {
      setIncomeLoading(false);
    }
  };

  // Fetch payments (for current month)
  const refreshPayments = async () => {
    if (!user) return;
    setPaymentsLoading(true);
    try {
      const now = new Date();
      const res = await billsAPI.getPayments(now.getFullYear(), now.getMonth() + 1);
      const paymentsArray = Array.isArray(res.data?.payments) ? res.data.payments : [];
      setBillPayments(paymentsArray.map((p: Record<string, unknown>) => snakeToCamel(p) as unknown as BillPayment));
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user) {
      refreshBills();
      refreshIncomeSources();
      refreshPayments();
    }
  }, [user]);

  // Bill operations
  const addBill = async (data: Record<string, unknown>): Promise<Bill> => {
    const res = await billsAPI.create(data);
    const bill = snakeToCamel(res.data?.bill || res.data) as unknown as Bill;
    setBills([...bills, bill]);
    return bill;
  };

  const updateBill = async (id: string, data: Record<string, unknown>): Promise<Bill> => {
    const res = await billsAPI.update(id, data);
    const bill = snakeToCamel(res.data?.bill || res.data) as unknown as Bill;
    setBills(bills.map((b) => (b.id === id ? bill : b)));
    return bill;
  };

  const deleteBill = async (id: string) => {
    await billsAPI.delete(id);
    setBills(bills.filter((b) => b.id !== id));
  };

  const getBill = (id: string) => bills.find((b) => b.id === id);

  // Payment operations
  const isBillPaid = (billId: string, paycheckNum: number): boolean => {
    return billPayments.some((p) => p.billId === billId && p.paycheckNum === paycheckNum && p.isPaid);
  };

  const markBillPaid = async (billId: string, paycheckNum: number) => {
    const res = await billsAPI.markPaid({ billId, paycheckNum });
    const payment = snakeToCamel(res.data?.payment || res.data) as unknown as BillPayment;
    setBillPayments([...billPayments, payment]);
  };

  const unmarkBillPaid = async (paymentId: string) => {
    await billsAPI.unmarkPaid(paymentId);
    setBillPayments(billPayments.filter((p) => p.id !== paymentId));
  };

  // Income source operations
  const addIncomeSource = async (data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.addIncomeSource(data);
    const source = snakeToCamel(res.data?.income_source || res.data) as unknown as IncomeSource;
    setIncomeSources([...incomeSources, source]);
    return source;
  };

  const updateIncomeSource = async (id: string, data: Record<string, unknown>): Promise<IncomeSource> => {
    const res = await usersAPI.updateIncomeSource(id, data);
    const source = snakeToCamel(res.data?.income_source || res.data) as unknown as IncomeSource;
    setIncomeSources(incomeSources.map((s) => (s.id === id ? source : s)));
    return source;
  };

  const deleteIncomeSource = async (id: string) => {
    await usersAPI.deleteIncomeSource(id);
    setIncomeSources(incomeSources.filter((s) => s.id !== id));
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

        billPayments,
        paymentsLoading,
        markBillPaid,
        unmarkBillPaid,
        isBillPaid,
        refreshPayments,

        incomeSources,
        incomeLoading,
        refreshIncomeSources,
        addIncomeSource,
        updateIncomeSource,
        deleteIncomeSource,

        currency,
        setCurrency,
        fmt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
