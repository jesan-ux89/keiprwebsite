'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AppLayout from '@/components/layout/AppLayout';
import { ChevronLeft, AlertCircle, Eye, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import MerchantLogo from '@/components/MerchantLogo';

// ── Types ──

type TabKey = 'all' | 'matched' | 'unmatched';

interface Transaction {
  id: string;
  merchant_name: string;
  cleaned_name?: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  display_category?: string;
  status?: string;
  confidence_score?: number;
  matched_bill_id?: string;
  matched_bill_name?: string;
  exclusion_rule_value?: string;
  user_action?: string;
  budget_category?: string;
  classification?: string;
}

interface TransactionCounts {
  matched: number;
  possible_bill: number;
  likely_not_bill: number;
  spending: number;
  transfer: number;
  income: number;
  income_matched: number;
  auto_excluded: number;
  user_excluded: number;
}

interface DateGroup {
  dateKey: string;
  label: string;
  transactions: Transaction[];
  dailyTotal: number;
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'matched', label: 'Bills' },
  { key: 'unmatched', label: 'Spending' },
];

// ── Helpers ──

function cleanMerchantName(raw: string): string {
  if (!raw) return 'Unknown';
  let name = raw;
  name = name.replace(/\s+[A-Z0-9]{8,}$/i, '');
  name = name.replace(/\s*[#][\d]+$/i, '');
  name = name.replace(/\s*No\.?\s*[\d]+$/i, '');
  name = name.replace(/\s+(MOBILE PMT|ONLINE PMT|AUTO PAY|AUTOPAY|PAYMENT|ACH|DEBIT|CREDIT|POS|CHECKCARD)$/i, '');
  name = name.replace(/\s+[A-Z]{2}\s*$/i, '');
  name = name.replace(/\s+\w+\s+[A-Z]{2}$/i, '');
  name = name.replace(/\*/g, ' ').trim();
  name = name.replace(/\s{2,}/g, ' ');
  name = name.toLowerCase().split(' ').map(word => {
    if (word.length <= 2 && word !== 'at') return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
  if (name.length > 30) name = name.substring(0, 28).trimEnd() + '\u2026';
  return name || 'Unknown';
}

function formatSectionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function unmatchedReason(txn: Transaction): string {
  const cat = txn.display_category || '';
  if (cat === 'user_excluded') return 'Excluded by you';
  if (cat === 'auto_excluded') return 'Auto-excluded';
  if (cat === 'possible_bill') return 'Possible match';
  if (cat === 'income_matched') return 'Paycheck';
  if (cat === 'income') return 'Income';
  if (cat === 'transfer') return 'Transfer';
  if (cat === 'spending' || cat === 'likely_not_bill') {
    return txn.budget_category || 'Spending';
  }
  return 'Not matched';
}

function unmatchedReasonColor(txn: Transaction, isDark: boolean): string {
  const cat = txn.display_category || '';
  if (cat === 'possible_bill') return isDark ? '#FBBF24' : '#B45309';
  if (cat === 'user_excluded' || cat === 'auto_excluded') return isDark ? '#A78BFA' : '#7E22CE';
  if (cat === 'spending') return isDark ? '#34D399' : '#059669';
  if (cat === 'income_matched') return isDark ? '#86EFAC' : '#16A34A';
  if (cat === 'income') return isDark ? '#60A5FA' : '#2563EB';
  if (cat === 'transfer') return isDark ? '#A78BFA' : '#7C3AED';
  return isDark ? '#9CA3AF' : '#6B7280';
}

// ── Main component ──

export default function AllTransactionsPageWrapper() {
  return (
    <Suspense fallback={<AppLayout pageTitle="Transactions"><div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Loading...</div></AppLayout>}>
      <AllTransactionsPage />
    </Suspense>
  );
}

function AllTransactionsPage() {
  const { colors, isDark } = useTheme();
  const { isUltra, fmt, bills } = useApp();
  const searchParams = useSearchParams();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [counts, setCounts] = useState<TransactionCounts>({
    matched: 0, possible_bill: 0, likely_not_bill: 0, spending: 0, transfer: 0, income: 0, income_matched: 0, auto_excluded: 0, user_excluded: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [billPickerTxn, setBillPickerTxn] = useState<Transaction | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [interestEarned, setInterestEarned] = useState({ thisMonth: 0, thisYear: 0, count: 0 });
  const [interestCharged, setInterestCharged] = useState<{
    thisMonth: number;
    lastMonth: number;
    monthlyBreakdown: Array<{ month: string; shortMonth: string; amount: number }>;
    twelveMonthTotal: number;
    monthlyAverage: number;
    count: number;
  }>({ thisMonth: 0, lastMonth: 0, monthlyBreakdown: [], twelveMonthTotal: 0, monthlyAverage: 0, count: 0 });
  const [interestExpanded, setInterestExpanded] = useState(false);

  // ── Derived: filter by active tab ──
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return allTransactions;
    if (activeTab === 'matched') return allTransactions.filter(t => t.display_category === 'matched');
    return allTransactions.filter(t => t.display_category !== 'matched');
  }, [allTransactions, activeTab]);

  // ── Derived: group into date sections ──
  const dateGroups: DateGroup[] = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    for (const txn of filteredTransactions) {
      const dateStr = txn.transaction_date || txn.date || '';
      const dateKey = dateStr.split('T')[0] || 'unknown';
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(txn);
    }
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(dateKey => {
        const txns = grouped[dateKey];
        const dailyTotal = txns.reduce((sum, t) => sum + (t.amount || 0), 0);
        return { dateKey, label: formatSectionDate(dateKey), transactions: txns, dailyTotal };
      });
  }, [filteredTransactions]);

  // ── Tab counts ──
  const matchedCount = counts.matched || 0;
  const unmatchedCount = (counts.possible_bill || 0) + (counts.likely_not_bill || 0) + (counts.spending || 0) + (counts.transfer || 0) + (counts.income || 0) + (counts.income_matched || 0) + (counts.auto_excluded || 0) + (counts.user_excluded || 0);
  const allCount = matchedCount + unmatchedCount;

  function tabCount(key: TabKey): number {
    if (key === 'all') return allCount;
    if (key === 'matched') return matchedCount;
    return unmatchedCount;
  }

  // ── Data fetching ──

  useEffect(() => {
    if (isUltra) {
      fetchTransactions();
      fetchInterestEarned();
      fetchInterestCharged();
    }
  }, [isUltra, searchParams]);

  const fetchInterestEarned = async () => {
    const accountType = searchParams?.get('accountType');
    const accountId = searchParams?.get('accountId');
    if (!accountId || !accountType?.toLowerCase().includes('saving')) {
      setInterestEarned({ thisMonth: 0, thisYear: 0, count: 0 });
      return;
    }
    try {
      const res = await bankingAPI.getAllTransactions({ category: 'all', days: 365, limit: 500, accountId });
      const txns = (res as any).data?.transactions || [];
      const interestTxns = txns.filter((t: any) => {
        const name = (t.cleaned_name || t.merchant_name || '').toUpperCase();
        return name.includes('INTEREST');
      });
      const now = new Date();
      const thisMonth = interestTxns
        .filter((t: any) => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      const thisYear = interestTxns
        .filter((t: any) => new Date(t.transaction_date).getFullYear() === now.getFullYear())
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      setInterestEarned({ thisMonth, thisYear, count: interestTxns.length });
    } catch (err) {
      console.log('Error fetching interest:', err);
    }
  };

  const CREDIT_TYPES = ['credit card', 'credit_card', 'credit', 'line_of_credit', 'credit_line'];
  const isCreditAccount = CREDIT_TYPES.some(c => (searchParams?.get('accountType') || '').toLowerCase().includes(c));

  const fetchInterestCharged = async () => {
    const accountType = searchParams?.get('accountType');
    const accountId = searchParams?.get('accountId');
    if (!accountId || !CREDIT_TYPES.some(c => (accountType || '').toLowerCase().includes(c))) {
      setInterestCharged({ thisMonth: 0, lastMonth: 0, monthlyBreakdown: [], twelveMonthTotal: 0, monthlyAverage: 0, count: 0 });
      return;
    }
    try {
      const res = await bankingAPI.getAllTransactions({ category: 'all', days: 365, limit: 1000, accountId });
      const txns = (res as any).data?.transactions || [];
      const INTEREST_RE = /\b(INTEREST\s*(CHARGE|CHG)?|FINANCE\s*CHARGE|FINANCE\s*CHG|MIN(IMUM)?\s*INT(EREST)?\s*(CHARGE|CHG)?|PURCHASE\s*INT(EREST)?|CASH\s*ADV(ANCE)?\s*INT(EREST)?)\b/i;
      const interestTxns = txns.filter((t: any) => {
        const name = (t.cleaned_name || t.merchant_name || '').toUpperCase();
        const pfc = (t.personal_finance_category || '').toUpperCase();
        return (INTEREST_RE.test(name) || name.includes('INTEREST') || pfc.includes('INTEREST')) && t.amount > 0;
      });
      if (interestTxns.length === 0) {
        setInterestCharged({ thisMonth: 0, lastMonth: 0, monthlyBreakdown: [], twelveMonthTotal: 0, monthlyAverage: 0, count: 0 });
        return;
      }
      const now = new Date();
      const monthMap: Record<string, number> = {};
      for (const t of interestTxns) {
        const d = new Date(t.transaction_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + Math.abs(t.amount);
      }
      const months: Array<{ month: string; shortMonth: string; amount: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
        months.push({ month: key, shortMonth, amount: monthMap[key] || 0 });
      }
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
      const twelveMonthTotal = Object.values(monthMap).reduce((sum, v) => sum + v, 0);
      const monthsWithData = Object.keys(monthMap).length;
      setInterestCharged({
        thisMonth: monthMap[thisMonthKey] || 0,
        lastMonth: monthMap[lastMonthKey] || 0,
        monthlyBreakdown: months,
        twelveMonthTotal,
        monthlyAverage: monthsWithData > 0 ? twelveMonthTotal / monthsWithData : 0,
        count: interestTxns.length,
      });
    } catch (err) {
      console.log('Error fetching interest charged:', err);
    }
  };

  const fetchTransactions = async (isRetryAfterBackfill = false) => {
    setLoading(true);
    try {
      const accountId = searchParams?.get('accountId') || undefined;
      const res = await bankingAPI.getAllTransactions({ category: 'all', limit: accountId ? 500 : 300, offset: 0, days: accountId ? 365 : 90, accountId });
      const txns = Array.isArray(res.data?.transactions) ? res.data.transactions : [];
      const cts = res.data?.counts || { matched: 0, possible_bill: 0, likely_not_bill: 0, spending: 0, transfer: 0, income: 0, income_matched: 0, auto_excluded: 0, user_excluded: 0 };

      const total = res.data?.total || 0;
      const countSum = Object.values(cts).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
      if (countSum === 0 && total > 0 && !isRetryAfterBackfill) {
        try {
          await bankingAPI.backfillCategories();
          return fetchTransactions(true);
        } catch (bfErr) {
          console.error('Backfill failed:', bfErr);
        }
      }

      // Auto-reclassify: run once on first load to fix any misclassified transactions
      const needsReclassify = (cts.likely_not_bill || 0) > 0
        || ((cts.transfer || 0) === 0 && (cts.income || 0) === 0 && (cts.spending || 0) > 5);
      if (needsReclassify && !isRetryAfterBackfill) {
        try {
          await bankingAPI.reclassifySpending();
          return fetchTransactions(true);
        } catch (rcErr) {
          console.error('Reclassify failed:', rcErr);
        }
      }

      setAllTransactions(txns);
      setCounts(cts);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  }

  // ── Actions ──

  const handleAddAsBill = async (txn: Transaction, oneTime = false) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'add_as_bill' });
      // On web we can't navigate to AddBill with prefill like mobile,
      // so we just remove from list and show success
      setAllTransactions(prev => prev.filter(t => t.id !== txn.id));
      showSuccess(oneTime ? 'Added as one-time bill!' : 'Added as recurring bill!');
    } catch { setError('Failed to add bill'); }
    finally { setActioning(null); }
  };

  const handleUnlink = async (txn: Transaction) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'unlink' });
      setAllTransactions(prev => prev.map(t =>
        t.id === txn.id ? { ...t, display_category: 'likely_not_bill', matched_bill_id: undefined, matched_bill_name: undefined } : t
      ));
      setExpandedId(null);
      showSuccess('Transaction unlinked');
    } catch { setError('Failed to unlink transaction'); }
    finally { setActioning(null); }
  };

  const handleAlwaysIgnore = async (txn: Transaction) => {
    if (!window.confirm(`Always ignore transactions from "${cleanMerchantName(txn.merchant_name || '')}"?`)) return;
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'always_ignore' });
      setAllTransactions(prev => prev.filter(t => t.id !== txn.id));
      showSuccess('Exclusion rule created');
    } catch { setError('Failed to create exclusion rule'); }
    finally { setActioning(null); }
  };

  const handleLinkToExisting = (txn: Transaction) => {
    setBillPickerTxn(txn);
  };

  const handleBillSelected = async (billId: string, billName: string) => {
    if (!billPickerTxn) return;
    setLinkLoading(true);
    try {
      await bankingAPI.transactionAction(billPickerTxn.id, { action: 'link_bill', bill_id: billId });
      setAllTransactions(prev => prev.map(t =>
        t.id === billPickerTxn.id ? { ...t, display_category: 'matched', matched_bill_id: billId, matched_bill_name: billName } : t
      ));
      setBillPickerTxn(null);
      setExpandedId(null);
      showSuccess(`Linked to ${billName}`);
    } catch { setError('Failed to link transaction.'); }
    finally { setLinkLoading(false); }
  };

  // ── Ultra gate ──

  if (!isUltra) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app/banking" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm"><ChevronLeft size={18} style={{ color: colors.text }} /></Button>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>All Transactions</h1>
        </div>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={48} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ color: colors.text, margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Ultra Plan Required</h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>View all synced bank transactions with Ultra plan.</p>
        </Card>
      </div>
    );
  }

  // ── Main render ──

  // Build topBarActions with search and filter buttons
  const topBarActions = (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <button style={{
        padding: '0.5rem 1rem', borderRadius: '0.625rem',
        border: `1px solid ${colors.divider}`, backgroundColor: colors.card,
        color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <Search size={16} />
        Search
      </button>
      <button style={{
        padding: '0.5rem 1rem', borderRadius: '0.625rem',
        border: `1px solid ${colors.divider}`, backgroundColor: colors.card,
        color: colors.textMuted, fontSize: '0.875rem', fontWeight: 500,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <Filter size={16} />
        Filter
      </button>
    </div>
  );

  return (
    <AppLayout
      pageTitle={searchParams?.get('accountName') || 'Transactions'}
      topBarActions={topBarActions}
    >
      <div style={{ maxWidth: '900px' }}>
        {/* Tab Bar with underline style */}
        <Card style={{ padding: '0 1rem', marginBottom: '1.5rem', borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${colors.divider}` }}>
            {TABS.map(tab => {
              const count = tabCount(tab.key);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                  style={{
                    flex: 1, padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 500,
                    border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                    color: isActive ? colors.electric : colors.textMuted,
                    borderBottom: isActive ? `2px solid ${colors.electric}` : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    color: isActive ? colors.electric : colors.textMuted,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

      {/* Banners */}
      {error && (
        <div style={{ padding: '0.6rem 1rem', marginBottom: '0.75rem', borderRadius: '0.5rem',
          backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(185,28,28,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: isDark ? '#F87171' : '#B91C1C' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{ padding: '0.6rem 1rem', marginBottom: '0.75rem', borderRadius: '0.5rem',
          backgroundColor: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(4,120,87,0.08)' }}>
          <span style={{ fontSize: '0.8rem', color: isDark ? '#34D399' : '#047857' }}>{success}</span>
        </div>
      )}

      {/* Interest Earned Card */}
      {searchParams?.get('accountType')?.toLowerCase().includes('saving') && interestEarned.count > 0 && (
        <div style={{
          background: isDark ? 'rgba(10,123,108,0.08)' : 'rgba(10,123,108,0.06)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          border: `1px solid ${isDark ? 'rgba(10,123,108,0.2)' : 'rgba(10,123,108,0.15)'}`,
        }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0A7B6C', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
            Interest Earned
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', color: colors.textMuted, margin: '0 0 2px 0' }}>This Month</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0A7B6C', margin: 0 }}>{fmt(interestEarned.thisMonth)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6875rem', color: colors.textMuted, margin: '0 0 2px 0' }}>Year to Date</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0A7B6C', margin: 0 }}>{fmt(interestEarned.thisYear)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Interest Costs Card (Credit Cards) */}
      {isCreditAccount && interestCharged.count > 0 && (
        <div
          onClick={() => setInterestExpanded(!interestExpanded)}
          style={{
            background: isDark ? 'rgba(248,113,113,0.08)' : 'rgba(220,38,38,0.06)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            border: `1px solid ${isDark ? 'rgba(248,113,113,0.2)' : 'rgba(220,38,38,0.15)'}`,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: isDark ? '#F87171' : '#DC2626', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Interest Costs
            </p>
            <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>
              {interestExpanded ? '▲' : '▼'}
            </span>
          </div>

          {/* Collapsed: this month + trend + average */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '0.6875rem', color: colors.textMuted, margin: '0 0 2px 0' }}>This Month</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 800, color: isDark ? '#F87171' : '#DC2626', margin: 0 }}>
                  {fmt(interestCharged.thisMonth)}
                </p>
                {interestCharged.lastMonth > 0 && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    color: interestCharged.thisMonth > interestCharged.lastMonth
                      ? (isDark ? '#F87171' : '#DC2626')
                      : (isDark ? '#34D399' : '#059669'),
                  }}>
                    {interestCharged.thisMonth > interestCharged.lastMonth ? '↑' : interestCharged.thisMonth < interestCharged.lastMonth ? '↓' : '→'}
                    {' '}{Math.abs(Math.round(((interestCharged.thisMonth - interestCharged.lastMonth) / interestCharged.lastMonth) * 100))}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.6875rem', color: colors.textMuted, margin: '0 0 2px 0' }}>Monthly Avg</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: isDark ? '#F87171' : '#DC2626', margin: 0 }}>
                {fmt(interestCharged.monthlyAverage)}
              </p>
            </div>
          </div>

          {/* Expanded: 6-month bar chart + 12-month total */}
          {interestExpanded && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${isDark ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.1)'}` }}>
              {/* Mini bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginBottom: 8 }}>
                {(() => {
                  const maxAmt = Math.max(...interestCharged.monthlyBreakdown.map(m => m.amount), 1);
                  return interestCharged.monthlyBreakdown.map((m, i) => {
                    const barHeight = maxAmt > 0 ? Math.max((m.amount / maxAmt) * 60, m.amount > 0 ? 4 : 0) : 0;
                    const isCurrentMonth = i === interestCharged.monthlyBreakdown.length - 1;
                    return (
                      <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        {m.amount > 0 && (
                          <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: colors.textMuted }}>
                            {fmt(m.amount)}
                          </span>
                        )}
                        <div style={{
                          width: '60%',
                          height: barHeight,
                          borderRadius: 4,
                          backgroundColor: isCurrentMonth
                            ? (isDark ? '#F87171' : '#DC2626')
                            : (isDark ? 'rgba(248,113,113,0.4)' : 'rgba(220,38,38,0.25)'),
                        }} />
                        <span style={{ fontSize: '0.625rem', color: isCurrentMonth ? (isDark ? '#F87171' : '#DC2626') : colors.textMuted, fontWeight: isCurrentMonth ? 700 : 500 }}>
                          {m.shortMonth}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* 12-month total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 8, paddingTop: 10, borderTop: `1px solid ${isDark ? 'rgba(248,113,113,0.15)' : 'rgba(220,38,38,0.1)'}`,
              }}>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>12-Month Total</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: isDark ? '#F87171' : '#DC2626' }}>
                  {fmt(interestCharged.twelveMonthTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading transactions...</p>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Eye size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            {activeTab === 'matched' ? 'No matched transactions' : activeTab === 'unmatched' ? 'Nothing unmatched' : 'No transactions yet'}
          </h2>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.85rem' }}>
            {activeTab === 'matched'
              ? 'Matched transactions will appear here when synced charges link to your bills.'
              : activeTab === 'unmatched'
              ? 'All synced transactions have been matched to bills.'
              : 'Sync your bank to see transactions here.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {dateGroups.map(group => (
            <div key={group.dateKey}>
              {/* Date section header with background */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                borderRadius: '0.5rem',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors.text, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                  {group.label}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textMuted }}>
                  {fmt(group.dailyTotal)}
                </span>
              </div>

              {/* Transaction rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {group.transactions.map((txn) => {
                  const isMatched = txn.display_category === 'matched';
                  const isDeposit = txn.display_category === 'income' || txn.display_category === 'income_matched';
                  const isTransfer = txn.display_category === 'transfer';
                  const isExpanded = expandedId === txn.id;

                  const isCredit = (txn.amount ?? 0) < 0;
                  const amountColor = (isDeposit || isCredit)
                    ? (isDark ? '#86EFAC' : '#16A34A')
                    : isMatched
                      ? (isDark ? '#34D399' : '#047857')
                      : isTransfer
                        ? (isDark ? '#A78BFA' : '#7C3AED')
                        : (isDark ? '#E8E5DC' : '#1A1814');

                  const categoryLabel = isMatched
                    ? (txn.matched_bill_name || 'Bill')
                    : unmatchedReason(txn);

                  // Get merchant initials for logo
                  const merchantName = cleanMerchantName(txn.merchant_name || txn.cleaned_name || '');
                  const initials = merchantName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

                  // Category color dot
                  const categoryDotColor = unmatchedReasonColor(txn, isDark);

                  return (
                    <Card
                      key={txn.id}
                      style={{
                        padding: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        backgroundColor: isExpanded ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') : colors.card,
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.borderColor = colors.electric;
                          (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(56,189,248,0.03)' : 'rgba(56,189,248,0.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          (e.currentTarget as HTMLElement).style.borderColor = colors.divider;
                          (e.currentTarget as HTMLElement).style.backgroundColor = colors.card;
                        }
                      }}
                    >
                      {/* Main row: logo + merchant + category + amount */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Merchant logo */}
                        <MerchantLogo
                          billName={merchantName}
                          category={txn.personal_finance_category_primary || txn.category || 'Other'}
                          size={32}
                          isDark={isDark}
                        />

                        {/* Merchant name + category */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.82rem', fontWeight: 500, color: colors.text,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: '0.2rem',
                          }}>
                            {merchantName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              backgroundColor: categoryDotColor, flexShrink: 0,
                            }} />
                            <span style={{ fontSize: '0.7rem', color: categoryDotColor, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {categoryLabel}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <span style={{
                          fontSize: '0.82rem', fontWeight: 600,
                          color: amountColor,
                          flexShrink: 0, whiteSpace: 'nowrap',
                        }}>
                          {(isDeposit || isCredit) ? '+' : ''}{fmt(Math.abs(txn.amount ?? 0))}
                        </span>
                      </div>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{
                          display: 'flex', gap: '0.4rem', marginTop: '0.75rem', paddingTop: '0.75rem',
                          borderTop: `1px solid ${colors.divider}`, flexWrap: 'wrap',
                        }}>
                          {isMatched ? (
                            <>
                              {txn.matched_bill_id && (
                                <Link href="/app/bills" style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                                  <ActionBtn color={colors.electric}>View Bill</ActionBtn>
                                </Link>
                              )}
                              <ActionBtn
                                color={isDark ? '#F87171' : '#DC2626'}
                                onClick={() => handleUnlink(txn)}
                                disabled={actioning === txn.id}
                              >
                                {actioning === txn.id ? 'Unlinking...' : 'Unlink'}
                              </ActionBtn>
                            </>
                          ) : (
                            <>
                              <ActionBtn
                                color={colors.electric}
                                primary
                                onClick={() => handleAddAsBill(txn, false)}
                                disabled={actioning === txn.id}
                              >
                                {actioning === txn.id ? 'Adding...' : 'Recurring Bill'}
                              </ActionBtn>
                              <ActionBtn
                                color={colors.electric}
                                onClick={() => handleAddAsBill(txn, true)}
                                disabled={actioning === txn.id}
                              >
                                One-Time Bill
                              </ActionBtn>
                              <ActionBtn
                                color={colors.electric}
                                onClick={() => handleLinkToExisting(txn)}
                              >
                                Link to Existing
                              </ActionBtn>
                              <ActionBtn
                                color={isDark ? '#9CA3AF' : '#6B7280'}
                                onClick={() => handleAlwaysIgnore(txn)}
                                disabled={actioning === txn.id}
                              >
                                {actioning === txn.id ? 'Ignoring...' : 'Always Ignore'}
                              </ActionBtn>
                            </>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Bill Picker Modal */}
      {billPickerTxn && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}
          onClick={() => setBillPickerTxn(null)}
        >
          <div
            style={{
              backgroundColor: colors.background, borderRadius: '12px',
              width: '90%', maxWidth: '500px', maxHeight: '70vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1rem', borderBottom: `1px solid ${colors.divider}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text }}>
                Link to Bill
              </h3>
              <button
                onClick={() => setBillPickerTxn(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: colors.textMuted }}
              >✕</button>
            </div>
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.divider}` }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.textMuted }}>
                Linking: <strong style={{ color: colors.text }}>{cleanMerchantName(billPickerTxn.merchant_name || '')}</strong> — {fmt(billPickerTxn.amount ?? 0)}
              </p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {linkLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted }}>Linking...</p>
                </div>
              ) : bills.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p style={{ color: colors.textMuted }}>No bills found. Add a bill first.</p>
                </div>
              ) : (
                bills
                  .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                  .map((bill: any) => (
                    <div
                      key={bill.id}
                      onClick={() => handleBillSelected(bill.id, bill.name)}
                      style={{
                        padding: '0.75rem 1rem', cursor: 'pointer',
                        borderBottom: `1px solid ${colors.divider}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>{bill.name}</div>
                        <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                          Due {bill.dueDay}{bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'} · {bill.category || 'Other'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#38BDF8' : '#0369A1' }}>
                        {fmt(bill.total)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Action button component ──

function ActionBtn({ children, color, primary, onClick, disabled }: {
  children: React.ReactNode; color?: string; primary?: boolean; onClick?: (e: React.MouseEvent) => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      disabled={disabled}
      style={{
        padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600,
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: primary ? 'rgba(56,189,248,0.15)' : 'rgba(128,128,128,0.08)',
        color: color || '#9CA3AF',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}
