'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useSearchParams } from 'next/navigation';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

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

export default function AllTransactionsPage() {
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm"><ChevronLeft size={18} style={{ color: colors.text }} /></Button>
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          {searchParams?.get('accountName') || 'All Transactions'}
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {TABS.map(tab => {
          const count = tabCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.6rem 0.75rem', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                backgroundColor: isActive
                  ? (isDark ? 'rgba(56,189,248,0.15)' : 'rgba(12,74,110,0.08)')
                  : (isDark ? 'rgba(232,229,220,0.04)' : 'rgba(0,0,0,0.03)'),
                color: isActive ? colors.electric : colors.textMuted,
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '0.75rem', fontWeight: 700,
                backgroundColor: isActive
                  ? (isDark ? 'rgba(56,189,248,0.25)' : 'rgba(12,74,110,0.12)')
                  : (isDark ? 'rgba(232,229,220,0.08)' : 'rgba(0,0,0,0.06)'),
                padding: '1px 6px', borderRadius: '8px', minWidth: '22px', textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dateGroups.map(group => (
            <div key={group.dateKey}>
              {/* Date section header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0', marginBottom: '0.25rem',
                position: 'sticky', top: 0, zIndex: 10,
                backgroundColor: colors.background,
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.text, letterSpacing: '0.2px' }}>
                  {group.label}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textMuted }}>
                  {fmt(group.dailyTotal)}
                </span>
              </div>

              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {group.transactions.map((txn, idx) => {
                  const isMatched = txn.display_category === 'matched';
                  const isDeposit = txn.display_category === 'income' || txn.display_category === 'income_matched';
                  const isTransfer = txn.display_category === 'transfer';
                  const isExpanded = expandedId === txn.id;

                  const amountColor = isDeposit
                    ? (isDark ? '#86EFAC' : '#16A34A')
                    : isMatched
                      ? (isDark ? '#34D399' : '#047857')
                      : isTransfer
                        ? (isDark ? '#A78BFA' : '#7C3AED')
                        : (isDark ? '#E8E5DC' : '#1A1814');

                  const categoryLabel = isMatched
                    ? (txn.matched_bill_name || 'Bill')
                    : unmatchedReason(txn);

                  return (
                    <div
                      key={txn.id}
                      style={{
                        borderBottom: idx < group.transactions.length - 1 ? `1px solid ${colors.divider}` : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                    >
                      <div style={{ padding: '0.75rem 1rem' }}>
                        {/* Row: name + amount */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.9rem', fontWeight: 600, color: colors.text,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {cleanMerchantName(txn.merchant_name || txn.cleaned_name || '')}
                            </div>
                            {/* Category line */}
                            <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: unmatchedReasonColor(txn, isDark) }}>
                                {isMatched ? `✓ ${categoryLabel}` : categoryLabel}
                                {txn.display_category === 'possible_bill' && txn.matched_bill_name
                                  ? ` — could be "${txn.matched_bill_name}"`
                                  : ''}
                              </span>
                              {txn.budget_category && !isMatched && txn.budget_category !== categoryLabel && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: unmatchedReasonColor(txn, isDark), opacity: 0.7 }}>
                                  {txn.budget_category}
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.9rem', fontWeight: 700,
                            color: amountColor,
                            flexShrink: 0, marginLeft: '0.75rem',
                          }}>
                            {isDeposit ? '+' : ''}{fmt(txn.amount ?? 0)}
                          </span>
                        </div>

                        {/* Expanded actions */}
                        {isExpanded && (
                          <div style={{
                            display: 'flex', gap: '0.4rem', marginTop: '0.6rem', paddingTop: '0.6rem',
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
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

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
    </div>
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
