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

type ViewMode = 'paycheck' | 'cycles' | 'monthly';

export default function DashboardPage() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    bills, billsLoading, refreshBills, refreshIncomeSources, refreshPayments, refreshCategories,
    incomeSources, categories, fmt, isBillPaid, toggleSplitPaid, userName, userInitials,
  } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('paycheck');
  const [refreshing, setRefreshing] = useState(false);

  // ── Derive paycheck from income sources (MATCHES MOBILE) ──
  const primaryIncome = incomeSources.length > 0 ? incomeSources[0] : null;
  const totalPaycheck = primaryIncome ? primaryIncome.typicalAmount : 0;
  const incomeName = primaryIncome ? primaryIncome.name : 'No income set';

  // ── Smart pay period calculation (MATCHES MOBILE) ──────────
  const freq = primaryIncome?.frequency || '';
  const payPeriods = getPayPeriods(primaryIncome?.nextPayDate, freq);
  const { current: currentPeriod, next: nextPeriod, isTwiceMonthly, periodsPerMonth } = payPeriods;
  const paycheckCount = periodsPerMonth;

  const paydayDate = currentPeriod?.start || new Date();
  const monthShort = paydayDate.toLocaleString('default', { month: 'short' });
  const dayOfMonth = paydayDate.getDate();

  // ── billAmountForPaycheck (MATCHES MOBILE) ─────────────────
  function billAmountForPaycheck(b: Bill, paycheck: number = currentPeriod.paycheckNumber): number {
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
  const totalBillsThisCheck = thisPaycheckBills.reduce((s, b) => s + billAmountForPaycheck(b, currentPeriod.paycheckNumber), 0);
  const remaining = (totalPaycheck || 0) - totalBillsThisCheck;
  const spentPct = totalPaycheck > 0 ? Math.round((totalBillsThisCheck / totalPaycheck) * 100) : 0;

  const nextBillsTotal = nextPaycheckBills.reduce((s, b) => s + billAmountForPaycheck(b, nextPeriod.paycheckNumber), 0);
  const nextRemaining = (totalPaycheck || 0) - nextBillsTotal;

  // ── Monthly income (MATCHES MOBILE) ─────────────────────────
  const monthlyIncome = totalPaycheck * paycheckCount;
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
            {monthName} cycle · Paycheck {currentPeriod.paycheckNumber} of {paycheckCount}
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
        {(['paycheck', 'cycles', 'monthly'] as const).map((mode) => (
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
            {mode === 'paycheck' ? 'This Check' : mode === 'cycles' ? 'Cycles' : 'Monthly'}
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
              This Paycheck — {currentPeriod.label}
            </h2>

            {thisPaycheckBills.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: '0.95rem', margin: 0 }}>
                No bills due this paycheck
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {thisPaycheckBills.map((bill) => {
                  const amt = billAmountForPaycheck(bill, currentPeriod.paycheckNumber);
                  const isPaid = bill.isSplit
                    ? (() => {
                        const pNum = currentPeriod.paycheckNumber;
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
                          {bill.isSplit && ` · P${currentPeriod.paycheckNumber}`}
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
                          onClick={() => toggleSplitPaid(bill.id, currentPeriod.paycheckNumber)}
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
                Next Check — {nextPeriod.label}
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
                  const amt = billAmountForPaycheck(bill, nextPeriod.paycheckNumber);
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
                        {bill.name}{bill.isSplit ? ` · P${nextPeriod.paycheckNumber}` : ''}
                      </span>
                      <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(amt)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      ) : viewMode === 'cycles' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
              Monthly Summary
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem',
              }}
            >
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Monthly Bills</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.amber, margin: 0 }}>{fmt(totalBillsMonthly)}</p>
              </div>
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Monthly Income</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: 0 }}>{fmt(monthlyIncome)}</p>
              </div>
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Surplus</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: monthlyRemaining >= 0 ? colors.green : colors.red, margin: 0 }}>
                  {fmt(monthlyRemaining)}
                </p>
              </div>
              {savingsAmt > 0 && (
                <div>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Savings</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: 0 }}>
                    {fmt(savingsAmt)} ({savingsPct}%)
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
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
