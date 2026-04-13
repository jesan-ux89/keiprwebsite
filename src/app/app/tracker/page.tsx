'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { getPayPeriods, isBillInPeriod } from '@/lib/payPeriods';
import type { Bill } from '@/context/AppContext';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import CategoryIcon from '@/components/CategoryIcon';
import { TrackerSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

/**
 * Payment Tracker — REDESIGNED with modern UI
 * Preserves all mobile logic: pay period filtering, split tracking, bank match badges
 */

export default function TrackerPage() {
  const { colors, isDark } = useTheme();
  const {
    bills, billsLoading, incomeSources, incomeLoading, fmt,
    isBillPaid, isSplitPaid, toggleSplitPaid, isUltra,
  } = useApp();
  const [showNext, setShowNext] = useState(false);

  // Derive pay period from income source
  const primaryIncome = incomeSources.find(s => s.isPrimary) || (incomeSources.length > 0 ? incomeSources[0] : null);
  const freq = primaryIncome?.frequency || '';
  const payPeriods = primaryIncome
    ? getPayPeriods(primaryIncome.nextPayDate, freq)
    : null;

  const loading = billsLoading || incomeLoading;

  if (loading) {
    return <TrackerSkeleton />;
  }

  if (!payPeriods || !primaryIncome) {
    return (
      <AppLayout pageTitle="Tracker">
        <div style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Payment Tracker</h1>
            <p style={{ fontSize: '13px', color: colors.textMuted }}>Track which bills you've paid this paycheck period</p>
          </div>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted, backgroundColor: colors.card, borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>No pay schedule found</p>
            <p style={{ fontSize: '13px' }}>Add an income source in Settings to start tracking your bills by paycheck.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { current: currentPeriod, next: nextPeriod, isTwiceMonthly, periodsPerMonth } = payPeriods;
  const period = showNext ? nextPeriod : currentPeriod;
  const paycheckNumber = period.paycheckNumber;

  // Filter bills for this period
  const billsInPeriod = isTwiceMonthly
    ? bills.filter(b => b.isSplit || isBillInPeriod(b.dueDay || 1, period))
    : bills;

  // billAmountForPaycheck
  function billAmountForPaycheck(b: Bill, paycheck: number): number {
    if (b.isSplit) {
      if (paycheck === 1) return b.p1 || 0;
      if (paycheck === 2) return b.p2 || 0;
      if (paycheck === 3) return b.p3 || 0;
      if (paycheck === 4) return b.p4 || 0;
      return b.p1 || 0;
    }
    return b.total || 0;
  }

  // Count paid bills
  const paidCount = billsInPeriod.reduce((count, bill) => {
    if (bill.isSplit) {
      return count + (isSplitPaid(bill.id, paycheckNumber) ? 1 : 0);
    }
    return isBillPaid(bill.id) ? count + 1 : count;
  }, 0);

  const totalCount = billsInPeriod.length;
  const progressPercent = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  // Totals
  const totalBillsThisCheck = billsInPeriod.reduce((s, b) => s + billAmountForPaycheck(b, paycheckNumber), 0);
  const paycheckIncome = primaryIncome.typicalAmount;
  const remaining = paycheckIncome - totalBillsThisCheck;

  // Paycheck toggle in top bar
  const paycheckToggle = isTwiceMonthly && (
    <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}`, padding: '0.25rem', borderRadius: '0.5rem' }}>
      <button
        onClick={() => setShowNext(false)}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          fontWeight: showNext ? 500 : 600,
          backgroundColor: !showNext ? colors.electric : 'transparent',
          color: !showNext ? '#fff' : colors.text,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        This Check
      </button>
      <button
        onClick={() => setShowNext(true)}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.8rem',
          fontWeight: showNext ? 600 : 500,
          backgroundColor: showNext ? colors.electric : 'transparent',
          color: showNext ? '#fff' : colors.text,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Next Check
      </button>
    </div>
  );

  // Summary sidebar
  const TrackerSummary = () => (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        {showNext ? 'Next' : 'This'} Paycheck
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Total Due</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>
          {fmt(totalBillsThisCheck)}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Paid</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.green }}>
          {fmt(billsInPeriod.reduce((s, b) => {
            const amt = billAmountForPaycheck(b, paycheckNumber);
            const isPaid = b.isSplit ? isSplitPaid(b.id, paycheckNumber) : isBillPaid(b.id);
            return s + (isPaid ? amt : 0);
          }, 0))}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Remaining</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.amber }}>
          {fmt(remaining)}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px' }}>
        {isUltra && (
          <div style={{ fontSize: '11px', color: colors.textMuted, lineHeight: '1.4' }}>
            Bills matched to bank transactions are auto-verified. Look for the 🏦 badge.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout pageTitle="Tracker" topBarActions={paycheckToggle}>
      <TwoColumnLayout sidebar={<TrackerSummary />}>
        {/* Progress Ring Card */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            {/* SVG Progress Ring */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={colors.progressTrack}
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={colors.green}
                strokeWidth="8"
                strokeDasharray={`${(progressPercent / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
              {/* Center text */}
              <text
                x="60"
                y="56"
                textAnchor="middle"
                fontSize="24"
                fontWeight="700"
                fill={colors.text}
              >
                {Math.round(progressPercent)}%
              </text>
              <text
                x="60"
                y="72"
                textAnchor="middle"
                fontSize="11"
                fill={colors.textMuted}
                fontWeight="500"
              >
                covered
              </text>
            </svg>

            {/* Stats column */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Paid</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: colors.green }}>
                    {paidCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Remaining</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: colors.amber }}>
                    {totalCount - paidCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Total</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: colors.text }}>
                    {totalCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${colors.cardBorder}` }} />
        </div>

        {/* Bills List */}
        {billsInPeriod.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {billsInPeriod.map((bill) => {
              const amt = billAmountForPaycheck(bill, paycheckNumber);
              const isPaid = bill.isSplit
                ? isSplitPaid(bill.id, paycheckNumber)
                : isBillPaid(bill.id);
              const isBankMatched = bill.status === 'confirmed' && isUltra;

              return (
                <div
                  key={bill.id}
                  onClick={() => toggleSplitPaid(bill.id, paycheckNumber)}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${colors.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isPaid ? 0.65 : 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {/* Circular Checkbox */}
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: `2px solid ${isPaid ? colors.green : colors.inputBorder}`,
                      backgroundColor: isPaid ? colors.green : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isPaid && (
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>✓</span>
                    )}
                  </div>

                  {/* Category Icon */}
                  <CategoryIcon
                    category={bill.category}
                    size={32}
                    iconScale={0.6}
                    isDark={isDark}
                  />

                  {/* Bill info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: isPaid ? colors.textMuted : colors.text,
                      textDecoration: isPaid ? 'line-through' : 'none',
                      marginBottom: '2px',
                    }}>
                      {bill.name}
                      {bill.isSplit && ` · P${paycheckNumber}`}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isBankMatched ? (
                        <>
                          <span style={{ color: colors.green }}>🏦 Paid</span>
                        </>
                      ) : (
                        <>Due {new Date(new Date().getFullYear(), new Date().getMonth(), bill.dueDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isPaid ? colors.green : colors.text,
                    }}>
                      {fmt(amt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="tracker" title="No bills this period" description={`No bills are due during ${period.label}`} />
        )}
      </TwoColumnLayout>
    </AppLayout>
  );
}
