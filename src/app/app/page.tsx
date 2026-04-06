'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getPayPeriods, isBillInPeriod } from '@/lib/payPeriods';
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
  Housing: '#0C4A6E', Transport: '#38BDF8', Groceries: '#0E6494',
  Dining: '#56CCF2', Subscriptions: '#7C3AED', Fun: '#F59E0B',
  Savings: '#888780', Other: '#6B7280',
};

type ViewMode = 'paycheck' | 'nextcheck' | 'cycles' | 'monthly';

export default function DashboardPage() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    bills, billsLoading, refreshBills, refreshIncomeSources, refreshPayments, refreshCategories,
    incomeSources, categories, fmt, isBillPaid, toggleSplitPaid, userName, userInitials,
    currentRollover, decideRollover,
    sideIncomeSummary, sideIncomeAllocations, allocateSideIncome, removeAllocation,
  } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('paycheck');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSide, setExpandedSide] = useState<Record<string, boolean>>({});

  // ── Derive paycheck from income sources (MATCHES MOBILE) ──
  const primaryIncome = incomeSources.find(s => s.isPrimary) || (incomeSources.length > 0 ? incomeSources[0] : null);
  const secondaryIncome = incomeSources.filter(s => s.id !== primaryIncome?.id);
  const totalPaycheck = incomeSources.reduce((sum, s) => sum + (s.typicalAmount || 0), 0);
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

  // ── Side income helpers (MATCHES MOBILE) ────────────────────
  function getSideIncomeForPaycheck(paycheckNum: number) {
    return sideIncomeSummary.map(src => {
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

  async function handleAllocateToSavings(sourceId: string, available: number, paycheckNum: number) {
    if (!window.confirm(`Move ${fmt(available)} to savings?`)) return;
    try {
      await allocateSideIncome({ incomeSourceId: sourceId, paycheckNumber: paycheckNum, action: 'savings', amount: available });
      alert(`${fmt(available)} moved to savings.`);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || 'Failed to allocate');
    }
  }

  async function handleAllocateToBill(sourceId: string, available: number, paycheckNum: number) {
    const eligibleBills = bills.filter(b => {
      const amt = billAmountForPaycheck(b, paycheckNum);
      return amt > 0 && amt <= available;
    });
    if (eligibleBills.length === 0) {
      alert(`No bills fit within ${fmt(available)}. Try moving to savings instead.`);
      return;
    }
    const bill = eligibleBills[0];
    if (window.confirm(`Apply ${fmt(billAmountForPaycheck(bill, paycheckNum))} to "${bill.name}"?`)) {
      try {
        await allocateSideIncome({ incomeSourceId: sourceId, paycheckNumber: paycheckNum, action: 'bill', amount: billAmountForPaycheck(bill, paycheckNum), billId: bill.id });
        alert(`${fmt(billAmountForPaycheck(bill, paycheckNum))} applied to ${bill.name}.`);
      } catch (err: any) {
        alert(err?.response?.data?.error || err?.message || 'Failed to allocate');
      }
    }
  }

  // ── Expanded category state ────────────────────────────────
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

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
                        <span style={{ fontSize: '0.8rem' }}>{a.action === 'savings' ? '\uD83D\uDCB0' : '\uD83D\uDCCB'}</span>
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

                  {/* Action buttons */}
                  {src.available > 0 && (
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
                        \uD83D\uDCB0 Move to savings
                      </button>
                      <button
                        onClick={() => handleAllocateToBill(src.incomeSourceId, src.available, currentPeriod.paycheckNumber as number)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                          padding: '0.625rem', borderRadius: '0.5rem', border: '0.5px solid rgba(56,189,248,0.15)',
                          backgroundColor: 'rgba(56,189,248,0.08)', cursor: 'pointer',
                          fontSize: '0.8rem', fontWeight: 500, color: '#38BDF8',
                        }}
                      >
                        \uD83D\uDCCB Apply to a bill
                      </button>
                    </div>
                  )}
                  {src.available === 0 && (
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
                padding: '0.875rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
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

          {/* 6-month spending trend chart */}
          <div>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem 0' }}>
              6-Month Spending Trend
            </h2>
            <Card>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                  <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Income</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0C4A6E' }} />
                  <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Bills</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0A7B6C' }} />
                  <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Remaining</span>
                </div>
              </div>
              {/* Bar chart */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.75rem', height: '160px' }}>
                {trendData.map((d, i) => {
                  const incomeH = Math.max(2, (d.income / trendMax) * 140);
                  const billsH = Math.max(2, (d.bills / trendMax) * 140);
                  const remainH = Math.max(2, (Math.max(0, d.remaining) / trendMax) * 140);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px' }}>
                        <div style={{ width: '14px', height: `${incomeH}px`, backgroundColor: '#38BDF8', borderRadius: '3px 3px 0 0' }} />
                        <div style={{ width: '14px', height: `${billsH}px`, backgroundColor: '#0C4A6E', borderRadius: '3px 3px 0 0' }} />
                        <div style={{ width: '14px', height: `${remainH}px`, backgroundColor: '#0A7B6C', borderRadius: '3px 3px 0 0' }} />
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
