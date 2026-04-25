'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getPayPeriods, isBillInPeriod, billBelongsToPaycheck } from '@/lib/payPeriods';
import { usersAPI } from '@/lib/api';
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
 * DashboardFreeContent — Free/Pro tier dashboard
 * Tabs: Monthly, This Check, Next Check, Cycles
 * No Ultra-specific code: no availableNumber, no spending velocity, no bankingAPI,
 * no detected alerts, no AISyncingIndicator, no Overview tab
 */

type ViewMode = 'monthly' | 'paycheck' | 'nextcheck' | 'cycles';

const UNDO_WINDOW_SECONDS = 30;

export default function DashboardFreeContent() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    bills, billsLoading, refreshBills, refreshIncomeSources, refreshPayments, refreshCategories,
    incomeSources, categories, fmt, isBillPaid, isSplitPaid, markBillPaid, toggleSplitPaid, userName, userInitials,
    currentRollover, decideRollover,
    sideIncomeSummary, sideIncomeAllocations, allocateSideIncome, removeAllocation,
    isPro, spendingBudgets,
    logQuickExpense,
    deleteBill,
  } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
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
  const [undoCountdown, setUndoCountdown] = useState(UNDO_WINDOW_SECONDS);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismissUndo = useCallback(() => {
    setUndoSnackbar(null);
    setUndoCountdown(UNDO_WINDOW_SECONDS);
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    if (undoIntervalRef.current) { clearInterval(undoIntervalRef.current); undoIntervalRef.current = null; }
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
  const totalAllBillsThisCheck = totalBillsThisCheck + totalCCBillsThisCheck;
  const remaining = (totalPaycheck || 0) - totalAllBillsThisCheck;
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

  // ── Savings category (MATCHES MOBILE) ──────────────────────
  const savingsCategory = categories.find(c => c.name.toLowerCase() === 'savings');
  const savingsAmt = savingsCategory
    ? bills.filter(b => b.category === savingsCategory.name).reduce((s, b) => s + (b.total || 0), 0)
    : 0;
  const savingsPct = monthlyIncome > 0 ? Math.round((savingsAmt / monthlyIncome) * 100) : 0;
  const expensesPctOfIncome = monthlyIncome > 0 ? Math.round((totalBillsMonthly / monthlyIncome) * 100) : 0;

  // ── Pay period progress ────────────────────────────────────
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

  // ── Chart data (MATCHES MOBILE) ───────────────────────────
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Category donut data
  const DONUT_PALETTE = [
    '#0C4A6E', '#E67E22', '#2ECC71', '#E74C3C', '#7C3AED',
    '#F59E0B', '#E84393', '#1ABC9C', '#3498DB', '#95A5A6',
  ];
  const donutData = allocations
    .slice()
    .sort((a: any, b: any) => b.amtMonthly - a.amtMonthly)
    .map((a: any, i: number) => ({
      name: a.name,
      amount: a.amtMonthly,
      color: DONUT_PALETTE[i % DONUT_PALETTE.length],
      pct: totalBillsMonthly > 0 ? (a.amtMonthly / totalBillsMonthly) * 100 : 0,
    }))
    .filter((d: any) => d.pct > 0);

  // Funded vs Unfunded
  const fundedAmt = totalSpentMonthly;
  const unfundedAmt = Math.max(0, totalBillsMonthly - totalSpentMonthly);
  const fundedPct = totalBillsMonthly > 0 ? Math.round((fundedAmt / totalBillsMonthly) * 100) : 0;

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
      await Promise.all([refreshBills(), refreshIncomeSources(), refreshPayments(), refreshCategories()]);
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

      // Show undo snackbar with countdown
      if (billId) {
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
        setUndoSnackbar({ billId, name: savedName, amount: savedAmount });
        setUndoCountdown(UNDO_WINDOW_SECONDS);
        undoIntervalRef.current = setInterval(() => setUndoCountdown(prev => prev > 0 ? prev - 1 : 0), 1000);
        undoTimerRef.current = setTimeout(() => {
          setUndoSnackbar(null);
          setUndoCountdown(UNDO_WINDOW_SECONDS);
          if (undoIntervalRef.current) { clearInterval(undoIntervalRef.current); undoIntervalRef.current = null; }
        }, UNDO_WINDOW_SECONDS * 1000);
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
          <p style={{ fontSize: '2rem', fontWeight: 700, color: remaining >= 0 ? colors.text : '#EF4444', margin: '0 0 0.25rem 0' }}>
            {fmt(remaining)}
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
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(totalPaycheck)}</span>
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
            <section className="app-page-hero" style={{ padding: '2rem' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p className="app-page-kicker">{greetingTime}, {userName || 'there'}</p>
                <h1 className="app-page-title">Your paycheck plan.</h1>
                <p className="app-page-subtitle">
                  See what is already spoken for, what is still flexible, and what is coming next.
                </p>
                <div className="app-metric-grid" style={{ marginTop: '1.5rem' }}>
                  {[
                    { label: 'Available', value: fmt(remaining), detail: `${currentPeriod.label}`, color: remaining >= 0 ? colors.green : colors.red },
                    { label: 'Bills this check', value: fmt(totalAllBillsThisCheck), detail: `${thisPaycheckBills.length} expenses`, color: colors.amber },
                    { label: 'Income', value: fmt(totalPaycheck), detail: incomeName, color: colors.green },
                  ].map((item) => (
                    <div key={item.label} className="app-soft-panel" style={{ padding: '1rem' }}>
                      <p style={{ margin: '0 0 0.45rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.textMuted }}>
                        {item.label}
                      </p>
                      <p style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: item.color }}>
                        {item.value}
                      </p>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: colors.textMuted }}>
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

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

            {/* Hero Stats Row (3-column grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <Card style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Available</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: remaining >= 0 ? '#0A7B6C' : '#EF4444', margin: '0 0 0.25rem 0' }}>{fmt(remaining)}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 6px rgba(56,189,248,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', width: 80, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(remaining)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      available to spend
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
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: '0 0 0.25rem 0' }}>{fmt(totalPaycheck)}</p>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>{paycheckCount} paycheck{paycheckCount > 1 ? 's' : ''} this month</p>
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

            {/* View Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
            }}>
              {(['monthly', 'paycheck', 'nextcheck', 'cycles'] as ViewMode[]).map((mode) => (
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
                  {mode === 'paycheck' ? 'This Check' : mode === 'nextcheck' ? 'Next Check' : mode === 'cycles' ? 'Cycles' : 'Monthly'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {viewMode === 'paycheck' ? (
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
                      No expenses due this paycheck
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
                        {fmt(nextBillsTotal)} in expenses{nextCCBillsTotal > 0 ? ` (${fmt(nextCCBillsTotal)} on cards)` : ''}
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
            ) : viewMode === 'nextcheck' ? (
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

                    {nextPaycheckBills.length === 0 ? (
                      <Card style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>✨</p>
                        <p style={{ color: colors.textMuted, margin: 0 }}>
                          No expenses due before your next paycheck. Extra breathing room!
                        </p>
                      </Card>
                    ) : (
                      <Card>
                        <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Expenses due next period
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
                        <span style={{ fontWeight: 700, color: colors.midnight }}>After expenses: {fmt(nextRemaining)} </span>
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
                        Next month's projected expenses
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
            ) : viewMode === 'cycles' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {allocations.length === 0 && (
                  <Card style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: colors.textMuted, margin: 0 }}>No categories with expenses yet. Add expenses to see cycle breakdowns.</p>
                  </Card>
                )}
                {allocations.map(({ name, color, amt, amtMonthly, spent }) => (
                  <Card key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <CategoryIcon category={name} size={30} isDark={isDark} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                        {name}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {bills.filter(b => b.category === name).map((bill) => (
                        <div
                          key={bill.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            backgroundColor: colors.background,
                            borderRadius: '0.375rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MerchantLogo billName={bill.name} category={bill.category} size={24} isDark={isDark} />
                            <span style={{ color: colors.text, fontWeight: 500 }}>{bill.name}</span>
                          </div>
                          <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(bill.total)}</span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: `1px solid ${colors.divider}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ color: colors.textMuted, fontWeight: 500 }}>Total</span>
                      <span style={{ color: colors.text, fontWeight: 700 }}>{fmt(amtMonthly)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* MONTHLY VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <Card>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Total Income</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.green, margin: '0 0 0.25rem 0' }}>{fmt(monthlyIncome)}</p>
                    <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{paycheckCount} paycheck{paycheckCount !== 1 ? 's' : ''} × {fmt(totalPaycheck)}</p>
                  </Card>
                  <Card>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Expenses</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.amber, margin: '0 0 0.25rem 0' }}>{fmt(totalBillsMonthly)}</p>
                    <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{expensesPctOfIncome}% of income</p>
                  </Card>
                  <Card>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Remaining</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: monthlyRemaining >= 0 ? colors.green : colors.red, margin: '0 0 0.25rem 0' }}>{fmt(monthlyRemaining)}</p>
                    <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>After expenses</p>
                  </Card>
                  <Card>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Savings</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A7B6C', margin: '0 0 0.25rem 0' }}>{fmt(savingsAmt)}</p>
                    <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{savingsPct}% of income</p>
                  </Card>
                </div>

                {/* Quick Spend Button */}
                <div
                  onClick={() => setExpenseModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '10px 16px',
                    backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(12,74,110,0.08)',
                    borderRadius: 10, cursor: 'pointer',
                    width: 'fit-content', margin: '0 auto',
                  }}
                >
                  <span style={{ fontSize: 14, color: isDark ? '#38BDF8' : '#0C4A6E', fontWeight: 600 }}>+ Quick spend</span>
                </div>

                {/* Category breakdown */}
                {donutData.length > 0 && (
                  <Card style={{ padding: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text, margin: '0 0 0.75rem 0' }}>Category breakdown</p>
                    {allocations.slice(0, 5).map((cat, i) => (
                      <div key={cat.name} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: i < Math.min(5, allocations.length) - 1 ? '0.5rem' : 0,
                      }}>
                        <CategoryIcon category={cat.name} size={22} isDark={isDark} />
                        <span style={{ fontSize: '0.9rem', color: colors.text, flex: 1 }}>{cat.name}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>{fmt(cat.amtMonthly)}</span>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>
        </TwoColumnLayout>
      )}

      {/* Quick Expense Modal */}
      {expenseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setExpenseModalOpen(false)}>
          <div style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>Quick spend</span>
              <span onClick={() => { setExpenseModalOpen(false); setExpenseName(''); setExpenseAmount(''); setExpenseCategory(''); }} style={{ fontSize: 16, color: colors.textSub, cursor: 'pointer' }}>&#10005;</span>
            </div>
            {/* Name input */}
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 6, letterSpacing: 0.5 }}>WHAT DID YOU SPEND ON?</div>
            <input
              style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, marginBottom: 16, border: `0.5px solid ${colors.cardBorder}`, width: '100%', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. Dinner, Gas, Coffee"
              value={expenseName}
              onChange={e => setExpenseName(e.target.value)}
              autoFocus
            />
            {/* Amount input */}
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 6, letterSpacing: 0.5 }}>HOW MUCH?</div>
            <input
              type="number"
              style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, marginBottom: 16, border: `0.5px solid ${colors.cardBorder}`, width: '100%', outline: 'none', boxSizing: 'border-box' }}
              placeholder="0.00"
              value={expenseAmount}
              onChange={e => setExpenseAmount(e.target.value)}
            />
            {/* Category pills */}
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSub, marginBottom: 6, letterSpacing: 0.5 }}>CATEGORY (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {['Dining', 'Groceries', 'Shopping', 'Transport', 'Entertainment', 'Healthcare', 'Other'].map(cat => {
                const isSelected = expenseCategory === cat;
                return (
                  <div
                    key={cat}
                    onClick={() => setExpenseCategory(isSelected ? '' : cat)}
                    style={{
                      paddingInline: 14, paddingBlock: 8, borderRadius: 20, cursor: 'pointer',
                      backgroundColor: isSelected ? '#38BDF8' : colors.inputBg,
                      border: `1px solid ${isSelected ? '#38BDF8' : (isDark ? 'rgba(232,229,220,0.18)' : 'rgba(26,24,20,0.15)')}`,
                      fontSize: 13, fontWeight: 600, color: isSelected ? '#1A1814' : colors.text,
                    }}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>
            {/* Submit button */}
            <div
              onClick={() => { if (!expenseSaving && expenseName.trim() && expenseAmount.trim()) handleLogExpense(); }}
              style={{
                backgroundColor: (!expenseName.trim() || !expenseAmount.trim() || expenseSaving)
                  ? (isDark ? 'rgba(56,189,248,0.18)' : 'rgba(12,74,110,0.15)')
                  : '#38BDF8',
                borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer',
                color: (!expenseName.trim() || !expenseAmount.trim() || expenseSaving)
                  ? (isDark ? 'rgba(232,229,220,0.45)' : 'rgba(26,24,20,0.45)')
                  : '#1A1814',
                fontSize: 16, fontWeight: 700,
              }}
            >
              {expenseSaving ? 'Saving\u2026' : 'Quick spend'}
            </div>
          </div>
        </div>
      )}

      {/* Undo Quick Expense Snackbar */}
      {undoSnackbar && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#1A1814', borderRadius: 14, padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1001, minWidth: 320, maxWidth: 500,
        }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{undoSnackbar.name} — {fmt(undoSnackbar.amount)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Quick expense added</div>
          </div>
          <div
            onClick={handleUndo}
            style={{
              backgroundColor: '#38BDF8', borderRadius: 8,
              paddingInline: 16, paddingBlock: 8,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1814' }}>Undo</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(26,24,20,0.6)' }}>{undoCountdown}s</span>
          </div>
          <span onClick={dismissUndo} style={{ marginLeft: 8, padding: 4, cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>&#10005;</span>
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
