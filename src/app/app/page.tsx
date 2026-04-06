'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getPayPeriods, isBillInPeriod } from '@/lib/payPeriods';
import { usersAPI } from '@/lib/api';
import type { Bill } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

/**
 * Dashboard — PORTED FROM MOBILE DashboardScreen.tsx
 * Calculations match mobile exactly.
 */

const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#0C4A6E', Transport: '#38BDF8', Groceries: '#E67E22',
  Dining: '#E74C3C', Subscriptions: '#7C3AED', Fun: '#F59E0B',
  Insurance: '#2ECC71', Savings: '#1ABC9C', Utilities: '#E84393',
  Other: '#95A5A6',
};

type ViewMode = 'paycheck' | 'nextcheck' | 'cycles' | 'monthly';

export default function DashboardPage() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    bills, billsLoading, refreshBills, refreshIncomeSources, refreshPayments, refreshCategories,
    incomeSources, categories, fmt, isBillPaid, isSplitPaid, markBillPaid, toggleSplitPaid, userName, userInitials,
    currentRollover, decideRollover,
    sideIncomeSummary, sideIncomeAllocations, allocateSideIncome, removeAllocation,
  } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('paycheck');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSide, setExpandedSide] = useState<Record<string, boolean>>({});

  // ── Derive paycheck from income sources (MATCHES MOBILE) ──
  // Exclude one-time funds from paycheck calculations
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
  // Split bills appear in EVERY period
  const thisPaycheckBills = isTwiceMonthly
    ? bills.filter(b => b.isSplit || isBillInPeriod(b.dueDay || 1, currentPeriod))
    : bills;

  const nextPaycheckBills = isTwiceMonthly
    ? bills.filter(b => b.isSplit || isBillInPeriod(b.dueDay || 1, nextPeriod))
    : [];

  // ── Monthly totals (full bill amounts) ─────────────────────
  const totalBillsMonthly = bills.reduce((s, b) => s + (b.total || 0), 0);
  const totalSpentMonthly = bills.reduce((s, b) => s + (b.funded || 0), 0);

  // ── This paycheck calculations (MATCHES MOBILE) ────────────
  const totalBillsThisCheck = thisPaycheckBills.reduce((s, b) => s + billAmountForPaycheck(b, currentPaycheckNum), 0);
  const remaining = (totalPaycheck || 0) - totalBillsThisCheck;
  const spentPct = totalPaycheck > 0 ? Math.round((totalBillsThisCheck / totalPaycheck) * 100) : 0;

  const nextBillsTotal = nextPaycheckBills.reduce((s, b) => s + billAmountForPaycheck(b, nextPaycheckNum), 0);
  const nextRemaining = (totalPaycheck || 0) - nextBillsTotal;

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

  // ── 6-month spending trend data (MATCHES MOBILE) ──────────
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() + i, 1);
    const label = MONTH_LABELS[d.getMonth()];
    const billsTotal = i === 0
      ? totalBillsMonthly
      : bills.filter(b => b.isRecurring).reduce((s, b) => s + (b.total || 0), 0);
    const income = monthlyIncome;
    return { label, bills: billsTotal, income, remaining: income - billsTotal };
  });
  const trendMax = Math.max(...trendData.map(d => Math.max(d.income, d.bills)), 1);

  // ── Chart carousel state (MATCHES MOBILE) ─────────────────
  const [activeChart, setActiveChart] = useState(0);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const CHART_COUNT = 4;
  const CHART_TITLES = ['Monthly breakdown', '6-month spending trend', 'Income vs bills', 'Monthly funded vs unfunded'];

  // Category donut data — use dedicated high-contrast palette
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

  // Income vs Bills data (last 4 months incl. current)
  const ivbData = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - (3 - i), 1);
    const label = MONTH_LABELS[d.getMonth()];
    const billsAmt = (3 - i) === 0
      ? totalBillsMonthly
      : bills.filter((b: any) => b.isRecurring).reduce((s: number, b: any) => s + (b.total || 0), 0);
    return { label, income: monthlyIncome, bills: billsAmt };
  });
  const ivbMax = Math.max(...ivbData.map(d => Math.max(d.income, d.bills)), 1);

  // Funded vs Unfunded
  const fundedAmt = totalSpentMonthly;
  const unfundedAmt = Math.max(0, totalBillsMonthly - totalSpentMonthly);
  const fundedPct = totalBillsMonthly > 0 ? Math.round((fundedAmt / totalBillsMonthly) * 100) : 0;

  // ── Side income helpers (MATCHES MOBILE) ────────────────────
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
      // Auto-mark the bill as paid in the tracker
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

  // ── Expanded category state ────────────────────────────────
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // ── One-time funds for Monthly tab ────────────────────────
  const oneTimeFunds = incomeSources.filter((s: any) => s.isOneTime);
  const oneTimeFundIds = new Set(oneTimeFunds.map((f: any) => f.id));
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

  // ── Dynamic labels ─────────────────────────────────────────
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const hour = now.getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userName ? userName.split(' ')[0] : (user?.email?.split('@')[0] || 'there');

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBills(), refreshIncomeSources(), refreshPayments(), refreshCategories()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = billsLoading;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <p style={{ color: colors.textMuted, margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            {greetingTime}, {firstName}
          </p>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: '0.5rem 0 0 0',
              fontSize: '0.875rem',
            }}
          >
            {monthName} cycle · Paycheck {currentPaycheckNum} of {paycheckCount}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </Button>
      </div>

      {/* ROLLOVER PROMPT — shows at start of month when user hasn't decided */}
      {currentRollover && currentRollover.action === 'pending' && currentRollover.previousLeftover > 0 && (
        <div style={{
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
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

      {/* ROLLED OVER BANNER — shows when user chose to roll over */}
      {currentRollover && currentRollover.action === 'rolled_over' && currentRollover.rolloverAmount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(56,189,248,0.06)',
          borderRadius: '0.625rem',
          padding: '0.75rem',
          marginBottom: '1rem',
          border: '0.5px solid rgba(56,189,248,0.12)',
        }}>
          <span style={{ fontSize: '0.875rem' }}>&#8617;&#65039;</span>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#38BDF8' }}>
            <span style={{ fontWeight: 600 }}>{fmt(currentRollover.rolloverAmount)}</span> rolled over from last month
          </p>
        </div>
      )}

      {/* Summary Cards — Paycheck View */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0, marginBottom: '0.5rem' }}>
                {monthShort} {dayOfMonth} Paycheck
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: 0 }}>
                {fmt(totalPaycheck)}
              </p>
              <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                {incomeName}
              </p>
            </div>
            <TrendingUp size={24} style={{ color: colors.green, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0, marginBottom: '0.5rem' }}>
                Bills This Check
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.amber, margin: 0 }}>
                {fmt(totalBillsThisCheck)}
              </p>
              <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                {spentPct}% of paycheck
              </p>
            </div>
            <Receipt size={24} style={{ color: colors.amber, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0, marginBottom: '0.5rem' }}>
                Remaining
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: remaining >= 0 ? colors.green : colors.red, margin: 0 }}>
                {fmt(remaining)}
              </p>
            </div>
            <CheckCircle2 size={24} style={{ color: remaining >= 0 ? colors.green : colors.red, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0, marginBottom: '0.5rem' }}>
                Monthly Income
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.electric, margin: 0 }}>
                {fmt(monthlyIncome)}
              </p>
              <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                {paycheckCount} paycheck{paycheckCount > 1 ? 's' : ''}/mo
              </p>
            </div>
            <TrendingUp size={24} style={{ color: colors.electric, opacity: 0.7 }} />
          </div>
        </Card>
      </div>

      {/* Progress bar */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>{fmt(totalSpentMonthly)} funded</span>
          <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>{fmt(remaining)} remaining</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: colors.progressTrack,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(spentPct, 100)}%`,
              backgroundColor: colors.electric,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </Card>

      {/* View Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: `1px solid ${colors.divider}`,
        }}
      >
        {(['paycheck', 'nextcheck', 'monthly', 'cycles'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '1rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: viewMode === mode ? 600 : 500,
              color: viewMode === mode ? colors.electric : colors.textMuted,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === mode ? `2px solid ${colors.electric}` : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {mode === 'paycheck' ? 'This Check' : mode === 'nextcheck' ? 'Next Check' : mode === 'cycles' ? 'Cycles' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading...</p>
        </Card>
      ) : viewMode === 'paycheck' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* This paycheck bills */}
          <Card>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
              This Paycheck — {currentPeriod?.label ?? ''}
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
                        borderLeft: `4px solid ${isPaid ? colors.green : colors.amber}`,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                          {bill.name}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>
                          {bill.category}
                          {bill.isSplit && ` · P${currentPaycheckNum}`}
                          {bill.isAutoPay && ' · AutoPay'}
                        </p>
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
                  );
                })}
              </div>
            )}
          </Card>

          {/* Next paycheck preview */}
          {isTwiceMonthly && nextPaycheckBills.length > 0 && (
            <Card>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
                Next Check — {nextPeriod?.label ?? ''}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                  {fmt(nextBillsTotal)} in bills
                </span>
                <span style={{ color: nextRemaining >= 0 ? colors.green : colors.red, fontSize: '0.875rem', fontWeight: 600 }}>
                  {fmt(nextRemaining)} remaining
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {nextPaycheckBills.map((bill) => {
                  const amt = billAmountForPaycheck(bill, nextPaycheckNum);
                  return (
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
                      <span style={{ color: colors.text, fontWeight: 500 }}>
                        {bill.name}{bill.isSplit ? ` · P${nextPaycheckNum}` : ''}
                      </span>
                      <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(amt)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* SIDE INCOME — This Check */}
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
                  {/* Existing allocations */}
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

                  {/* Action area */}
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
                          {getUnpaidBillsForPaycheck(currentPeriod.paycheckNumber as number, src.available).length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0 0 0.375rem 0' }}>No unpaid bills fit within {fmt(src.available)}</p>
                          ) : (
                            getUnpaidBillsForPaycheck(currentPeriod.paycheckNumber as number, src.available).map(b => {
                              const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
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
                                <div>
                                  <span>{b.name}</span>
                                  <span style={{ display: 'block', fontSize: '0.65rem', color: colors.textMuted, marginTop: '0.125rem' }}>Due the {b.dueDay || 1}{suffix(b.dueDay || 1)}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: '#38BDF8' }}>{fmt(billAmountForPaycheck(b, currentPeriod.paycheckNumber as number))}</span>
                              </button>
                              );
                            })
                          )}
                          <a
                            href="/app/bills"
                            style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', color: '#38BDF8', padding: '0.5rem', textDecoration: 'none', border: '0.5px dashed rgba(56,189,248,0.12)', borderRadius: '0.5rem', marginTop: '0.25rem' }}
                          >
                            + Add new bill
                          </a>
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
                            {'💰'} Move to savings
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
                            {'📋'} Apply to a bill
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
              {/* Next paycheck header */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
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
                  <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>&#10024;</p>
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
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* After bills summary */}
              <Card style={{ backgroundColor: 'rgba(56,189,248,0.06)', border: `1px solid rgba(56,189,248,0.15)` }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700, color: colors.midnight }}>After bills: {fmt(nextRemaining)} </span>
                  <span style={{ color: colors.midnight }}>available for spending &amp; savings</span>
                </p>
              </Card>
            </>
          ) : (
            <>
              {/* Monthly pay — show next month's projected bills */}
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>&#128197;</p>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.95rem' }}>
                  <span style={{ fontWeight: 700 }}>You&apos;re paid monthly. </span>
                  All your bills come from one paycheck each month. Check the Monthly tab for the full breakdown.
                </p>
              </Card>

              <Card>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next month&apos;s projected bills
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

          {/* SIDE INCOME — Next Check */}
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
                  {/* Existing allocations */}
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

                  {/* Action area */}
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
                          {getUnpaidBillsForPaycheck(nextPeriod.paycheckNumber as number, src.available).length === 0 ? (
                            <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0 0 0.375rem 0' }}>No unpaid bills fit within {fmt(src.available)}</p>
                          ) : (
                            getUnpaidBillsForPaycheck(nextPeriod.paycheckNumber as number, src.available).map(b => {
                              const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
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
                                <div>
                                  <span>{b.name}</span>
                                  <span style={{ display: 'block', fontSize: '0.65rem', color: colors.textMuted, marginTop: '0.125rem' }}>Due the {b.dueDay || 1}{suffix(b.dueDay || 1)}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: '#38BDF8' }}>{fmt(billAmountForPaycheck(b, nextPeriod.paycheckNumber as number))}</span>
                              </button>
                              );
                            })
                          )}
                          <a href="/app/bills" style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', color: '#38BDF8', padding: '0.5rem', textDecoration: 'none', border: '0.5px dashed rgba(56,189,248,0.12)', borderRadius: '0.5rem', marginTop: '0.25rem' }}>+ Add new bill</a>
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
                            {'💰'} Move to savings
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
                            {'📋'} Apply to a bill
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
              <p style={{ color: colors.textMuted, margin: 0 }}>No categories with bills yet. Add bills to see cycle breakdowns.</p>
            </Card>
          )}
          {allocations.map(({ name, color, amt, amtMonthly, spent }) => (
            <Card key={name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color }} />
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
                    <span style={{ color: colors.text, fontWeight: 500 }}>{bill.name}</span>
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
        /* ── MONTHLY VIEW (MATCHES MOBILE) ──────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* 4-card summary grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Card>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Total Income</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.green, margin: '0 0 0.25rem 0' }}>{fmt(monthlyIncome)}</p>
              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{paycheckCount} paycheck{paycheckCount !== 1 ? 's' : ''} &times; {fmt(totalPaycheck)}</p>
            </Card>
            <Card>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Expenses</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.amber, margin: '0 0 0.25rem 0' }}>{fmt(totalBillsMonthly)}</p>
              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{expensesPctOfIncome}% of income</p>
            </Card>
            <Card>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Remaining</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: monthlyRemaining >= 0 ? colors.green : colors.red, margin: '0 0 0.25rem 0' }}>{fmt(monthlyRemaining)}</p>
              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>After bills</p>
            </Card>
            <Card>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>Savings</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A7B6C', margin: '0 0 0.25rem 0' }}>{fmt(savingsAmt)}</p>
              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>{savingsPct}% of income</p>
            </Card>
          </div>

          {/* CHART CAROUSEL */}
          <div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem 0' }}>
              {CHART_TITLES[activeChart]}
            </h2>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div
                ref={chartScrollRef}
                style={{
                  display: 'flex',
                  transition: 'transform 0.3s ease',
                  transform: `translateX(-${activeChart * 100}%)`,
                }}
              >
                {/* CHART 1: Category Donut */}
                <div style={{ minWidth: '100%', boxSizing: 'border-box' }}>
                  <Card>
                    {donutData.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: colors.textMuted, textAlign: 'center', margin: 0 }}>No category data yet</p>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {/* SVG Donut */}
                        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                          <svg viewBox="0 0 140 140" width="140" height="140">
                            {donutData.map((seg: any, i: number) => {
                              const angle = (seg.pct / 100) * 360;
                              const startAngle = donutData.slice(0, i).reduce((sum: number, s: any) => sum + (s.pct / 100) * 360, 0) - 90;
                              const endAngle = startAngle + angle;
                              const largeArc = angle > 180 ? 1 : 0;
                              const r = 55;
                              const cx = 70, cy = 70;
                              const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                              return (
                                <path
                                  key={i}
                                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={seg.color}
                                />
                              );
                            })}
                            <circle cx="70" cy="70" r="35" fill={String(isDark ? '#2A2720' : '#F5F3EF')} />
                          </svg>
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: colors.text }}>{fmt(totalBillsMonthly)}</div>
                            <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Total</div>
                          </div>
                        </div>
                        {/* Legend */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {donutData.slice(0, 6).map((seg: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seg.name}</div>
                                <div style={{ fontSize: '0.7rem', color: colors.textMuted }}>{fmt(seg.amount)} ({seg.pct.toFixed(1)}%)</div>
                              </div>
                            </div>
                          ))}
                          {donutData.length > 6 && (
                            <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>+{donutData.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* CHART 2: 6-Month Trend */}
                <div style={{ minWidth: '100%', boxSizing: 'border-box' }}>
                  <Card>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2ECC71' }} />
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Income</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E74C3C' }} />
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Bills</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3498DB' }} />
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Remaining</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem', height: '160px' }}>
                      {trendData.map((d, i) => {
                        const incomeH = Math.max(2, (d.income / trendMax) * 140);
                        const billsH = Math.max(2, (d.bills / trendMax) * 140);
                        const remainH = Math.max(2, (Math.max(0, d.remaining) / trendMax) * 140);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px' }}>
                              <div style={{ width: '14px', height: `${incomeH}px`, backgroundColor: '#2ECC71', borderRadius: '3px 3px 0 0' }} />
                              <div style={{ width: '14px', height: `${billsH}px`, backgroundColor: '#E74C3C', borderRadius: '3px 3px 0 0' }} />
                              <div style={{ width: '14px', height: `${remainH}px`, backgroundColor: '#3498DB', borderRadius: '3px 3px 0 0' }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: i === 0 ? 700 : 400, color: i === 0 ? colors.electric : colors.textMuted }}>{d.label}</span>
                            <span style={{ fontSize: '0.65rem', color: colors.textMuted }}>{fmt(d.bills)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {trendData.length > 1 && trendData[0].bills === trendData[1].bills && (
                      <p style={{ fontSize: '0.7rem', color: colors.textMuted, textAlign: 'center', margin: '1rem 0 0 0', fontStyle: 'italic' }}>
                        Future months projected from recurring bills
                      </p>
                    )}
                  </Card>
                </div>

                {/* CHART 3: Income vs Bills */}
                <div style={{ minWidth: '100%', boxSizing: 'border-box' }}>
                  <Card>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2ECC71' }} />
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Income</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#E74C3C' }} />
                        <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Bills</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', height: '160px' }}>
                      {ivbData.map((d, i) => {
                        const incomeH = Math.max(2, (d.income / ivbMax) * 140);
                        const billsH = Math.max(2, (d.bills / ivbMax) * 140);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '140px' }}>
                              <div style={{ width: '18px', height: `${incomeH}px`, backgroundColor: '#2ECC71', borderRadius: '4px 4px 0 0' }} />
                              <div style={{ width: '18px', height: `${billsH}px`, backgroundColor: '#E74C3C', borderRadius: '4px 4px 0 0' }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: i === 3 ? 700 : 400, color: i === 3 ? colors.electric : colors.textMuted }}>{d.label}</span>
                            <span style={{ fontSize: '0.65rem', color: colors.textMuted }}>{fmt(d.bills)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* CHART 4: Funded vs Unfunded */}
                <div style={{ minWidth: '100%', boxSizing: 'border-box' }}>
                  <Card>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* SVG Progress Ring */}
                      <div style={{ position: 'relative', width: 140, height: 140 }}>
                        <svg viewBox="0 0 140 140" width="140" height="140">
                          <circle cx="70" cy="70" r="55" fill="none" stroke={String(isDark ? '#444' : '#E0DDD5')} strokeWidth="16" />
                          {fundedPct > 0 && (
                            <circle
                              cx="70" cy="70" r="55"
                              fill="none"
                              stroke="#2ECC71"
                              strokeWidth="16"
                              strokeDasharray={`${(fundedPct / 100) * 345.6} 345.6`}
                              strokeLinecap="round"
                              transform="rotate(-90 70 70)"
                            />
                          )}
                          <circle cx="70" cy="70" r="35" fill={String(isDark ? '#2A2720' : '#F5F3EF')} />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2ECC71' }}>{fundedPct}%</div>
                          <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Funded</div>
                        </div>
                      </div>
                      {/* Legend below */}
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'center' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2ECC71' }} />
                            <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>Funded</span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2ECC71' }}>{fmt(fundedAmt)}</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem', justifyContent: 'center' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isDark ? '#444' : '#E0DDD5' }} />
                            <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>Remaining</span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(unfundedAmt)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem' }}>
              {Array.from({ length: CHART_COUNT }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChart(i)}
                  style={{
                    width: activeChart === i ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: activeChart === i ? '#38BDF8' : (isDark ? '#333' : '#E8E5DC'),
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem 0' }}>
              Category Breakdown
            </h2>
            {allocations.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: colors.textMuted, margin: 0 }}>No bills assigned to categories yet.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...allocations].sort((a, b) => b.amtMonthly - a.amtMonthly).map(({ name, color, amtMonthly }) => {
                  const isExp = expandedCats['m_' + name] || false;
                  const catBills = bills.filter(b => b.category === name).sort((x, y) => (x.dueDay || 1) - (y.dueDay || 1));
                  const pctOfIncome = monthlyIncome > 0 ? Math.round((amtMonthly / monthlyIncome) * 100) : 0;
                  return (
                    <div key={name}>
                      <Card
                        onClick={() => setExpandedCats(prev => ({ ...prev, ['m_' + name]: !prev['m_' + name] }))}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
                            <div>
                              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>{name}</p>
                              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: '0.15rem 0 0 0' }}>
                                {catBills.length} bill{catBills.length !== 1 ? 's' : ''} · {pctOfIncome}% of income
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: colors.electric }}>{fmt(amtMonthly)}</span>
                            <span style={{ fontSize: '0.65rem', color: isExp ? colors.electric : colors.textMuted }}>{isExp ? '\u25B2' : '\u25BC'}</span>
                          </div>
                        </div>
                      </Card>
                      {isExp && (
                        <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {catBills.map(b => {
                            const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';
                            return (
                              <div
                                key={b.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '0.75rem 1rem',
                                  backgroundColor: colors.background,
                                  borderRadius: '0.5rem',
                                  borderLeft: `3px solid ${color}`,
                                }}
                              >
                                <div>
                                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text, margin: 0 }}>{b.name}</p>
                                  <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.15rem 0 0 0' }}>
                                    Due the {b.dueDay || 1}{suffix(b.dueDay || 1)}
                                  </p>
                                </div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>{fmt(b.total)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* One-Time Funds */}
          {oneTimeFunds.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem 0' }}>
                One-Time Funds
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {oneTimeFunds.map((fund: any) => {
                  const allocs = fundAllocMap[fund.id] || [];
                  const totalAllocated = allocs.reduce((s: number, a: any) => s + parseFloat(a.amount), 0);
                  const remaining = Math.max(0, (fund.typicalAmount || 0) - totalAllocated);
                  const isFullySpent = remaining < 0.01;
                  const spentPct = (fund.typicalAmount || 0) > 0 ? Math.min(100, Math.round((totalAllocated / (fund.typicalAmount || 1)) * 100)) : 0;

                  return (
                    <a
                      key={fund.id}
                      href="/app/settings"
                      style={{ textDecoration: 'none' }}
                    >
                      <Card style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>💰</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>{fund.name}</p>
                              {isFullySpent && (
                                <span style={{
                                  backgroundColor: 'rgba(10,123,108,0.12)',
                                  color: '#0A7B6C',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                }}>Fully spent</span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: '0.15rem 0 0 0' }}>
                              {allocs.length} item{allocs.length !== 1 ? 's' : ''} · Click to manage
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: isFullySpent ? '#0A7B6C' : '#854F0B', margin: 0 }}>{fmt(remaining)}</p>
                            <p style={{ fontSize: '0.7rem', color: colors.textMuted, margin: '0.1rem 0 0 0' }}>remaining</p>
                          </div>
                        </div>

                        {/* Mini progress bar */}
                        <div style={{ height: '3px', backgroundColor: colors.progressTrack || colors.cardBorder, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${spentPct}%`, backgroundColor: isFullySpent ? '#0A7B6C' : spentPct > 80 ? '#854F0B' : '#38BDF8', borderRadius: '2px' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', color: colors.textMuted }}>{fmt(totalAllocated)} spent</span>
                          <span style={{ fontSize: '0.65rem', color: colors.textMuted }}>of {fmt(fund.typicalAmount || 0)}</span>
                        </div>
                      </Card>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
