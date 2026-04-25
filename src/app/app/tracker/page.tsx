'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { aiAPI, bankingAPI } from '@/lib/api';
import { getPayPeriods, isBillInPeriod, billBelongsToPaycheck } from '@/lib/payPeriods';
import type { Bill } from '@/context/AppContext';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import CategoryIcon from '@/components/CategoryIcon';
import CorrectionBadge from '@/components/ai/CorrectionBadge';
import CorrectionDetailModal from '@/components/ai/CorrectionDetailModal';
import { TrackerSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';

// Statuses the backend considers a valid bank match — single source of truth.
const VALID_MATCH_STATUSES = ['active', 'confirmed', 'pending_confirmation'];
const PAID_MATCH_STATUSES = ['active', 'confirmed'];

/**
 * Payment Tracker — REDESIGNED with modern UI
 * Preserves all mobile logic: pay period filtering, split tracking, bank match badges
 * NEW: AI Correction badges for bills modified by AI audits
 */

export default function TrackerPage() {
  const { colors, isDark } = useTheme();
  const {
    bills, billsLoading, incomeSources, incomeLoading, fmt,
    isBillPaid, isSplitPaid, toggleSplitPaid, isUltra, deleteBill,
    refreshBills, refreshPayments, markBillPaid, unmarkBillPaid,
  } = useApp();
  const router = useRouter();
  const [showNext, setShowNext] = useState(false);

  // Bank match data — keyed by bill_id or "billId_p{sort_order}" for split bills
  const [matchData, setMatchData] = useState<Record<string, any>>({});

  // AI Corrections state
  const [aiSettingsAvailable, setAiSettingsAvailable] = useState(false);
  const [aiCorrectionsByBill, setAiCorrectionsByBill] = useState<Record<string, any[]>>({});
  const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);

  // Build bill lookup for normalizing legacy match_log rows
  const billsById = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const b of bills) map[b.id] = b;
    return map;
  }, [bills]);

  /**
   * Normalize raw match_log rows into a keyed map.
   * - Matches WITH split_sort_order → keyed as "billId_p{sort_order}"
   * - Non-split bills → keyed by bill_id
   * - Split-bill matches WITHOUT split_sort_order → skipped (invariant violation)
   */
  const normalizeMatchData = React.useCallback((rawMatches: any[]): Record<string, any> => {
    const keyed: Record<string, any> = {};
    for (const m of rawMatches) {
      if (!VALID_MATCH_STATUSES.includes(m.status)) continue;

      if (m.split_sort_order) {
        keyed[`${m.bill_id}_p${m.split_sort_order}`] = m;
        continue;
      }

      const bill = billsById[m.bill_id];
      if (!bill?.isSplit) {
        keyed[m.bill_id] = m;
        continue;
      }

      // Split bill match_log without split_sort_order is an invariant violation
      // (invariant 7: split_bill_match_no_sort_order). All write paths now enforce
      // the clean rule, so these rows should not exist. Skip them rather than
      // guessing which paycheck they belong to — guessing masks data bugs.
      // The invariant check in /api/debug/user-state will surface these for cleanup.
    }
    return keyed;
  }, [billsById]);

  // Load match history for bank-confirmed bills
  useEffect(() => {
    if (!isUltra) return;
    bankingAPI.getMatchHistory()
      .then((res: any) => {
        setMatchData(normalizeMatchData(res.data?.matches || []));
      })
      .catch(() => {});
  }, [isUltra, billsById, normalizeMatchData]);

  useEffect(() => {
    aiAPI.getSettings().then(s => {
      setAiSettingsAvailable(!!s);
      if (s) {
        aiAPI.getHistory(20).then(res => {
          const map: Record<string, any[]> = {};
          (res?.data?.runs || []).forEach((run: any) => {
            (run.corrections || []).forEach((c: any) => {
              if (c.target_table === 'bills' && c.status === 'applied') {
                (map[c.target_id] ||= []).push(c);
              }
            });
          });
          setAiCorrectionsByBill(map);
        }).catch(() => {});
      }
    }).catch(() => setAiSettingsAvailable(false));
  }, []);

  // Derive pay period from income source
  const primaryIncome = incomeSources.find(s => s.isPrimary) || (incomeSources.length > 0 ? incomeSources[0] : null);
  const freq = primaryIncome?.frequency || '';
  const payPeriods = primaryIncome
    ? getPayPeriods(primaryIncome.nextPayDate, freq)
    : null;

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteBill = (billId: string, billName: string) => {
    if (deleteConfirmId === billId) {
      // Second click = confirm
      deleteBill(billId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(billId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirmId(prev => prev === billId ? null : prev), 3000);
    }
  };

  const loading = billsLoading || incomeLoading;

  if (loading) {
    return <AppLayout pageTitle="Tracker"><TrackerSkeleton /></AppLayout>;
  }

  if (!payPeriods || !primaryIncome) {
    return (
      <AppLayout pageTitle="Tracker">
        <div style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: colors.textMuted }}>Track which expenses you've paid this paycheck period</p>
          </div>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted, backgroundColor: colors.card, borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>No pay schedule found</p>
            <p style={{ fontSize: '13px' }}>Add an income source in Settings to start tracking your expenses by paycheck.</p>
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
    ? bills.filter(b => billBelongsToPaycheck(b, period))
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

  const now = new Date();

  // Per-paycheck paid scoping (MATCHES MOBILE TrackerScreen.tsx)
  // Resolves which billing month a non-split bill belongs to based on its due day
  // and the paycheck period's start/end dates.
  function billPeriodForPaycheck(b: Bill, pd: typeof currentPeriod): { month: number; year: number } {
    if (b.isSplit) {
      return { month: pd.start.getMonth() + 1, year: pd.start.getFullYear() };
    }

    const dueDay = b.dueDay || 1;
    const startCandidate = new Date(
      pd.start.getFullYear(),
      pd.start.getMonth(),
      Math.min(dueDay, new Date(pd.start.getFullYear(), pd.start.getMonth() + 1, 0).getDate())
    );
    const endCandidate = new Date(
      pd.end.getFullYear(),
      pd.end.getMonth(),
      Math.min(dueDay, new Date(pd.end.getFullYear(), pd.end.getMonth() + 1, 0).getDate())
    );
    const startOfPeriod = new Date(pd.start.getFullYear(), pd.start.getMonth(), pd.start.getDate());
    const endOfPeriod = new Date(pd.end.getFullYear(), pd.end.getMonth(), pd.end.getDate(), 23, 59, 59, 999);
    const inPeriod = [startCandidate, endCandidate].find(d => d >= startOfPeriod && d <= endOfPeriod);
    if (inPeriod) {
      return { month: inPeriod.getMonth() + 1, year: inPeriod.getFullYear() };
    }
    if (
      b.pinnedPaycheck === pd.paycheckNumber &&
      startCandidate < startOfPeriod &&
      startCandidate.getMonth() === pd.start.getMonth() &&
      startCandidate.getFullYear() === pd.start.getFullYear()
    ) {
      return { month: startCandidate.getMonth() + 1, year: startCandidate.getFullYear() };
    }

    const crossesMonth = pd.start.getMonth() !== pd.end.getMonth() ||
      pd.start.getFullYear() !== pd.end.getFullYear();
    const billMonthDate = crossesMonth && dueDay >= pd.start.getDate()
      ? pd.start
      : pd.end;
    return { month: billMonthDate.getMonth() + 1, year: billMonthDate.getFullYear() };
  }

  function billDueDateForPaycheck(b: Bill, pd: typeof currentPeriod): Date {
    const { month, year } = billPeriodForPaycheck(b, pd);
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(year, month - 1, Math.min(b.dueDay || 1, lastDay));
  }

  function isNonSplitPaidForPaycheck(b: Bill, pd: typeof currentPeriod): boolean {
    const { month, year } = billPeriodForPaycheck(b, pd);
    const autoChecked = b.isAutoPay && billDueDateForPaycheck(b, pd) <= now;
    return isBillPaid(b.id, month, year) || autoChecked || !!matchForBillInPeriod(b, pd.paycheckNumber, pd, PAID_MATCH_STATUSES);
  }

  // Period-scoped split paid check: resolves billing month, then checks bill_payments
  function isSplitPaidForPaycheck(b: Bill, paycheckNum: number, pd: typeof currentPeriod): boolean {
    const { month, year } = billPeriodForPaycheck(b, pd);
    return isSplitPaid(b.id, paycheckNum, month, year) || !!matchForBillInPeriod(b, paycheckNum, pd, PAID_MATCH_STATUSES);
  }

  function matchForBillInPeriod(b: Bill, paycheckNum: number, pd: typeof currentPeriod, statuses = VALID_MATCH_STATUSES): any | null {
    const { month: billPeriodMonth, year: billPeriodYear } = billPeriodForPaycheck(b, pd);
    const matchKey = b.isSplit ? `${b.id}_p${paycheckNum}` : b.id;
    const rawMatch = matchData[matchKey];
    if (!rawMatch || !statuses.includes(rawMatch.status)) return null;
    if (!rawMatch.transaction_date) return null;
    const txDate = new Date(rawMatch.transaction_date);
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();
    if (txMonth !== billPeriodMonth || txYear !== billPeriodYear) return null;
    return rawMatch;
  }

  // Count paid bills (scoped to paycheck period)
  const paidCount = billsInPeriod.reduce((count, bill) => {
    if (bill.isSplit) {
      return count + (isSplitPaidForPaycheck(bill, paycheckNumber, period) ? 1 : 0);
    }
    return isNonSplitPaidForPaycheck(bill, period) ? count + 1 : count;
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
            const isPaid = b.isSplit ? isSplitPaidForPaycheck(b, paycheckNumber, period) : isNonSplitPaidForPaycheck(b, period);
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
            Expenses matched to bank transactions are auto-verified. Look for the 🏦 badge.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout pageTitle="Tracker" topBarActions={paycheckToggle}>
      {/* Show delete button on row hover */}
      <style>{`
        div:hover > .tracker-delete-btn { opacity: 1 !important; }
      `}</style>
      <TwoColumnLayout sidebar={<TrackerSummary />}>
        <section
          className="app-page-hero"
          style={{
            padding: '2rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="app-page-kicker">Expense tracker</p>
            <h1 className="app-page-title">
              {showNext ? 'Next paycheck' : 'This paycheck'} at a glance.
            </h1>
            <p className="app-page-subtitle">
              Bank-verified payments get checked automatically. Manual checks stay scoped to this exact pay period.
            </p>
            <div className="app-metric-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { label: 'Paid', value: `${paidCount} of ${totalCount}`, detail: `${Math.round(progressPercent)}% covered`, color: colors.green },
                { label: 'Pending', value: `${totalCount - paidCount}`, detail: 'still open', color: colors.amber },
                { label: 'Total due', value: fmt(totalBillsThisCheck), detail: period.label, color: colors.text },
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
              const { month: billPeriodMonth, year: billPeriodYear } = billPeriodForPaycheck(bill, period);
              const isPaid = bill.isSplit
                ? isSplitPaidForPaycheck(bill, paycheckNumber, period)
                : isNonSplitPaidForPaycheck(bill, period);
              // Bank match badge is resolved at load time and period-filtered at render time.
              const matchInPeriod = matchForBillInPeriod(bill, paycheckNumber, period);
              const isBankMatched = isUltra && !!matchInPeriod;
              const isStaged = isBankMatched && matchInPeriod!.match_method === 'staged';

              return (
                <div
                  key={bill.id}
                  onClick={() => {
                    if (bill.isSplit) {
                      toggleSplitPaid(bill.id, paycheckNumber, billPeriodMonth, billPeriodYear);
                    } else {
                      if (isPaid) unmarkBillPaid(bill.id, billPeriodMonth, billPeriodYear);
                      else markBillPaid(bill.id, billPeriodMonth, billPeriodYear);
                    }
                  }}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <span>
                        {bill.name}
                        {bill.isSplit && ` · P${paycheckNumber}`}
                      </span>
                      {aiSettingsAvailable && aiCorrectionsByBill[bill.id]?.length > 0 && (
                        <CorrectionBadge
                          correctionCount={aiCorrectionsByBill[bill.id].length}
                          onClick={() => setActiveCorrectionId(aiCorrectionsByBill[bill.id][0].id)}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isBankMatched ? (
                        <>
                          <span style={{ color: isStaged ? colors.amber : colors.green }}>
                            🏦 {isStaged ? 'Staged' : 'Paid'}
                          </span>
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

                  {/* Delete button — visible on hover */}
                  <div
                    className="tracker-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteBill(bill.id, bill.name); }}
                    title={deleteConfirmId === bill.id ? 'Click again to confirm delete' : 'Delete expense'}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: deleteConfirmId === bill.id ? 1 : 0,
                      transition: 'opacity 0.15s ease, background-color 0.15s ease',
                      backgroundColor: deleteConfirmId === bill.id ? 'rgba(220,38,38,0.12)' : 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '14px', color: deleteConfirmId === bill.id ? '#DC2626' : colors.textMuted }}>
                      {deleteConfirmId === bill.id ? '✕' : '🗑'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="tracker" title="No expenses this period" description={`No expenses are due during ${period.label}`} />
        )}
      </TwoColumnLayout>

      {/* Correction detail modal */}
      {activeCorrectionId && (
        <CorrectionDetailModal
          correctionId={activeCorrectionId}
          open={!!activeCorrectionId}
          onClose={() => setActiveCorrectionId(null)}
        />
      )}
    </AppLayout>
  );
}
