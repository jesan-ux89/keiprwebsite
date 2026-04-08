'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

type TransactionCategory = 'all' | 'possible_bill' | 'matched' | 'likely_not_bill' | 'auto_excluded' | 'user_excluded';

interface Transaction {
  id: string;
  merchant_name: string;
  cleaned_name?: string;
  amount: number;
  transaction_date?: string;
  date?: string;
  display_category?: TransactionCategory;
  status?: string;
  confidence_score?: number;
  matched_bill_id?: string;
  matched_bill_name?: string;
  exclusion_rule_value?: string;
}

interface TransactionCounts {
  matched: number;
  possible_bill: number;
  likely_not_bill: number;
  auto_excluded: number;
  user_excluded: number;
}

interface DateGroup {
  dateKey: string;
  label: string;
  transactions: Transaction[];
}

const CATEGORY_TABS: Array<{ key: TransactionCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'matched', label: 'Matched' },
  { key: 'possible_bill', label: 'Possible' },
  { key: 'likely_not_bill', label: 'Not Bills' },
  { key: 'auto_excluded', label: 'Auto-Excl.' },
  { key: 'user_excluded', label: 'User Excl.' },
];

// ── Merchant name cleanup ──
function cleanMerchantName(raw: string): string {
  if (!raw) return 'Unknown';

  let name = raw;

  // Remove trailing reference numbers (long alphanumeric/mixed strings)
  name = name.replace(/\s+[A-Z0-9]{8,}$/i, '');

  // Remove trailing numeric IDs after # or No.
  name = name.replace(/\s*[#][\d]+$/i, '');
  name = name.replace(/\s*No\.?\s*[\d]+$/i, '');

  // Remove common payment method suffixes
  name = name.replace(/\s+(MOBILE PMT|ONLINE PMT|AUTO PAY|AUTOPAY|PAYMENT|ACH|DEBIT|CREDIT|POS|CHECKCARD)$/i, '');

  // Remove trailing state/location codes (2-letter state)
  name = name.replace(/\s+[A-Z]{2}\s*$/i, '');

  // Remove trailing city/state patterns
  name = name.replace(/\s+\w+\s+[A-Z]{2}$/i, '');

  // Remove asterisks and clean up spaces
  name = name.replace(/\*/g, ' ').trim();
  name = name.replace(/\s{2,}/g, ' ');

  // Title-case
  name = name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length <= 2 && word !== 'at') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  if (name.length > 30) {
    name = name.substring(0, 28).trimEnd() + '\u2026';
  }

  return name || 'Unknown';
}

// ── Format section header date ──
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
  } catch {
    return dateStr;
  }
}

