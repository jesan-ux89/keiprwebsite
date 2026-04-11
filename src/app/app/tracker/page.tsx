'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { getPayPeriods, isBillInPeriod } from '@/lib/payPeriods';
import type { Bill } from '@/context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrackerSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

/**
 * Payment Tracker — PORTED FROM MOBILE TrackerScreen.tsx
 * Uses mobile's exact pay period + bill filtering + split tracking logic.
 */

export default function TrackerPage() {
  const { colors } = useTheme();
  const {
    bills, billsLoading, incomeSources, incomeLoading, fmt,
    isBillPaid, isSplitPaid, toggleSplitPaid, categories, creditCards, isUltra,
  } = useApp();
  const [showNext, setShowNext] = useState(false);

  // Derive pay period from income source (MATCHES MOBILE)
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
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Payment Tracker</h1>
        <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>Track which bills you've paid this paycheck period</p>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted, backgroundColor: colors.card, borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>No pay schedule found</p>
          <p style={{ fontSize: '13px' }}>Add an income source in Settings to start tracking your bills by paycheck.</p>
        </div>
      </div>
    );
  }

  const { current: currentPeriod, next: nextPeriod, isTwiceMonthly, periodsPerMonth } = payPeriods;
  const period = showNext ? nextPeriod : currentPeriod;
  const paycheckNumber = period.paycheckNumber;

  // Filter bills for this period (MATCHES MOBILE: split bills always included)
  const billsInPeriod = isTwiceMonthly
    ? bills.filter(b => b.isSplit || isBillInPeriod(b.dueDay || 1, period))
    : bills;

  // billAmountForPaycheck (MATCHES MOBILE)
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

  // Count paid bills (MATCHES MOBILE: uses isSplitPaid for splits, isBillPaid for non-splits)
  const paidCount = billsInPeriod.reduce((count, bill) => {
    if (bill.isSplit) {
      return count + (isSplitPaid(bill.id, paycheckNumber) ? 1 : 0);
    }
    return isBillPaid(bill.id) ? count + 1 : count;
  }, 0);

  const totalCount = billsInPeriod.length;
  const progressPercent = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  // Total bill amount for this paycheck
  const totalBillsThisCheck = billsInPeriod.reduce((s, b) => s + billAmountForPaycheck(b, paycheckNumber), 0);
  const paycheckIncome = primaryIncome.typicalAmount;
  const remaining = paycheckIncome - totalBillsThisCheck;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>Payment Tracker</h1>
        <p style={{ fontSize: '13px', color: colors.textMuted }}>Track which bills you've paid this paycheck period</p>
      </div>

      {isUltra && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          margin: '0 0 1rem 0', padding: '0.625rem 0.875rem',
          backgroundColor: 'rgba(56,189,248,0.06)',
          borderRadius: '10px', border: '0.5px solid rgba(56,189,248,0.15)',
        }}>
          <span style={{ fontSize: '0.9rem' }}>🏦</span>
          <span style={{ fontSize: '0.75rem', color: colors.textSub }}>
            Bills matched to bank transactions are auto-verified. Look for the 🏦 badge.
          </span>
        </div>
      )}

      {/* Progress */}
      <div style={{
        backgroundColor: colors.card,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: `1px solid ${colors.cardBorder}`,
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Overall Progress
        </div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text, marginBottom: '12px' }}>
          {paidCount} of {totalCount} bills paid
        </div>
        <div style={{ height: '8px', backgroundColor: colors.progressTrack, borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: colors.green, transition: 'width 0.3s ease', width: `${progressPercent}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          <span style={{ fontSize: '12px', color: colors.textMuted }}>Bills: {fmt(totalBillsThisCheck)}</span>
          <span style={{ fontSize: '12px', color: remaining >= 0 ? colors.green : colors.red }}>Remaining: {fmt(remaining)}</span>
        </div>
      </div>

      {/* Navigation */}
      {isTwiceMonthly && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '16px',
        }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: `1px solid ${colors.inputBorder}`,
              backgroundColor: colors.card,
              color: showNext ? colors.text : colors.textMuted,
              cursor: showNext ? 'pointer' : 'default',
              padding: 0,
            }}
            onClick={() => setShowNext(false)}
            disabled={!showNext}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
              {showNext ? 'Next Check' : 'This Check'} — Paycheck {paycheckNumber}
            </div>
            <div style={{ fontSize: '12px', color: colors.textMuted }}>
              {period.label}
            </div>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: `1px solid ${colors.inputBorder}`,
              backgroundColor: colors.card,
              color: !showNext ? colors.text : colors.textMuted,
              cursor: !showNext ? 'pointer' : 'default',
              padding: 0,
            }}
            onClick={() => setShowNext(true)}
            disabled={showNext}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Bills List */}
      {billsInPeriod.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {billsInPeriod.map((bill) => {
            const amt = billAmountForPaycheck(bill, paycheckNumber);
            const isPaid = bill.isSplit
              ? isSplitPaid(bill.id, paycheckNumber)
              : isBillPaid(bill.id);

            return (
              <div
                key={bill.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: '12px',
                  padding: '12px',
                  border: `1px solid ${colors.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => toggleSplitPaid(bill.id, paycheckNumber)}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
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
                    <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>

                {/* Bill info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isPaid ? colors.textMuted : colors.text,
                    textDecoration: isPaid ? 'line-through' : 'none',
                    marginBottom: '4px',
                  }}>
                    {bill.name}
                    {bill.isSplit && ` · P${paycheckNumber}`}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textMuted }}>
                    {bill.category} · Due day {bill.dueDay}
                    {bill.isAutoPay && ' · AutoPay'}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isPaid ? colors.green : colors.text,
                  }}>
                    {fmt(amt)}
                  </div>
                  {isPaid && (
                    <div style={{ fontSize: '11px', color: colors.green }}>Paid</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="tracker" title="No bills this period" description={`No bills are due during ${period.label}`} />
      )}

      {/* Credit Card Summary (Full Dollar Tracking) */}
      {creditCards.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textMuted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Credit Cards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {creditCards.map((cc: any) => {
              const ccBills = (cc.bills || []).filter((b: any) => billsInPeriod.some(bp => bp.id === b.id));
              const ccTotal = ccBills.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
              const ccPaid = ccBills.filter((b: any) => {
                const bill = billsInPeriod.find(bp => bp.id === b.id);
                if (!bill) return false;
                return bill.isSplit ? isSplitPaid(bill.id, paycheckNumber) : isBillPaid(bill.id);
              }).length;

              return (
                <div
                  key={cc.cardName}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${colors.cardBorder}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                      💳 {cc.cardName}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textMuted }}>
                      {ccPaid} of {ccBills.length} charged
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: colors.text }}>
                    {fmt(ccTotal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
