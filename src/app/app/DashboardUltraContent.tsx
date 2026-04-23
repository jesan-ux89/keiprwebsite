'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getPayPeriods, isBillInPeriod, billBelongsToPaycheck } from '@/lib/payPeriods';
import { usersAPI, bankingAPI } from '@/lib/api';
import type { Bill } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CategoryIcon from '@/components/CategoryIcon';
import MerchantLogo from '@/components/MerchantLogo';
import { CATEGORY_COLORS } from '@/lib/categoryIcons';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';

/**
 * DashboardUltraContent — Ultra tier dashboard
 * Tabs: Overview, This Check, Next Check
 * Includes: Available Number hero, spending velocity, quick stats, upcoming expenses,
 * recent activity, category summary, detected alert, pending confirmations alert
 */

type ViewMode = 'overview' | 'paycheck' | 'nextcheck';

export default function DashboardUltraContent() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    bills, billsLoading, refreshBills, refreshIncomeSources, refreshPayments, refreshCategories,
    incomeSources, categories, fmt, isBillPaid, isSplitPaid, markBillPaid, toggleSplitPaid, userName, userInitials,
    currentRollover, decideRollover,
    sideIncomeSummary, sideIncomeAllocations, allocateSideIncome, removeAllocation,
    isPro, isUltra, detectedBills, detectedCount, pendingConfirmationsCount,
    availableNumber, availableBreakdown, spendingSummary, spendingBudgets, fetchAvailableNumber, fetchSpendingSummary,
    logQuickExpense,
    deleteBill,
    budgetSuggestions, fetchBudgetSuggestions,
  } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSide, setExpandedSide] = useState<Record<string, boolean>>({});

  // Quick expense modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Undo snackbar state (quick expense)
  const [undoSnackbar, setUndoSnackbar] = useState<{ billId: string; name: string; amount: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissUndo = useCallback(() => {
    setUndoSnackbar(null);
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
  }, []);

  const handleUndo = useCallback(async () => {
    if (!undoSnackbar) return;
    const { billId } = undoSnackbar;
    dismissUndo();
    try {
      await deleteBill(billId);
    } catch (err) {
      console.error('Undo quick expense failed:', err);
    }
  }, [undoSnackbar, dismissUndo, deleteBill]);

  // Ultra: Recent transactions
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    bankingAPI.getAllTransactions({ limit: 5, sort: 'date_desc' })
      .then((res: any) => setRecentTransactions(res.data?.transactions || []))
      .catch(() => {});
  }, []);

  // ── Derive paycheck from income sources (MATCHES MOBILE) ──
  const regularIncome = incomeSources.filter((s: any) => !s.isOneTime);
  const primaryIncome = regularIncome.find((s: any) => s.isPrimary) || (regularIncome.length > 0 ? regularIncome[0] : null);
  const secondaryIncome = regularIncome.filter((s: any) => s.id !== primaryIncome?.id);
  const totalPaycheck = regularIncome.reduce((sum: number, s: any) => sum + (s.typicalAmount || 0), 0);
  const incomeName = primaryIncome ? primaryIncome.name : 'No income set';

  // ── Smart pay period calculation (MATCHES MOBILE) ──────────
  const freq = primaryIncome?.frequency || '';
  const payPeriods = getPayPeriods(primaryIncome?.nextPayDate, freq);
  const { current: currentPeriod, next: nextPeriod, isTwiceMonthly, periodsPerMonth } = payPeriods;
  const paycheckCount = periodsPerMonth;

  const paydayDate = currentPeriod?.start || new Date();
  const monthShort = paydayDate.toLocaleString('default', { month: 'short' });
  const dayOfMonth = paydayDate.getDate();
  const currentPaycheckNum = currentPeriod?.paycheckNumber ?? 1;
  const nextPaycheckNum = nextPeriod?.paycheckNumber ?? 2;

  // ── billAmountForPaycheck (MATCHES MOBILE) ─────────────────
  function billAmountForPaycheck(b: Bill, paycheck: number = currentPeriod?.paycheckNumber ?? 1): number {
    if (b.isSplit) {
      if (paycheck === 1) return b.p1 || 0;
      if (paycheck === 2) return b.p2 || 0;
      if (paycheck === 3) return b.p3 || 0;
      if (paycheck === 4) return b.p4 || 0;
      return b.p1 || 0;
    }
    return b.total || 0;
  }

  // ── Filter bills by pay period (MATCHES MOBILE) ────────────
  function occurrenceInPeriod(dueDay: number, period: { start: Date; end: Date }) {
    const start = period.start instanceof Date ? period.start : new Date(period.start);
    const end = period.end instanceof Date ? period.end : new Date(period.end);
    const d1 = new Date(start.getFullYear(), start.getMonth(), dueDay);
    if (d1 >= start && d1 <= end) return d1;
    const d2 = new Date(end.getFullYear(), end.getMonth(), dueDay);
    if (d2 >= start && d2 <= end) return d2;
    return start;
  }
  function sortByOccurrence(list: any[], period: { start: Date; end: Date }) {
    return [...list].sort((a, b) => {
      const da = occurrenceInPeriod(a.dueDay || 1, period).getTime();
      const db = occurrenceInPeriod(b.dueDay || 1, period).getTime();
      return da - db;
    });
  }

  const thisPaycheckBills = isTwiceMonthly
    ? sortByOccurrence(bills.filter(b => billBelongsToPaycheck(b, currentPeriod)), currentPeriod)
    : sortByOccurrence(bills, currentPeriod);

  const nextPaycheckBills = isTwiceMonthly
    ? sortByOccurrence(bills.filter(b => billBelongsToPaycheck(b, nextPeriod)), nextPeriod)
    : [];

  // ── Monthly totals (excluding CC-paid to avoid double-counting) ─────────────────────
  const directBills = bills.filter((b: any) => !b.paidWith);
  const totalBillsMonthly = directBills.reduce((s, b) => s + (b.total || 0), 0);
  const totalCCBillsMonthly = bills.filter((b: any) => !!b.paidWith).reduce((s, b) => s + (b.total || 0), 0);
  const totalSpentMonthly = bills.reduce((s, b) => s + (b.funded || 0), 0);

  // ── This paycheck calculations (MATCHES MOBILE) ────────────
  const directBillsThisCheck = thisPaycheckBills.filter((b: any) => !b.paidWith);
  const ccBillsThisCheck = thisPaycheckBills.filter((b: any) => !!b.paidWith);
  const totalBillsThisCheck = directBillsThisCheck.reduce((s, b) => s + billAmountForPaycheck(b, currentPaycheckNum), 0);
  const totalCCBillsThisCheck = ccBillsThisCheck.reduce((s, b) => s + billAmountForPaycheck(b, currentPaycheckNum), 0);
  const totalSpendingBudgetsAmount = (spendingBudgets || []).reduce((s: number, b: any) => s + (b.budget_amount || 0), 0);
  const totalAllBillsThisCheck = totalBillsThisCheck + totalCCBillsThisCheck;
  const remaining = (totalPaycheck || 0) - totalAllBillsThisCheck - totalSpendingBudgetsAmount;
  const spentPct = totalPaycheck > 0 ? Math.round((totalBillsThisCheck / totalPaycheck) * 100) : 0;

  const directNextBills = nextPaycheckBills.filter((b: any) => !b.paidWith);
  const nextBillsTotal = directNextBills.reduce((s, b) => s + billAmountForPaycheck(b, nextPaycheckNum), 0);
  const nextCCBillsTotal = nextPaycheckBills.filter((b: any) => !!b.paidWith).reduce((s, b) => s + billAmountForPaycheck(b, nextPaycheckNum), 0);
  const nextRemaining = (totalPaycheck || 0) - nextBillsTotal - nextCCBillsTotal;

  // ── Rollover bonus (MATCHES MOBILE) ──────────────────────────
  const rolloverBonus = (currentRollover?.action === 'rolled_over' && currentRollover.rolloverAmount > 0) ? currentRollover.rolloverAmount : 0;

  // ── Monthly income (MATCHES MOBILE) ─────────────────────────
  const monthlyIncome = totalPaycheck * paycheckCount + rolloverBonus;
  const monthlyRemaining = monthlyIncome - totalBillsMonthly;

  // ── Category allocations (MATCHES MOBILE) ──────────────────
  const allCategoryNames = Array.from(new Set([
    ...categories.map(c => c.name),
    ...bills.map(b => b.category || 'Other'),
  ]));
  const allocations = allCategoryNames.map(catName => {
    const dbCat = categories.find(c => c.name === catName);
    const color = dbCat?.color || CATEGORY_COLORS[catName] || '#6B7280';
    const catBillsThisCheck = thisPaycheckBills.filter(b => b.category === catName);
    const amt = catBillsThisCheck.reduce((s, b) => s + billAmountForPaycheck(b), 0);
    const catBillsAll = bills.filter(b => b.category === catName);
    const amtMonthly = catBillsAll.reduce((s, b) => s + (b.total || 0), 0);
    const spent = catBillsAll.reduce((s, b) => s + (b.funded || 0), 0);
    return { name: catName, color, amt, amtMonthly, spent };
  }).filter(a => a.amtMonthly > 0);

  // ── Spending velocity (Ultra Overview) ────────────────────
  const now = new Date();
  const daysIntoPeriod = (() => {
    if (!currentPeriod?.start) return 1;
    const diffMs = now.getTime() - currentPeriod.start.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  })();
  const totalPeriodDays = (() => {
    if (!currentPeriod?.start || !currentPeriod?.end) return 14;
    const diffMs = currentPeriod.end.getTime() - currentPeriod.start.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  })();
  const totalSpendingThisPeriod = availableBreakdown?.totalSpending || 0;
  const spendingPerDay = daysIntoPeriod > 0 ? totalSpendingThisPeriod / daysIntoPeriod : 0;
  const projectedSpending = spendingPerDay * totalPeriodDays;
  const daysRemaining = Math.max(0, totalPeriodDays - daysIntoPeriod);

  // Upcoming bills
  const todayDay = now.getDate();
  const upcomingBills = (() => {
    const thisCheckUpcoming = thisPaycheckBills
      .filter(b => !b.isQuickExpense && (b.dueDay || 1) >= todayDay && !isBillPaid(b.id) && (!b.isSplit || !isSplitPaid(b.id, currentPaycheckNum)));
    const nextCheckUpcoming = nextPaycheckBills
      .filter(b => !b.isQuickExpense && !isBillPaid(b.id) && (!b.isSplit || !isSplitPaid(b.id, nextPaycheckNum)));
    const seenIds = new Set(thisCheckUpcoming.map(b => b.id));
    const dedupedNext = nextCheckUpcoming.filter(b => !seenIds.has(b.id));
    return [...thisCheckUpcoming, ...dedupedNext]
      .sort((a, b) => {
        const aInThis = thisCheckUpcoming.includes(a);
        const bInThis = thisCheckUpcoming.includes(b);
        if (aInThis && !bInThis) return -1;
        if (!aInThis && bInThis) return 1;
        return (a.dueDay || 1) - (b.dueDay || 1);
      })
      .slice(0, 5);
  })();

  // ── Side income helpers (MATCHES MOBILE) ────────────────────
  const oneTimeFunds = incomeSources.filter((s: any) => s.isOneTime);
  const oneTimeFundIds = new Set(oneTimeFunds.map((f: any) => f.id));

  function getSideIncomeForPaycheck(paycheckNum: number) {
    return sideIncomeSummary.filter(src => !oneTimeFundIds.has(src.incomeSourceId)).map(src => {
      const pData = src.byPaycheck[paycheckNum] || { allocated: 0, toSavings: 0, toBills: 0 };
      let carry = 0;
      for (let pn = 1; pn < paycheckNum; pn++) {
        const prev = src.byPaycheck[pn] || { allocated: 0, toSavings: 0, toBills: 0 };
        carry += (src.amount - prev.allocated);
      }
      const available = src.amount + Math.max(0, carry) - pData.allocated;
      return { ...src, allocated: pData.allocated, toSavings: pData.toSavings, toBills: pData.toBills, available, carry: Math.max(0, carry) };
    });
  }

  const [sideActionLoading, setSideActionLoading] = useState<string | null>(null);
  const [sideActionError, setSideActionError] = useState<string | null>(null);
  const [sidePickBill, setSidePickBill] = useState<string | null>(null);

  function getUnpaidBillsForPaycheck(paycheckNum: number, available: number) {
    return bills.filter(b => {
      const amt = billAmountForPaycheck(b, paycheckNum);
      if (amt <= 0 || amt > available) return false;
      if (b.isSplit) return !isSplitPaid(b.id, paycheckNum);
      return !isBillPaid(b.id);
    });
  }

  async function handleAllocateToSavings(sourceId: string, available: number, paycheckNum: number, loadingKey?: string) {
    const key = loadingKey || sourceId;
    setSideActionLoading(key);
    setSideActionError(null);
    try {
      await allocateSideIncome({ incomeSourceId: sourceId, paycheckNumber: paycheckNum, action: 'savings', amount: available });
      setSideActionLoading(null);
    } catch (err: any) {
      setSideActionLoading(null);
      setSideActionError(err?.response?.data?.error || err?.message || 'Failed to move to savings');
    }
  }

  async function handleAllocateToBill(sourceId: string, available: number, paycheckNum: number, billId: string, loadingKey?: string) {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    const amt = billAmountForPaycheck(bill, paycheckNum);
    const key = loadingKey || sourceId;
    setSidePickBill(null);
    setSideActionLoading(key);
    setSideActionError(null);
    try {
      await allocateSideIncome({ incomeSourceId: sourceId, paycheckNumber: paycheckNum, action: 'bill', amount: amt, billId: bill.id });
      if (bill.isSplit) {
        if (!isSplitPaid(billId, paycheckNum)) {
          await toggleSplitPaid(billId, paycheckNum);
        }
      } else {
        if (!isBillPaid(billId)) {
          await markBillPaid(billId);
        }
      }
      setSideActionLoading(null);
    } catch (err: any) {
      setSideActionLoading(null);
      setSideActionError(err?.response?.data?.error || err?.message || 'Failed to apply to bill');
    }
  }

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const [fundAllocMap, setFundAllocMap] = useState<Record<string, any[]>>({});
  useEffect(() => {
    if (oneTimeFunds.length === 0) return;
    oneTimeFunds.forEach((fund: any) => {
      usersAPI.getFundAllocations(fund.id)
        .then(res => {
          setFundAllocMap(prev => ({ ...prev, [fund.id]: res.data?.allocations || [] }));
        })
        .catch(() => {});
    });
  }, [incomeSources]);

  const monthName = now.toLocaleString('default', { month: 'long' });
  const hour = now.getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userName ? userName.split(' ')[0] : (user?.email?.split('@')[0] || 'there');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBills(), refreshIncomeSources(), refreshPayments(), refreshCategories(), fetchBudgetSuggestions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogExpense = async () => {
    if (!expenseName.trim() || !expenseAmount.trim()) return;
    const savedName = expenseName.trim();
    const savedAmount = parseFloat(expenseAmount);
    setExpenseSaving(true);
    try {
      const billId = await logQuickExpense(savedName, savedAmount, expenseCategory || undefined);
      setExpenseName('');
      setExpenseAmount('');
      setExpenseCategory('');
      setExpenseModalOpen(false);

      // Show undo snackbar for 30 seconds
      if (billId) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setUndoSnackbar({ billId, name: savedName, amount: savedAmount });
        undoTimerRef.current = setTimeout(() => setUndoSnackbar(null), 30000);
      }
    } catch (err) {
      console.error('Log expense failed:', err);
    } finally {
      setExpenseSaving(false);
    }
  };

  const isLoading = billsLoading;

  // ── Summary Panel (Right Sidebar) ──────────────────────────
  const SummaryPanel = () => {
    const dayOfPayPeriod = daysIntoPeriod;
    const paycheckProgressPct = Math.min(100, (dayOfPayPeriod / totalPeriodDays) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Available Number */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: (availableNumber !== null ? availableNumber : remaining) >= 0 ? colors.text : '#EF4444', margin: '0 0 0.25rem 0' }}>
            {fmt(availableNumber !== null ? availableNumber : remaining)}
          </p>
          <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>
            Available this paycheck
          </p>
        </div>

        {/* Income / Bills / Spent Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <a href="/app/income" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0A7B6C' }} />
            <span style={{ fontSize: '0.875rem', color: colors.textMuted, flex: 1 }}>Income</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(availableBreakdown?.depositsThisPeriod ? availableBreakdown.depositsThisPeriod : totalPaycheck)}</span>
          </a>
          <a href="/app/bills" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <span style={{ fontSize: '0.875rem', color: colors.textMuted, flex: 1 }}>Expenses</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(totalBillsThisCheck)}</span>
          </a>
          {totalCCBillsThisCheck > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingLeft: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: colors.textMuted, flex: 1 }}>└ 💳 On credit cards</span>
              <span style={{ fontSize: '0.85rem', color: colors.textMuted }}>{fmt(totalCCBillsThisCheck)}</span>
            </div>
          )}
          <a href="/app/banking/transactions" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
            <span style={{ fontSize: '0.875rem', color: colors.textMuted, flex: 1 }}>Spent</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(totalSpendingThisPeriod)}</span>
          </a>
        </div>

        <div style={{ height: '1px', backgroundColor: colors.divider }} />

        {/* Paycheck Progress */}
        {currentPeriod && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>Paycheck progress</span>
              <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>Day {dayOfPayPeriod} of {totalPeriodDays}</span>
            </div>
            <div style={{
              height: '8px',
              backgroundColor: colors.progressTrack,
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${paycheckProgressPct}%`,
                backgroundColor: colors.electric,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        <div style={{ height: '1px', backgroundColor: colors.divider }} />

        {/* Top Spending Categories */}
        {allocations.length > 0 && (
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: '0 0 0.75rem 0' }}>Top spending</p>
            {allocations.slice(0, 5).map((cat, idx) => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: idx < Math.min(5, allocations.length) - 1 ? '0.5rem' : 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }} />
                <span style={{ fontSize: '0.8rem', color: colors.textMuted, flex: 1 }}>{cat.name}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.text }}>{fmt(cat.amtMonthly)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout pageTitle="Dashboard" showMonthNav={true} topBarActions={<button onClick={() => setExpenseModalOpen(true)} style={{ padding: '0.4rem 0.75rem', backgroundColor: colors.electric, color: '#0c1117', border: `1px solid ${colors.electric}`, borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>+ Add expense</button>}>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <TwoColumnLayout sidebar={<SummaryPanel />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Rollover Prompt */}
            {currentRollover && currentRollover.action === 'pending' && currentRollover.previousLeftover > 0 && (
              <div style={{
                backgroundColor: 'rgba(56,189,248,0.08)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                border: '0.5px solid rgba(56,189,248,0.2)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38BDF8', margin: '0 0 0.25rem 0' }}>
                  Leftover from last month
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text, margin: '0 0 0.5rem 0' }}>
                  {fmt(currentRollover.previousLeftover)}
                </p>
                <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                  You had money left over. Would you like to carry it into this month or start fresh?
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    onClick={() => decideRollover('rolled_over')}
                    style={{
                      flex: 1,
                      maxWidth: '200px',
                      backgroundColor: '#0C4A6E',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.625rem',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Roll over
                  </button>
                  <button
                    onClick={() => decideRollover('fresh_start')}
                    style={{
                      flex: 1,
                      maxWidth: '200px',
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      border: `0.5px solid ${colors.cardBorder}`,
                      borderRadius: '0.625rem',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            )}

            {/* Rolled Over Banner */}
            {currentRollover && currentRollover.action === 'rolled_over' && currentRollover.rolloverAmount > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(56,189,248,0.06)',
                borderRadius: '0.625rem',
                padding: '0.75rem',
                border: '0.5px solid rgba(56,189,248,0.12)',
              }}>
                <span style={{ fontSize: '0.875rem' }}>&#8617;&#65039;</span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#38BDF8' }}>
                  <span style={{ fontWeight: 600 }}>{fmt(currentRollover.rolloverAmount)}</span> rolled over from last month
                </p>
              </div>
            )}

            {/* Detected Transactions Alert */}
            {detectedCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                backgroundColor: colors.card, borderRadius: '0.75rem',
                padding: '0.875rem 1.25rem',
                border: `1px solid ${colors.cardBorder}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: '#0A7B6C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
                }}>!</div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text, flex: 1 }}>
                  <span style={{ fontWeight: 600, color: '#0A7B6C' }}>{detectedCount} new recurring expense{detectedCount !== 1 ? 's' : ''}</span>
                  {' '}detected from your bank transactions
                </p>
                <a
                  href="/app/bills?showDetected=true"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.text,
                    color: colors.background,
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    flexShrink: 0,
                  }}
                >
                  Review
                </a>
              </div>
            )}

            {/* Pending Confirmations Alert */}
            {pendingConfirmationsCount > 0 && (
              <a href="/app/banking/confirmations" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  backgroundColor: 'rgba(245,158,11,0.10)', borderRadius: '0.75rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: 'rgba(245,158,11,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>🏦</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
                      {pendingConfirmationsCount} bill {pendingConfirmationsCount === 1 ? 'match needs' : 'matches need'} your review
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: colors.textSub }}>
                      Confirm or reject suggested bank matches
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F59E0B' }}>Review →</span>
                </div>
              </a>
            )}

            {/* Hero Stats Row (3-column grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <Card style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Available</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: (availableNumber !== null ? availableNumber : remaining) >= 0 ? '#0A7B6C' : '#EF4444', margin: '0 0 0.25rem 0' }}>{fmt(availableNumber !== null ? availableNumber : remaining)}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 6px rgba(56,189,248,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', width: 80, fontVariantNumeric: 'tabular-nums' }}>
                      {availableBreakdown?.checkingBalance != null
                        ? fmt(availableBreakdown.checkingBalance)
                        : fmt(availableNumber !== null ? availableNumber : remaining)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      {availableBreakdown?.checkingBalance != null ? 'available in checking' : 'available to spend'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0A7B6C', boxShadow: '0 0 6px rgba(10,123,108,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A7B6C', width: 80, fontVariantNumeric: 'tabular-nums' }}>{fmt(remaining > 0 ? remaining : 0)}</span>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>available this check</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9a9589', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9a9589', width: 80, fontVariantNumeric: 'tabular-nums' }}>{fmt(nextRemaining > 0 ? nextRemaining : 0)}</span>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>available next check</span>
                  </div>
                </div>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Income</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: '0 0 0.25rem 0' }}>{fmt(availableBreakdown?.depositsThisPeriod ? availableBreakdown.depositsThisPeriod : totalPaycheck)}</p>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>{availableBreakdown?.depositsThisPeriod ? 'Bank deposits this period' : `${paycheckCount} paycheck${paycheckCount > 1 ? 's' : ''} this month`}</p>
              </Card>
              <Card style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Expenses</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.amber, margin: '0 0 0.25rem 0' }}>{fmt(totalBillsThisCheck)}</p>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>
                  {totalCCBillsThisCheck > 0
                    ? `+ ${fmt(totalCCBillsThisCheck)} on cards`
                    : `${spentPct}% of paycheck`}
                </p>
              </Card>
            </div>

            {/* Spending Pace Card */}
            {(() => {
              const paceTarget = (availableBreakdown?.paycheckIncome || totalPaycheck) * 0.6;
              const overTarget = totalSpendingThisPeriod > paceTarget && paceTarget > 0;
              const pct = paceTarget > 0 ? Math.round((totalSpendingThisPeriod / paceTarget - 1) * 100) : 0;
              const statusText = paceTarget === 0 ? '' : overTarget ? `↑ ${pct}% over target` : pct < 0 ? `↓ ${Math.abs(pct)}% under target` : 'On target';
              const overColor = '#F97316';
              const underColor = '#0A7B6C';
              const barFillColor = '#38BDF8';
              const statusColor = overTarget ? overColor : underColor;
              const fillPct = paceTarget > 0 ? Math.min(100, (totalSpendingThisPeriod / paceTarget) * 100) : 0;
              return (
                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textMuted }}>Spending pace</span>
                    {!!statusText && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor }}>{statusText}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.text }}>{fmt(spendingPerDay)}</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.textMuted }}>/day</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '3px', overflow: 'hidden', marginBottom: '0.625rem' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      width: `${fillPct}%`,
                      backgroundColor: overTarget ? overColor : barFillColor,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.textMuted }}>
                    <span>{fmt(totalSpendingThisPeriod)} spent</span>
                    <span>Target {fmt(paceTarget)}</span>
                  </div>
                </Card>
              );
            })()}

            {/* Still Needed Before Payday */}
            {budgetSuggestions?.coverage?.status && budgetSuggestions.thisPaycheck?.length > 0 && (() => {
              const cov = budgetSuggestions.coverage;
              const totalNeeded = cov.totalSuggestedRemaining || 0;
              const statusColor = cov.status === 'tight' ? '#EF4444' : cov.status === 'on_track' ? '#F59E0B' : '#0A7B6C';
              const statusIcon = cov.status === 'tight' ? '⚠️' : cov.status === 'on_track' ? '📊' : '✅';
              const statusLabel = cov.status === 'tight' ? 'Spending ahead of pace' : cov.status === 'on_track' ? 'On track' : 'Looking good';
              const top3 = budgetSuggestions.thisPaycheck
                .filter((c: any) => c.remaining > 0)
                .slice(0, 3);
              return (
                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.textMuted }}>Still needed before payday</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>{statusIcon}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '1.75rem', fontWeight: 700, color: statusColor, letterSpacing: '-0.02em' }}>
                    {fmt(totalNeeded)}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0.875rem 0' }}>
                    {cov.daysUntilPayday} day{cov.daysUntilPayday !== 1 ? 's' : ''} left · {fmt(cov.totalSpent || 0)} of {fmt(cov.totalSuggested || 0)} spent
                  </p>
                  {top3.length > 0 && (
                    <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: '0.75rem' }}>
                      {top3.map((cat: any, idx: number) => (
                        <div key={cat.category} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          marginBottom: idx < top3.length - 1 ? '0.5rem' : 0,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CategoryIcon category={cat.category} size={22} isDark={isDark} />
                            <div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: colors.text }}>{cat.category}</span>
                              <p style={{ fontSize: '0.7rem', color: colors.textMuted, margin: '0.1rem 0 0 0' }}>
                                {fmt(cat.spent)} of {fmt(cat.suggested)} spent
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusColor }}>
                            {fmt(cat.remaining)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })()}

            {/* Upcoming Expenses Card */}
            {upcomingBills.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>Upcoming Expenses</h3>
                  <a href="/app/bills" style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.electric, textDecoration: 'none' }}>View all →</a>
                </div>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {upcomingBills.map((b, idx) => {
                    const today = new Date();
                    const dueDate = new Date(today.getFullYear(), today.getMonth(), b.dueDay || 1);
                    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isPaid = b.isSplit ? isSplitPaid(b.id, currentPaycheckNum) : isBillPaid(b.id);
                    const monthAbbr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    let badgeText = '';
                    let badgeBg = '';
                    let badgeColor = '';
                    if (isPaid) {
                      badgeText = 'Paid \u2713';
                      badgeBg = 'rgba(16,185,129,0.15)';
                      badgeColor = '#10B981';
                    } else if (daysUntil >= 0 && daysUntil <= 7) {
                      badgeText = daysUntil === 0 ? 'Due today' : `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
                      badgeBg = 'rgba(239,68,68,0.12)';
                      badgeColor = '#EF4444';
                    } else {
                      badgeText = 'Recurring';
                      badgeBg = `${colors.electric}1A`;
                      badgeColor = colors.electric;
                    }

                    return (
                      <a key={b.id} href={`/app/bills?edit=${b.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                          borderBottom: idx < upcomingBills.length - 1 ? `1px solid ${colors.divider}` : 'none',
                        }}>
                          <MerchantLogo billName={b.name} category={b.category || 'Other'} size={36} isDark={isDark} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: colors.text, margin: 0 }}>{b.name}</p>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.3rem' }}>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                                borderRadius: '4px', backgroundColor: badgeBg, color: badgeColor,
                              }}>{badgeText}</span>
                              <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{b.category || 'Other'}</span>
                              {!!(b as any).paidWith && (
                                <span style={{
                                  fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.35rem',
                                  borderRadius: '4px', backgroundColor: 'rgba(156,94,250,0.12)',
                                  border: '1px solid rgba(156,94,250,0.25)', color: '#9C5EFA',
                                }}>💳 CC</span>
                              )}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                              {fmt(billAmountForPaycheck(b, currentPaycheckNum))}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: colors.textMuted, margin: '0.15rem 0 0 0' }}>{monthAbbr}</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* Recent Activity Card */}
            {recentTransactions.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>Recent Activity</h3>
                  <a href="/app/banking/transactions" style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.electric, textDecoration: 'none' }}>All transactions →</a>
                </div>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  {recentTransactions.map((txn: any, idx: number) => (
                    <div key={txn.id || idx} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderBottom: idx < recentTransactions.length - 1 ? `1px solid ${colors.divider}` : 'none',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        backgroundColor: txn.amount < 0 ? 'rgba(239,68,68,0.10)' : 'rgba(16,185,129,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.85rem',
                      }}>
                        {txn.amount < 0 ? '↗' : '↙'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500, color: colors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {txn.merchant_name || txn.name || 'Transaction'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.15rem 0 0 0' }}>
                          {txn.transaction_date ? new Date(txn.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} · {txn.category || ''}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '0.95rem', fontWeight: 600,
                        color: txn.amount < 0 ? colors.text : '#0A7B6C',
                      }}>
                        {txn.amount < 0 ? '-' : '+'}{fmt(Math.abs(txn.amount))}
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Category Spending Summary */}
            {allocations.length > 0 && (
              <Card style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text, margin: '0 0 0.75rem 0' }}>This paycheck by category</p>
                {allocations.slice(0, 5).map((cat, i) => (
                  <div key={cat.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    marginBottom: i < Math.min(allocations.length, 5) - 1 ? '0.625rem' : 0,
                  }}>
                    <CategoryIcon category={cat.name} size={24} isDark={isDark} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, color: colors.text, margin: '0 0 0.25rem 0' }}>{cat.name}</p>
                      <div style={{ height: '3px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '2px',
                          width: `${Math.min(100, totalBillsThisCheck > 0 ? (cat.amt / totalBillsThisCheck) * 100 : 0)}%`,
                          backgroundColor: cat.color,
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>{fmt(cat.amt)}</span>
                  </div>
                ))}
              </Card>
            )}

            {/* View Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
            }}>
              {(['overview', 'paycheck', 'nextcheck'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: viewMode === mode ? 600 : 500,
                    color: viewMode === mode ? '#fff' : colors.textMuted,
                    backgroundColor: viewMode === mode ? colors.electric : 'transparent',
                    border: `1px solid ${viewMode === mode ? colors.electric : colors.cardBorder}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {mode === 'overview' ? 'Overview' : mode === 'paycheck' ? 'This Check' : 'Next Check'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {viewMode === 'overview' ? (
              /* Ultra Overview — content already rendered above (hero stats, pace, upcoming, recent, category) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Already rendered above */}
              </div>
            ) : viewMode === 'paycheck' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Card>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
                    This Paycheck — {currentPeriod?.label ?? ''}
                    {totalCCBillsThisCheck > 0 && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: colors.textMuted }}> ({fmt(totalCCBillsThisCheck)} on cards)</span>
                    )}
                  </h2>

                  {thisPaycheckBills.length === 0 ? (
                    <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: 0 }}>
                      No bills due this paycheck
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {thisPaycheckBills.map((bill) => {
                        const amt = billAmountForPaycheck(bill, currentPaycheckNum);
                        const isPaid = bill.isSplit
                          ? (() => {
                              const pNum = currentPaycheckNum;
                              if (pNum === 1) return bill.p1done;
                              if (pNum === 2) return bill.p2done;
                              if (pNum === 3) return bill.p3done;
                              if (pNum === 4) return bill.p4done;
                              return false;
                            })()
                          : isBillPaid(bill.id);

                        const fullBillPaid = isBillPaid(bill.id);
                        return (
                          <div key={bill.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: colors.background,
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${isPaid ? colors.green : colors.amber}`,
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                                  {bill.name}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>
                                    {bill.category}
                                    {bill.isSplit && ` · This check's portion`}
                                    {bill.isAutoPay && ' · AutoPay'}
                                  </span>
                                  {!!(bill as any).paidWith && (
                                    <span style={{
                                      fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                                      borderRadius: '4px', backgroundColor: 'rgba(156,94,250,0.12)',
                                      border: '1px solid rgba(156,94,250,0.25)', color: '#9C5EFA',
                                    }}>💳 CC</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                                <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                                  {fmt(amt)}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: isPaid ? colors.green : colors.textMuted, margin: '0.25rem 0 0 0' }}>
                                  {isPaid ? 'Paid' : `Due day ${bill.dueDay}`}
                                </p>
                              </div>
                              {!isPaid && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => toggleSplitPaid(bill.id, currentPaycheckNum)}
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>

                            {bill.isSplit && fullBillPaid && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.75rem 1rem',
                                  backgroundColor: isDark ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.04)',
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid rgba(34,197,94,0.4)`,
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: isDark ? '#86EFAC' : '#16A34A', margin: 0 }}>
                                    {bill.name} — Full Payment
                                  </p>
                                  <p style={{ fontSize: '0.75rem', color: isDark ? 'rgba(134,239,172,0.7)' : 'rgba(22,163,74,0.7)', margin: '0.2rem 0 0 0' }}>
                                    Paid from splits
                                  </p>
                                </div>
                                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: isDark ? '#86EFAC' : '#16A34A', margin: 0 }}>
                                  {fmt(bill.total)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {isTwiceMonthly && nextPaycheckBills.length > 0 && (
                  <Card>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
                      Next Check — {nextPeriod?.label ?? ''}
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                        {fmt(nextBillsTotal)} in bills{nextCCBillsTotal > 0 ? ` (${fmt(nextCCBillsTotal)} on cards)` : ''}
                      </span>
                      <span style={{ color: nextRemaining >= 0 ? colors.green : colors.red, fontSize: '0.875rem', fontWeight: 600 }}>
                        {fmt(nextRemaining)} remaining
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {nextPaycheckBills.map((bill) => {
                        const amt = billAmountForPaycheck(bill, nextPaycheckNum);
                        return (
                          <a
                            key={bill.id}
                            href={`/app/bills?edit=${bill.id}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.75rem',
                              backgroundColor: colors.background,
                              borderRadius: '0.375rem',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'opacity 0.15s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ color: colors.text, fontWeight: 500 }}>
                                {bill.name}{bill.isSplit ? ` · P${nextPaycheckNum}` : ''}
                              </span>
                              {!!(bill as any).paidWith && (
                                <span style={{
                                  fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.35rem',
                                  borderRadius: '4px', backgroundColor: 'rgba(156,94,250,0.12)',
                                  border: '1px solid rgba(156,94,250,0.25)', color: '#9C5EFA',
                                }}>💳 CC</span>
                              )}
                            </div>
                            <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(amt)}</span>
                          </a>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {secondaryIncome.length > 0 && getSideIncomeForPaycheck(currentPeriod.paycheckNumber as number).map(src => (
                  <div
                    key={src.incomeSourceId}
                    style={{
                      backgroundColor: 'rgba(56,189,248,0.05)',
                      borderRadius: '0.75rem',
                      border: '0.5px solid rgba(56,189,248,0.15)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setExpandedSide(prev => ({ ...prev, [src.incomeSourceId]: !prev[src.incomeSourceId] }))}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.875rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#38BDF8' }}>{src.name}</p>
                        <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: colors.textMuted }}>
                          {fmt(src.amount)} income{src.carry > 0 ? ` + ${fmt(src.carry)} carried over` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: colors.text }}>{fmt(src.available)}</p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: colors.textMuted }}>available</p>
                      </div>
                    </button>

                    {expandedSide[src.incomeSourceId] && (
                      <div style={{ padding: '0 0.875rem 0.875rem', borderTop: '0.5px solid rgba(56,189,248,0.1)' }}>
                        {sideIncomeAllocations
                          .filter(a => a.incomeSourceId === src.incomeSourceId && a.paycheckNumber === (currentPeriod.paycheckNumber as number))
                          .map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '0.5px solid rgba(56,189,248,0.08)' }}>
                              <span style={{ fontSize: '0.8rem' }}>{a.action === 'savings' ? '💰' : '📋'}</span>
                              <span style={{ flex: 1, fontSize: '0.8rem', color: colors.textMuted }}>
                                {a.action === 'savings' ? 'Moved to savings' : `Applied to ${a.billName || 'bill'}`}
                              </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text }}>{fmt(a.amount)}</span>
                              <button
                                onClick={() => removeAllocation(a.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#A32D2D', padding: '0 0.25rem' }}
                              >
                                Undo
                              </button>
                            </div>
                          ))}

                        {sideActionLoading === src.incomeSourceId ? (
                          <p style={{ fontSize: '0.8rem', color: '#38BDF8', textAlign: 'center', padding: '0.75rem 0', margin: 0 }}>Saving...</p>
                        ) : src.available > 0 ? (
                          <>
                            {sideActionError && (
                              <p style={{ fontSize: '0.75rem', color: '#A32D2D', textAlign: 'center', margin: '0 0 0.375rem 0' }}>{sideActionError}</p>
                            )}
                            {sidePickBill === src.incomeSourceId ? (
                              <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#38BDF8', margin: '0 0 0.375rem 0' }}>Choose a bill:</p>
                                {getUnpaidBillsForPaycheck(currentPeriod.paycheckNumber as number, src.available).map(b => {
                                  return (
                                    <button
                                      key={b.id}
                                      onClick={() => handleAllocateToBill(src.incomeSourceId, src.available, currentPeriod.paycheckNumber as number, b.id)}
                                      style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.12)',
                                        backgroundColor: 'rgba(56,189,248,0.06)', cursor: 'pointer', marginBottom: '0.25rem',
                                        fontSize: '0.8rem', color: colors.text,
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MerchantLogo billName={b.name} category={b.category} size={24} isDark={isDark} />
                                        <span>{b.name}</span>
                                      </div>
                                      <span style={{ fontWeight: 600, color: '#38BDF8' }}>{fmt(billAmountForPaycheck(b, currentPeriod.paycheckNumber as number))}</span>
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => setSidePickBill(null)}
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.7rem', color: colors.textMuted, padding: '0.5rem', width: '100%' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.625rem' }}>
                                <button
                                  onClick={() => handleAllocateToSavings(src.incomeSourceId, src.available, currentPeriod.paycheckNumber as number)}
                                  style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                                    padding: '0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.15)',
                                    backgroundColor: 'rgba(56,189,248,0.08)', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, color: '#38BDF8',
                                  }}
                                >
                                  💰 Move to savings
                                </button>
                                <button
                                  onClick={() => { setSideActionError(null); setSidePickBill(src.incomeSourceId); }}
                                  style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                                    padding: '0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.15)',
                                    backgroundColor: 'rgba(56,189,248,0.08)', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, color: '#38BDF8',
                                  }}
                                >
                                  📋 Apply to a bill
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#0A7B6C', textAlign: 'center', padding: '0.625rem 0', fontWeight: 500, margin: 0 }}>
                            Fully allocated for this paycheck
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* NEXT CHECK TAB */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {isTwiceMonthly ? (
                  <>
                    <Card>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                            Paycheck {nextPaycheckNum} · {nextPeriod?.label ?? ''}
                          </p>
                        </div>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.green, margin: 0 }}>
                          {fmt(totalPaycheck)}
                        </p>
                      </div>
                    </Card>

                    {/* Rollover projection for Ultra */}
                    {availableNumber !== null && (
                      <Card style={{ backgroundColor: `${colors.green}10`, border: `1px solid ${colors.green}30` }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.25rem 0' }}>Projected available</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: colors.green, margin: '0 0 0.25rem 0' }}>
                          {fmt(availableNumber + totalPaycheck - nextBillsTotal)}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: 0 }}>
                          {fmt(availableNumber)} current + {fmt(totalPaycheck)} next paycheck − {fmt(nextBillsTotal)} bills
                        </p>
                      </Card>
                    )}

                    {nextPaycheckBills.length === 0 ? (
                      <Card style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>✨</p>
                        <p style={{ color: colors.textMuted, margin: 0 }}>
                          No bills due before your next paycheck. Extra breathing room!
                        </p>
                      </Card>
                    ) : (
                      <Card>
                        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Bills due next period
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {nextPaycheckBills.map((bill) => {
                            const amt = billAmountForPaycheck(bill, nextPaycheckNum);
                            const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
                            return (
                              <a
                                key={bill.id}
                                href={`/app/bills?edit=${bill.id}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '1rem',
                                  backgroundColor: colors.background,
                                  borderRadius: '0.5rem',
                                  borderLeft: `4px solid ${CATEGORY_COLORS[bill.category] || '#6B7280'}`,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  transition: 'opacity 0.15s',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                                      {bill.name}
                                    </p>
                                    {bill.isSplit && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: colors.electric,
                                        backgroundColor: `${colors.electric}15`,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                      }}>
                                        SPLIT
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                                    Due the {bill.dueDay || 1}{suffix(bill.dueDay || 1)} · {bill.category}
                                  </p>
                                </div>
                                <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                                  {fmt(amt)}
                                </p>
                              </a>
                            );
                          })}
                        </div>
                      </Card>
                    )}

                    <Card style={{ backgroundColor: 'rgba(56,189,248,0.06)', border: `1px solid rgba(56,189,248,0.15)` }}>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: 700, color: colors.midnight }}>After expenses: {fmt(availableNumber !== null ? availableNumber + totalPaycheck - nextBillsTotal : nextRemaining)} </span>
                        <span style={{ color: colors.midnight }}>available for spending & savings</span>
                      </p>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card style={{ padding: '1.5rem' }}>
                      <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>📅</p>
                      <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: 700 }}>You're paid monthly. </span>
                        All your bills come from one paycheck each month. Check the Monthly tab for the full breakdown.
                      </p>
                    </Card>

                    <Card>
                      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Next month's projected bills
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {bills.filter(b => b.isRecurring).sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1)).map((bill) => {
                          const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
                          return (
                            <div
                              key={bill.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: colors.background,
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${CATEGORY_COLORS[bill.category] || '#6B7280'}`,
                              }}
                            >
                              <div>
                                <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                                  {bill.name}
                                </p>
                                <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                                  Due the {bill.dueDay || 1}{suffix(bill.dueDay || 1)} · {bill.category}
                                </p>
                              </div>
                              <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                                {fmt(bill.total)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </>
                )}

                {secondaryIncome.length > 0 && getSideIncomeForPaycheck(nextPeriod.paycheckNumber as number).map(src => (
                  <div
                    key={`next-${src.incomeSourceId}`}
                    style={{
                      backgroundColor: 'rgba(56,189,248,0.05)',
                      borderRadius: '0.75rem',
                      border: '0.5px solid rgba(56,189,248,0.15)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{ padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setExpandedSide(prev => ({ ...prev, [`next-${src.incomeSourceId}`]: !prev[`next-${src.incomeSourceId}`] }))}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#38BDF8' }}>{src.name}</p>
                        <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: colors.textMuted }}>
                          {fmt(src.amount)} income{src.carry > 0 ? ` + ${fmt(src.carry)} carried over` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: colors.text }}>{fmt(src.available)}</p>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: colors.textMuted }}>available</p>
                      </div>
                    </div>

                    {expandedSide[`next-${src.incomeSourceId}`] && (
                      <div style={{ padding: '0 0.875rem 0.875rem', borderTop: '0.5px solid rgba(56,189,248,0.1)' }}>
                        {sideIncomeAllocations
                          .filter(a => a.incomeSourceId === src.incomeSourceId && a.paycheckNumber === (nextPeriod.paycheckNumber as number))
                          .map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '0.5px solid rgba(56,189,248,0.08)' }}>
                              <span style={{ fontSize: '0.8rem' }}>{a.action === 'savings' ? '💰' : '📋'}</span>
                              <span style={{ flex: 1, fontSize: '0.8rem', color: colors.textSub }}>
                                {a.action === 'savings' ? 'Moved to savings' : `Applied to ${a.billName || 'bill'}`}
                              </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.text }}>{fmt(a.amount)}</span>
                              <button onClick={() => removeAllocation(a.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#A32D2D' }}>Undo</button>
                            </div>
                          ))}

                        {sideActionLoading === `next-${src.incomeSourceId}` ? (
                          <p style={{ fontSize: '0.8rem', color: '#38BDF8', textAlign: 'center', padding: '0.75rem 0', margin: 0 }}>Saving...</p>
                        ) : src.available > 0 ? (
                          <>
                            {sideActionError && (
                              <p style={{ fontSize: '0.75rem', color: '#A32D2D', textAlign: 'center', margin: '0 0 0.375rem 0' }}>{sideActionError}</p>
                            )}
                            {sidePickBill === `next-${src.incomeSourceId}` ? (
                              <div style={{ marginTop: '0.5rem' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#38BDF8', margin: '0 0 0.375rem 0' }}>Choose a bill:</p>
                                {getUnpaidBillsForPaycheck(nextPeriod.paycheckNumber as number, src.available).map(b => {
                                  return (
                                    <button
                                      key={b.id}
                                      onClick={() => handleAllocateToBill(src.incomeSourceId, src.available, nextPeriod.paycheckNumber as number, b.id, `next-${src.incomeSourceId}`)}
                                      style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.12)',
                                        backgroundColor: 'rgba(56,189,248,0.06)', cursor: 'pointer', marginBottom: '0.25rem',
                                        fontSize: '0.8rem', color: colors.text,
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MerchantLogo billName={b.name} category={b.category} size={24} isDark={isDark} />
                                        <span>{b.name}</span>
                                      </div>
                                      <span style={{ fontWeight: 600, color: '#38BDF8' }}>{fmt(billAmountForPaycheck(b, nextPeriod.paycheckNumber as number))}</span>
                                    </button>
                                  );
                                })}
                                <button onClick={() => setSidePickBill(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.7rem', color: colors.textMuted, padding: '0.5rem', width: '100%' }}>Cancel</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.625rem' }}>
                                <button
                                  onClick={() => handleAllocateToSavings(src.incomeSourceId, src.available, nextPeriod.paycheckNumber as number, `next-${src.incomeSourceId}`)}
                                  style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                                    padding: '0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.15)',
                                    backgroundColor: 'rgba(56,189,248,0.08)', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, color: '#38BDF8',
                                  }}
                                >
                                  💰 Move to savings
                                </button>
                                <button
                                  onClick={() => { setSideActionError(null); setSidePickBill(`next-${src.incomeSourceId}`); }}
                                  style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                                    padding: '0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.15)',
                                    backgroundColor: 'rgba(56,189,248,0.08)', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: 500, color: '#38BDF8',
                                  }}
                                >
                                  📋 Apply to a bill
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: '#0A7B6C', textAlign: 'center', padding: '0.625rem 0', fontWeight: 500, margin: 0 }}>Fully allocated for this paycheck</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TwoColumnLayout>
      )}

      {/* Quick Expense Modal */}
      {expenseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setExpenseModalOpen(false)}>
          <div style={{
            backgroundColor: colors.card, borderRadius: 16, padding: '2rem', width: '90%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: colors.text }}>Quick spend</h3>
              <button onClick={() => { setExpenseModalOpen(false); setExpenseName(''); setExpenseAmount(''); setExpenseCategory(''); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: colors.textMuted, cursor: 'pointer' }}>✕</button>
            </div>

            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.5px', marginBottom: '0.375rem', display: 'block' }}>WHAT DID YOU SPEND ON?</label>
            <input
              type="text"
              placeholder="e.g. Dinner, Gas, Coffee"
              value={expenseName}
              onChange={e => setExpenseName(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 10, border: `0.5px solid ${colors.cardBorder}`,
                backgroundColor: colors.inputBg, color: colors.text, fontSize: '1rem', marginBottom: '1rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />

            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.5px', marginBottom: '0.375rem', display: 'block' }}>HOW MUCH?</label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={expenseAmount}
              onChange={e => setExpenseAmount(e.target.value)}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 10, border: `0.5px solid ${colors.cardBorder}`,
                backgroundColor: colors.inputBg, color: colors.text, fontSize: '1rem', marginBottom: '1rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />

            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.5px', marginBottom: '0.375rem', display: 'block' }}>CATEGORY (OPTIONAL)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {['Dining', 'Groceries', 'Shopping', 'Transport', 'Entertainment', 'Healthcare', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setExpenseCategory(expenseCategory === cat ? '' : cat)}
                  style={{
                    padding: '0.5rem 0.875rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    backgroundColor: expenseCategory === cat ? '#38BDF8' : colors.inputBg,
                    color: expenseCategory === cat ? '#fff' : colors.text,
                    border: expenseCategory === cat ? 'none' : `0.5px solid ${colors.cardBorder}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleLogExpense}
              disabled={expenseSaving || !expenseName.trim() || !expenseAmount.trim()}
              style={{
                width: '100%', padding: '1rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                backgroundColor: (!expenseName.trim() || !expenseAmount.trim()) ? colors.cardBorder : '#38BDF8',
                color: '#fff', fontSize: '1rem', fontWeight: 700,
              }}
            >
              {expenseSaving ? 'Saving...' : 'Quick spend'}
            </button>
          </div>
        </div>
      )}

      {/* Undo Quick Expense Snackbar */}
      {undoSnackbar && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1A1814', borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 9999,
          minWidth: 320, maxWidth: 480,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              {undoSnackbar.name} — {fmt(undoSnackbar.amount)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Quick expense added</p>
          </div>
          <button
            onClick={handleUndo}
            style={{
              backgroundColor: '#38BDF8', border: 'none', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 700, color: '#1A1814',
            }}
          >
            Undo
          </button>
          <button
            onClick={dismissUndo}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1rem', color: 'rgba(255,255,255,0.4)', padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
