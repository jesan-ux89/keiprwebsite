'use client';

import React, { useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import CategoryIcon from '@/components/CategoryIcon';
import { CATEGORY_COLORS } from '@/lib/categoryIcons';
import { getPayPeriods, isBillInPeriod } from '@/lib/payPeriods';
import { billsAPI } from '@/lib/api';

const SCHEDULE_TO_FREQ: Record<string, string> = {
  'weekly': 'weekly',
  'biweekly': 'biweekly',
  'semimonthly': 'semimonthly',
  'twicemonthly': 'twicemonthly',
  'monthly': 'monthly',
  'Bi-weekly': 'biweekly',
  'Weekly': 'weekly',
  'Twice a month': 'semimonthly',
  'Monthly': 'monthly',
};

const LEFTOVER_CATEGORIES = [
  { name: 'Groceries', pct: 0.30 },
  { name: 'Dining', pct: 0.15 },
  { name: 'Transport', pct: 0.15 },
  { name: 'Fun', pct: 0.10 },
  { name: 'Savings', pct: 0.30 },
];

type BillEntry = {
  name: string;
  amount: string;
  dueDay: string;
  category: string;
  isSplit?: boolean;
  splits?: string[];
};

type CategoryAllocation = {
  id: string;
  name: string;
  color: string;
  amount: number;
  isBill: boolean;
};

function AllocateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, isDark } = useTheme();
  const { fmt, addBill, addIncomeSource, refreshBills } = useApp();

  // Read query params
  const schedule = searchParams.get('schedule') || 'biweekly';
  const amount = parseFloat(searchParams.get('amount') || '1842') || 1842;
  const nickname = searchParams.get('nickname') || 'Main job';
  const nextPayday = searchParams.get('nextPayday') || '';
  const fromBankImport = searchParams.get('fromBankImport') === 'true';

  // Load bills from sessionStorage
  const onboardingBills = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem('onboarding_bills');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Build category allocations
  const { categories, billCats, suggestedCats, billTotal, afterBills, totalAllocated, remaining, percent, isFullyAllocated } = useMemo(() => {
    const cats: CategoryAllocation[] = [];

    // Group bills by category
    const billByCategory: Record<string, number> = {};
    for (const b of onboardingBills) {
      const cat = b.category || 'Other';
      const total = parseFloat(b.amount || '0') || 0;
      const s1 = parseFloat(b.splits?.[0] || b.split1 || '0') || 0;
      const amt = b.isSplit && s1 > 0 ? s1 : total;
      billByCategory[cat] = (billByCategory[cat] || 0) + amt;
    }

    // Build bill-based category rows
    let idCounter = 1;
    for (const [name, billAmount] of Object.entries(billByCategory)) {
      cats.push({
        id: String(idCounter++),
        name,
        color: CATEGORY_COLORS[name] || '#6B7280',
        amount: Math.round(billAmount),
        isBill: true,
      });
    }

    // Distribute remaining income across suggested categories
    const billsTotalAmt = cats.reduce((s, c) => s + c.amount, 0);
    const leftover = amount - billsTotalAmt;
    if (leftover > 0) {
      const usedNames = new Set(cats.map(c => c.name));
      const available = LEFTOVER_CATEGORIES.filter(c => !usedNames.has(c.name));
      const totalPct = available.reduce((s, c) => s + c.pct, 0);

      let distributed = 0;
      for (let i = 0; i < available.length; i++) {
        const isLast = i === available.length - 1;
        const suggAmt = isLast ? leftover - distributed : Math.round(leftover * (available[i].pct / totalPct));
        cats.push({
          id: String(idCounter++),
          name: available[i].name,
          color: CATEGORY_COLORS[available[i].name] || '#6B7280',
          amount: suggAmt,
          isBill: false,
        });
        distributed += suggAmt;
      }
    }

    const billCatsFiltered = cats.filter(c => c.isBill);
    const suggestedCatsFiltered = cats.filter(c => !c.isBill);
    const billTotalAmt = billCatsFiltered.reduce((s, c) => s + c.amount, 0);
    const afterBillsAmt = amount - billTotalAmt;
    const totalAllocatedAmt = cats.reduce((sum, c) => sum + c.amount, 0);
    const remainingAmt = amount - totalAllocatedAmt;
    const percentVal = Math.min(100, (totalAllocatedAmt / amount) * 100);
    const isFullyAllocatedVal = Math.abs(remainingAmt) < 1;

    return {
      categories: cats,
      billCats: billCatsFiltered,
      suggestedCats: suggestedCatsFiltered,
      billTotal: billTotalAmt,
      afterBills: afterBillsAmt,
      totalAllocated: totalAllocatedAmt,
      remaining: remainingAmt,
      percent: percentVal,
      isFullyAllocated: isFullyAllocatedVal,
    };
  }, [onboardingBills, amount]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoToDashboard = async () => {
    setSaving(true);
    setError(null);

    try {
      // Save income source
      const freq = SCHEDULE_TO_FREQ[schedule] || schedule;
      await addIncomeSource({
        name: nickname,
        frequency: freq,
        typicalAmount: amount,
        nextPayDate: nextPayday || undefined,
      });

      // Save all bills
      for (const bill of onboardingBills) {
        await addBill({
          name: bill.name,
          category: bill.category || 'Other',
          dueDay: parseInt(bill.dueDay || '1', 10),
          total: parseFloat(bill.amount) || 0,
          isSplit: bill.isSplit || false,
          isRecurring: true,
          funded: 0,
          p1: bill.isSplit ? (parseFloat(bill.splits?.[0] || bill.split1) || 0) : (parseFloat(bill.amount) || 0),
          p2: bill.isSplit ? (parseFloat(bill.splits?.[1] || bill.split2) || 0) : 0,
          p3: bill.isSplit ? (parseFloat(bill.splits?.[2]) || 0) : 0,
          p4: bill.isSplit ? (parseFloat(bill.splits?.[3]) || 0) : 0,
          p1done: false,
        });
      }

      // Auto-mark past-due bills (mid-cycle onboarding)
      if (!fromBankImport && onboardingBills.length > 0) {
        try {
          const billsRes = await billsAPI.getAll();
          const savedBills = billsRes.data?.bills || billsRes.data || [];

          const today = new Date();
          const todayDay = today.getDate();
          const month = today.getMonth() + 1;
          const year = today.getFullYear();
          const freq = SCHEDULE_TO_FREQ[schedule] || schedule;
          const periods = getPayPeriods(nextPayday || today.toISOString().split('T')[0], freq, today);
          const currentPeriod = periods.current;

          for (const bill of onboardingBills) {
            const dueDay = parseInt(bill.dueDay || '1', 10);
            if (isBillInPeriod(dueDay, currentPeriod) && dueDay < todayDay) {
              const savedBill = savedBills.find((b: any) =>
                (b.name || '').toLowerCase() === (bill.name || '').toLowerCase()
              );
              if (savedBill) {
                await billsAPI.markPaid({ billId: savedBill.id, periodMonth: month, periodYear: year });
              }
            }
          }

          // Refresh bills state
          await refreshBills();
        } catch (err) {
          console.warn('[ONBOARDING] Auto-mark error (continuing):', (err as any)?.message);
        }
      }

      // Clear sessionStorage
      try {
        sessionStorage.removeItem('onboarding_bills');
      } catch {}

      // Navigate to dashboard
      router.push('/app');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const handleBack = () => {
    const params = new URLSearchParams({
      schedule,
      amount: String(amount),
      nickname,
      nextPayday,
    });
    router.push(`/onboarding/first-bill?${params.toString()}`);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      marginBottom: '32px',
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    backLink: {
      color: colors.electric,
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    stepLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.textMuted,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    },
    progressBar: {
      height: '3px',
      backgroundColor: colors.progressTrack,
      borderRadius: '2px',
      overflow: 'hidden' as const,
      marginTop: '10px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.electric,
      width: '100%',
      transition: 'width 0.3s ease',
    },
    amountHeader: {
      marginBottom: '32px',
      paddingBottom: '20px',
      borderBottom: `0.5px solid ${colors.divider}`,
    },
    cycleLabel: {
      fontSize: '10px',
      fontWeight: '500',
      color: colors.electric,
      opacity: 0.7,
      textTransform: 'uppercase' as const,
      letterSpacing: '1.2px',
      marginBottom: '4px',
    },
    amount: {
      fontSize: '34px',
      fontWeight: '700',
      color: colors.text,
      letterSpacing: '-1px',
      lineHeight: 1.2,
    },
    amountDecimal: {
      fontSize: '18px',
      opacity: 0.7,
    },
    amountSub: {
      fontSize: '11px',
      color: colors.textMuted,
      marginTop: '3px',
      marginBottom: '12px',
    },
    allocTrack: {
      height: '4px',
      backgroundColor: colors.progressTrack,
      borderRadius: '2px',
      overflow: 'hidden' as const,
      marginBottom: '8px',
    },
    allocFill: {
      height: '100%',
      backgroundColor: colors.electric,
      borderRadius: '2px',
    },
    allocLabels: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    allocLabelText: {
      fontSize: '10px',
      color: colors.textMuted,
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    scroll: {
      paddingBottom: '40px',
    },
    errorAlert: {
      backgroundColor: 'rgba(163,45,45,0.1)',
      border: `0.5px solid rgba(163,45,45,0.2)`,
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    },
    errorText: {
      color: '#A32D2D',
      fontSize: '12px',
      flex: 1,
    },
    errorClose: {
      cursor: 'pointer',
      color: '#A32D2D',
      fontWeight: '600',
      fontSize: '16px',
      lineHeight: 1,
    },
    sectionHeader: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.text,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginBottom: '8px',
      marginTop: '24px',
    },
    sectionSub: {
      fontSize: '11px',
      color: colors.textMuted,
      marginBottom: '10px',
      lineHeight: 1.5,
    },
    catRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      padding: '13px',
      marginBottom: '8px',
    },
    catLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    catName: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.text,
    },
    catAmt: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.electric,
    },
    catAmtSuggested: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.textMuted,
    },
    suggestedRow: {
      opacity: 0.7,
    },
    remainingSummary: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `rgba(56,189,248,0.06)`,
      border: `0.5px solid rgba(56,189,248,0.15)`,
      borderRadius: '10px',
      padding: '14px',
      marginTop: '12px',
      marginBottom: '20px',
    },
    remainingSummaryLabel: {
      fontSize: '13px',
      fontWeight: '500',
      color: colors.text,
    },
    remainingSummaryAmt: {
      fontSize: '18px',
      fontWeight: '700',
      color: colors.electric,
    },
    addCat: {
      padding: '13px',
      textAlign: 'center' as const,
      border: `0.5px dashed ${colors.inputBorder}`,
      borderRadius: '10px',
      marginBottom: '12px',
      cursor: 'pointer',
    },
    addCatText: {
      fontSize: '13px',
      color: colors.textMuted,
    },
    successRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgba(10,123,108,0.08)',
      border: `0.5px solid rgba(10,123,108,0.2)`,
      borderRadius: '10px',
      padding: '13px',
      marginBottom: '16px',
    },
    successLabel: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#0A7B6C',
    },
    successAmt: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0A7B6C',
    },
    remainingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      padding: '13px',
      marginBottom: '16px',
    },
    remainingLabel: {
      fontSize: '13px',
      color: colors.textMuted,
    },
    remainingAmt: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.text,
    },
    remainingAmtNegative: {
      color: '#A32D2D',
    },
    footer: {
      marginTop: '20px',
      display: 'flex',
      gap: '12px',
      flexDirection: 'column' as const,
    },
    buttonPrimary: {
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
      transition: 'all 0.2s ease',
      opacity: saving ? 0.7 : 1,
      pointerEvents: saving ? 'none' as const : 'auto' as const,
    },
    buttonSecondary: {
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      border: `1px solid ${colors.midnight}`,
      backgroundColor: 'transparent',
      color: colors.electric,
      transition: 'all 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <a style={styles.backLink} onClick={handleBack}>
            ← Back
          </a>
          <span style={styles.stepLabel}>Step 5 of 5</span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.amountHeader}>
        <div style={styles.cycleLabel}>First paycheck</div>
        <div style={styles.amount}>
          {fmt(amount)}
          <span style={styles.amountDecimal}>.00</span>
        </div>
        <div style={styles.amountSub}>Assign every dollar before you spend it</div>
        <div style={styles.allocTrack}>
          <div style={[styles.allocFill, { width: percent + '%' }]} />
        </div>
        <div style={styles.allocLabels}>
          <span style={styles.allocLabelText}>Allocated</span>
          <span style={styles.allocLabelText}>
            {fmt(totalAllocated)} / {fmt(amount)}
          </span>
        </div>
      </div>

      <div style={styles.content}>
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorText}>{error}</span>
            <a style={styles.errorClose} onClick={() => setError(null)}>
              ✕
            </a>
          </div>
        )}

        {/* YOUR BILLS */}
        <div style={styles.sectionHeader}>Your bills</div>
        {billCats.map(cat => (
          <div key={cat.id} style={styles.catRow}>
            <div style={styles.catLeft}>
              <CategoryIcon category={cat.name} size={28} isDark={isDark} />
              <span style={styles.catName}>{cat.name}</span>
            </div>
            <span style={styles.catAmt}>{fmt(cat.amount)}</span>
          </div>
        ))}

        {/* LEFT AFTER BILLS */}
        <div style={styles.remainingSummary}>
          <span style={styles.remainingSummaryLabel}>Left after bills</span>
          <span style={styles.remainingSummaryAmt}>{fmt(afterBills)}</span>
        </div>

        {/* SUGGESTED BUDGET */}
        {suggestedCats.length > 0 && (
          <>
            <div style={styles.sectionHeader}>Suggested budget</div>
            <div style={styles.sectionSub}>
              We split your remaining {fmt(afterBills)} across common categories. You can adjust these later.
            </div>
            {suggestedCats.map(cat => (
              <div key={cat.id} style={[styles.catRow, styles.suggestedRow]}>
                <div style={styles.catLeft}>
                  <CategoryIcon category={cat.name} size={28} isDark={isDark} />
                  <span style={styles.catName}>{cat.name}</span>
                </div>
                <span style={styles.catAmtSuggested}>{fmt(cat.amount)}</span>
              </div>
            ))}
          </>
        )}

        <div
          style={styles.addCat}
          onClick={() => alert('You can manage budget categories in Settings after setup.')}
        >
          <span style={styles.addCatText}>+ Add category</span>
        </div>

        {/* STATUS */}
        {isFullyAllocated ? (
          <div style={styles.successRow}>
            <span style={styles.successLabel}>✓ Fully allocated</span>
            <span style={styles.successAmt}>{fmt(0)} remaining</span>
          </div>
        ) : (
          <div style={styles.remainingRow}>
            <span style={styles.remainingLabel}>Remaining</span>
            <span style={[styles.remainingAmt, remaining < 0 && styles.remainingAmtNegative]}>
              {fmt(Math.abs(remaining))}
            </span>
          </div>
        )}

        <div style={styles.footer}>
          <button style={styles.buttonPrimary} onClick={handleGoToDashboard} disabled={saving}>
            {saving ? 'Saving...' : 'Go to my dashboard →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllocatePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <AllocateContent />
    </Suspense>
  );
}