export default function AllTransactionsPage() {
  const { colors, isDark } = useTheme();
  const { isUltra, fmt, bills } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [counts, setCounts] = useState<TransactionCounts>({
    matched: 0, possible_bill: 0, likely_not_bill: 0, auto_excluded: 0, user_excluded: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [billPickerTxn, setBillPickerTxn] = useState<Transaction | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  // ── Group transactions by date ──
  const dateGroups: DateGroup[] = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    for (const txn of transactions) {
      const dateStr = txn.transaction_date || txn.date || '';
      const dateKey = dateStr.split('T')[0] || 'unknown';
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(txn);
    }
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map(dateKey => ({
        dateKey,
        label: formatSectionDate(dateKey),
        transactions: grouped[dateKey],
      }));
  }, [transactions]);

  useEffect(() => {
    if (isUltra) fetchTransactions('all');
  }, [isUltra]);

  const onCategoryChange = useCallback((cat: TransactionCategory) => {
    setSelectedCategory(cat);
    setExpandedId(null);
    fetchTransactions(cat);
  }, []);

  const fetchTransactions = async (category: TransactionCategory, isRetryAfterBackfill = false) => {
    setLoading(true);
    try {
      const limit = category === 'all' ? 50 : 200;
      const res = await bankingAPI.getAllTransactions({ category, limit, offset: 0 });
      const txns = Array.isArray(res.data?.transactions) ? res.data.transactions : [];
      const cts = res.data?.counts || { matched: 0, possible_bill: 0, likely_not_bill: 0, auto_excluded: 0, user_excluded: 0 };

      const total = res.data?.total || 0;
      const countSum = Object.values(cts).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
      if (countSum === 0 && total > 0 && !isRetryAfterBackfill) {
        try {
          await bankingAPI.backfillCategories();
          return fetchTransactions(category, true);
        } catch (bfErr) {
          console.error('Backfill failed:', bfErr);
        }
      }

      setTransactions(txns);
      setCounts(cts);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──
  function getCatColor(cat: string) {
    const map: Record<string, { bg: string; text: string }> = {
      matched:          { bg: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(4,120,87,0.08)',   text: isDark ? '#34D399' : '#047857' },
      possible_bill:    { bg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(146,64,14,0.08)',   text: isDark ? '#F59E0B' : '#92400E' },
      likely_not_bill:  { bg: isDark ? 'rgba(107,114,128,0.12)': 'rgba(107,114,128,0.08)', text: isDark ? '#9CA3AF' : '#6B7280' },
      auto_excluded:    { bg: isDark ? 'rgba(248,113,113,0.12)': 'rgba(185,28,28,0.08)',   text: isDark ? '#F87171' : '#B91C1C' },
      user_excluded:    { bg: isDark ? 'rgba(167,139,250,0.12)': 'rgba(126,34,206,0.08)',  text: isDark ? '#A78BFA' : '#7E22CE' },
    };
    return map[cat] || { bg: isDark ? 'rgba(232,229,220,0.06)' : 'rgba(0,0,0,0.04)', text: colors.textMuted };
  }

  function getCatLabel(cat: string) {
    const map: Record<string, string> = {
      matched: 'Matched', possible_bill: 'Possible', likely_not_bill: 'Not a Bill',
      auto_excluded: 'Auto-Excl.', user_excluded: 'User Excl.',
    };
    return map[cat] || '';
  }

  // ── Amount color by category ──
  function amountColor(cat: string): string {
    switch (cat) {
      case 'matched': return isDark ? '#34D399' : '#047857';
      case 'possible_bill': return isDark ? '#FBBF24' : '#B45309';
      case 'likely_not_bill':
      case 'auto_excluded':
      case 'user_excluded': return isDark ? '#6B7280' : '#9CA3AF';
      default: return isDark ? '#38BDF8' : '#0369A1';
    }
  }

  // ── Actions ──
  const handleAddAsBill = async (txn: Transaction) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'add_as_bill' });
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      setSuccess('Bill added!');
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to add bill'); }
    finally { setActioning(null); }
  };

  const handleIgnoreOnce = async (txn: Transaction) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'ignore_once' });
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      setSuccess('Transaction ignored.');
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to ignore transaction'); }
    finally { setActioning(null); }
  };

  const handleAlwaysIgnore = async (txn: Transaction) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'always_ignore' });
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      setSuccess('Exclusion rule created.');
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to create exclusion rule'); }
    finally { setActioning(null); }
  };

  const handleUnlink = async (txn: Transaction) => {
    if (!window.confirm('Unlink this transaction from its bill?')) return;
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'unlink' });
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      setSuccess('Transaction unlinked.');
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to unlink transaction'); }
    finally { setActioning(null); }
  };

  const handleRemoveRule = async (txn: Transaction) => {
    setActioning(txn.id);
    try {
      await bankingAPI.transactionAction(txn.id, { action: 'remove_rule' });
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      setSuccess('Exclusion rule removed.');
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to remove rule'); }
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
      setTransactions(prev => prev.filter(t => t.id !== billPickerTxn.id));
      setBillPickerTxn(null);
      setSuccess(`Linked to ${billName}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch { setError('Failed to link transaction to bill.'); }
    finally { setLinkLoading(false); }
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm"><ChevronLeft size={18} style={{ color: colors.text }} /></Button>
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>All Transactions</h1>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {CATEGORY_TABS.map(tab => {
          const count = tab.key === 'all' ? totalCount : (counts as unknown as Record<string, number>)[tab.key] || 0;
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onCategoryChange(tab.key)}
              style={{
                padding: '0.4rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
                border: isActive ? 'none' : `1px solid ${colors.divider}`, cursor: 'pointer',
                backgroundColor: isActive ? colors.electric : (isDark ? 'rgba(232,229,220,0.06)' : 'rgba(0,0,0,0.04)'),
                color: isActive ? '#1A1814' : colors.textMuted,
              }}
            >
              {tab.label} {count}
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

      {/* Content */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading transactions...</p>
        </Card>
      ) : transactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Eye size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>No transactions</h2>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.85rem' }}>
            {selectedCategory === 'all' ? 'No transactions found yet.' : 'No transactions in this category.'}
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
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted }}>
                  {group.transactions.length}
                </span>
              </div>

              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {group.transactions.map((txn, idx) => {
                  const cat = (txn.display_category || 'likely_not_bill') as TransactionCategory;
                  const catStyle = getCatColor(cat);
                  const isExpanded = expandedId === txn.id;
                  const isPossible = cat === 'possible_bill';

                  return (
                    <div
                      key={txn.id}
                      style={{
                        display: 'flex',
                        borderBottom: idx < group.transactions.length - 1 ? `1px solid ${colors.divider}` : 'none',
                        cursor: 'pointer',
                        backgroundColor: isPossible
                          ? (isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)')
                          : 'transparent',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                    >
                      {/* Possible bill accent bar */}
                      {isPossible && (
                        <div style={{
                          width: '3px', flexShrink: 0,
                          backgroundColor: isDark ? '#F59E0B' : '#D97706',
                          borderRadius: '2px 0 0 2px',
                        }} />
                      )}

                      <div style={{ flex: 1, padding: '0.75rem 1rem' }}>
                        {/* Row: name + amount */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.9rem', fontWeight: 600,
                              color: isPossible ? (isDark ? '#FCD34D' : '#92400E') : colors.text,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {cleanMerchantName(txn.merchant_name || txn.cleaned_name || '')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                              {selectedCategory === 'all' && (
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: 600, padding: '1px 5px', borderRadius: '4px',
                                  backgroundColor: catStyle.bg, color: catStyle.text,
                                }}>
                                  {getCatLabel(cat)}
                                </span>
                              )}
                              {cat === 'matched' && txn.matched_bill_name && (
                                <span style={{ fontSize: '0.7rem', color: getCatColor('matched').text }}>
                                  → {txn.matched_bill_name}
                                </span>
                              )}
                              {isPossible && txn.matched_bill_name && (
                                <span style={{
                                  fontSize: '0.7rem', fontWeight: 500, fontStyle: 'italic',
                                  color: isDark ? '#FBBF24' : '#B45309',
                                }}>
                                  Could be &ldquo;{txn.matched_bill_name}&rdquo;?
                                </span>
                              )}
                              {isPossible && !txn.matched_bill_name && (
                                <span style={{
                                  fontSize: '0.7rem', fontWeight: 500, fontStyle: 'italic',
                                  color: isDark ? '#FBBF24' : '#B45309',
                                }}>
                                  Click to review
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.9rem', fontWeight: 700,
                            color: amountColor(cat),
                            flexShrink: 0, marginLeft: '0.75rem',
                          }}>
                            {fmt(txn.amount ?? 0)}
                          </span>
                        </div>

                        {/* Expanded actions */}
                        {isExpanded && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {cat === 'possible_bill' && (
                              <>
                                <ActionLink color={colors.electric} onClick={() => handleAddAsBill(txn)} disabled={actioning === txn.id}>Add as Bill</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink color={colors.electric} onClick={() => handleLinkToExisting(txn)}>Link to Existing</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink onClick={() => handleIgnoreOnce(txn)} disabled={actioning === txn.id}>Ignore</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink onClick={() => handleAlwaysIgnore(txn)} disabled={actioning === txn.id}>Always Ignore</ActionLink>
                              </>
                            )}
                            {cat === 'matched' && (
                              <>
                                {txn.matched_bill_id && (
                                  <Link href={`/app/bills`} style={{ textDecoration: 'none' }}>
                                    <ActionLink color={colors.electric}>View Bill</ActionLink>
                                  </Link>
                                )}
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink color={isDark ? '#F87171' : '#B91C1C'} onClick={() => handleUnlink(txn)} disabled={actioning === txn.id}>Unlink</ActionLink>
                              </>
                            )}
                            {cat === 'likely_not_bill' && (
                              <>
                                <ActionLink color={colors.electric} onClick={() => handleAddAsBill(txn)} disabled={actioning === txn.id}>Actually a Bill</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink color={colors.electric} onClick={() => handleLinkToExisting(txn)}>Link to Existing</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink onClick={() => handleIgnoreOnce(txn)} disabled={actioning === txn.id}>Ignore</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink onClick={() => handleAlwaysIgnore(txn)} disabled={actioning === txn.id}>Always Ignore</ActionLink>
                              </>
                            )}
                            {cat === 'auto_excluded' && (
                              <>
                                <ActionLink color={colors.electric} onClick={() => handleAddAsBill(txn)} disabled={actioning === txn.id}>This IS a Bill</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink>Keep Excluded</ActionLink>
                              </>
                            )}
                            {cat === 'user_excluded' && (
                              <>
                                <ActionLink color={colors.electric} onClick={() => handleRemoveRule(txn)} disabled={actioning === txn.id}>Remove Rule</ActionLink>
                                <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>·</span>
                                <ActionLink>Keep Excluded</ActionLink>
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
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
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

function ActionLink({ children, color, onClick, disabled }: {
  children: React.ReactNode; color?: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      disabled={disabled}
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem', fontWeight: 600, padding: '2px 0',
        color: color || '#9CA3AF', opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
