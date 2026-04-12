'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Landmark,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Plus,
  Settings,
  CheckCircle2,
  BarChart3,
  CreditCard,
  FileText,
  TrendingUp,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────── */

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  account_type?: string;
  is_synced: boolean;
  last_sync: string;
  error_type?: string | null;
}

interface AccountBalance {
  id: string;
  current: number;
  available: number;
}

interface AccountWithBalance extends BankAccount {
  balance?: AccountBalance;
}

interface BankingStatus {
  connected: boolean;
  accounts: number;
  lastSync: string;
}

/* ─── Account type grouping ──────────────────────── */

type AccountGroup = 'cash' | 'credit' | 'loan' | 'investment' | 'other';

const CASH_TYPES = ['checking', 'savings', 'money_market', 'paypal', 'prepaid', 'hsa', 'cd', 'depository'];
const CREDIT_TYPES = ['credit card', 'credit_card', 'credit', 'line_of_credit', 'credit_line'];
const LOAN_TYPES = ['loan', 'auto', 'student', 'mortgage', 'personal', 'commercial', 'home_equity'];
const INVESTMENT_TYPES = ['brokerage', '401k', '401a', 'ira', 'roth', 'taxable_brokerage', 'investment', 'mutual_fund'];

function getAccountGroup(accountType?: string): AccountGroup {
  if (!accountType) return 'cash';
  const t = accountType.toLowerCase();
  if (CASH_TYPES.some(c => t.includes(c))) return 'cash';
  if (CREDIT_TYPES.some(c => t.includes(c))) return 'credit';
  if (LOAN_TYPES.some(c => t.includes(c))) return 'loan';
  if (INVESTMENT_TYPES.some(c => t.includes(c))) return 'investment';
  return 'other';
}

function getGroupLabel(group: AccountGroup): string {
  switch (group) {
    case 'cash': return 'Cash';
    case 'credit': return 'Credit Cards';
    case 'loan': return 'Loans';
    case 'investment': return 'Investments';
    default: return 'Other';
  }
}

function getGroupEmoji(group: AccountGroup): string {
  switch (group) {
    case 'cash': return '🏦';
    case 'credit': return '💳';
    case 'loan': return '📋';
    case 'investment': return '📈';
    default: return '🏦';
  }
}

function formatAccountType(accountType?: string): string {
  if (!accountType) return '';
  return accountType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── Component ──────────────────────────────────── */

export default function BankingPage() {
  const { colors, isDark } = useTheme();
  const { isUltra, fmt } = useApp();
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [loanPayments, setLoanPayments] = useState<Record<string, Array<{ date: string; amount: number }>>>({});

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [status, setStatus] = useState<BankingStatus | null>(null);
  const [txnCounts, setTxnCounts] = useState<{ matched: number; unmatched: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncCooldown, setSyncCooldown] = useState(0);

  useEffect(() => {
    if (syncCooldown <= 0) return;
    const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [syncCooldown]);

  useEffect(() => {
    if (isUltra) loadAll();
  }, [isUltra]);

  // Fetch recent loan payments when accounts load
  useEffect(() => {
    if (!accounts.length) return;
    const loanAccts = accounts.filter(a => getAccountGroup(a.account_type) === 'loan');
    if (loanAccts.length === 0) return;
    loanAccts.forEach(async (acc) => {
      try {
        const res = await bankingAPI.getAllTransactions({ category: 'all', days: 180, limit: 200, accountId: acc.id });
        const txns = (res as any).data?.transactions || [];
        const payments = txns
          .filter((t: any) => {
            const name = (t.cleaned_name || t.merchant_name || '').toUpperCase();
            return name.includes('PAYMENT') || name.includes('PMT') || t.amount < 0;
          })
          .slice(0, 3)
          .map((t: any) => ({ date: t.transaction_date?.split('T')[0] || '', amount: Math.abs(t.amount) }));
        if (payments.length > 0) {
          setLoanPayments(prev => ({ ...prev, [acc.id]: payments }));
        }
      } catch (_) { /* non-critical */ }
    });
  }, [accounts]);

  async function loadAll() {
    setLoading(true);
    try {
      const [accountsRes, statusRes, balancesRes] = await Promise.allSettled([
        bankingAPI.getAccounts(),
        bankingAPI.getStatus(),
        bankingAPI.getBalances(),
      ]);

      // Filter to active accounts only (soft-deleted accounts stay in DB for payment data but hidden from UI)
      const accts: BankAccount[] = accountsRes.status === 'fulfilled'
        ? (Array.isArray(accountsRes.value.data?.accounts) ? accountsRes.value.data.accounts.filter((a: any) => a.is_active !== false) : [])
        : [];

      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data?.status || null);

      // Merge balances
      const balMap: Record<string, AccountBalance> = {};
      if (balancesRes.status === 'fulfilled' && balancesRes.value.data?.accounts) {
        balancesRes.value.data.accounts.forEach((bal: any) => {
          balMap[bal.id] = { id: bal.id, current: bal.current_balance ?? bal.current ?? 0, available: bal.available_balance ?? bal.available ?? 0 };
        });
      }

      const accountsWithBalance: AccountWithBalance[] = accts.map((acc) => ({
        ...acc,
        balance: balMap[acc.id],
      }));

      setAccounts(accountsWithBalance);
      setError(null);
      fetchTxnCounts();
    } catch (err) {
      console.error('Failed to load banking data:', err);
      setError('Failed to load banking data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTxnCounts() {
    try {
      const res = await bankingAPI.getAllTransactions({ category: 'all', limit: 1, offset: 0 });
      const cts = res.data?.counts || {};
      const matched = Number(cts.matched) || 0;
      const unmatched = (Number(cts.possible_bill) || 0) + (Number(cts.likely_not_bill) || 0)
        + (Number(cts.auto_excluded) || 0) + (Number(cts.user_excluded) || 0);
      setTxnCounts({ matched, unmatched });
    } catch (_) { /* non-critical */ }
  }

  /* ─── Account actions ──────────────────────────── */

  const handleToggleSync = async (id: string, isSynced: boolean) => {
    try {
      await bankingAPI.toggleAccountSync(id, !isSynced);
      setAccounts(accounts.map(acc => acc.id === id ? { ...acc, is_synced: !isSynced } : acc));
    } catch (err) {
      console.error('Failed to toggle sync:', err);
      setError('Failed to toggle sync');
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await bankingAPI.directSync();
      const r = res.data?.results || {};
      const msg = r.added > 0
        ? `${r.added} transactions synced · ${r.matched} matched to bills`
        : 'Already up to date — no new transactions';
      setSyncResult(msg);
      setSyncCooldown(30);
      await loadAll();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { details?: string; error?: string } } };
      setError(axiosErr?.response?.data?.details || axiosErr?.response?.data?.error || 'Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlinkAccount = async (id: string) => {
    const choice = window.confirm(
      'Disconnect this account?\n\nClick OK to disconnect (data preserved — reconnect anytime).\nTo permanently delete all data, use the mobile app.'
    );
    if (!choice) return;
    try {
      await bankingAPI.unlinkAccount(id);
      setAccounts(accounts.filter(acc => acc.id !== id));
      setSuccess('Disconnected. Your data is preserved — reconnect anytime.');
    } catch (err) {
      console.error('Failed to unlink account:', err);
      setError('Failed to unlink account');
    }
  };

  /* ─── Grouped accounts ─────────────────────────── */

  const groupedAccounts = useMemo(() => {
    const groups: Record<AccountGroup, AccountWithBalance[]> = {
      cash: [], credit: [], loan: [], investment: [], other: [],
    };
    accounts.forEach(acc => {
      const group = getAccountGroup(acc.account_type);
      groups[group].push(acc);
    });
    const order: AccountGroup[] = ['cash', 'credit', 'loan', 'investment', 'other'];
    return order
      .filter(g => groups[g].length > 0)
      .map(g => ({ key: g as AccountGroup, label: getGroupLabel(g), emoji: getGroupEmoji(g), accounts: groups[g] }));
  }, [accounts]);

  const summaryTotals = useMemo(() => {
    let totalCash = 0;
    let totalCredit = 0;
    let totalLoans = 0;
    const cashAccounts: Array<{ id: string; name: string; mask: string; amount: number }> = [];
    const creditAccounts: Array<{ id: string; name: string; mask: string; amount: number }> = [];
    const loanAccounts: Array<{ id: string; name: string; mask: string; amount: number }> = [];
    accounts.forEach(acc => {
      const bal = acc.balance?.current || 0;
      const group = getAccountGroup(acc.account_type);
      const entry = { id: acc.id, name: acc.account_name || acc.institution_name, mask: acc.account_mask || '', amount: bal };
      if (group === 'cash') { totalCash += bal; cashAccounts.push(entry); }
      else if (group === 'credit') { totalCredit += bal; creditAccounts.push(entry); }
      else if (group === 'loan') { totalLoans += bal; loanAccounts.push(entry); }
    });
    return { totalCash, totalCredit, totalLoans, totalDebt: totalCredit + totalLoans, cashAccounts, creditAccounts, loanAccounts };
  }, [accounts]);

  /* ─── Ultra gate ───────────────────────────────── */

  if (!isUltra) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            Connected Banking
          </h1>
        </div>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Landmark size={48} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ color: colors.text, margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            Ultra Plan Required
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 1.5rem 0', fontSize: '0.95rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Connected banking lets you link your bank accounts and automatically detect recurring bills from your transactions.
          </p>
          <Link href="/app/settings" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">
              Upgrade to Ultra
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  /* ─── Render a single account row ──────────────── */

  function renderAccountRow(account: AccountWithBalance, group: AccountGroup) {
    const isCreditCard = group === 'credit';
    const isLoan = group === 'loan';
    const balCurrent = account.balance?.current || 0;
    const balAvailable = account.balance?.available || 0;
    const creditLimit = isCreditCard ? balCurrent + balAvailable : 0;
    const utilization = isCreditCard && creditLimit > 0 ? (balCurrent / creditLimit) * 100 : 0;

    return (
      <div key={account.id} style={{ marginBottom: '0.75rem' }}>
        <Link
          href={`/app/banking/transactions?accountId=${account.id}&accountName=${encodeURIComponent(account.account_name || account.institution_name)}&accountType=${account.account_type || ''}`}
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: colors.background,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.divider}`,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.electric)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.divider)}
          >
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              backgroundColor: isCreditCard ? 'rgba(133,79,11,0.1)' : isLoan ? 'rgba(163,45,45,0.08)' : 'rgba(56,189,248,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>{getGroupEmoji(group)}</span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: '0.95rem' }}>
                {account.account_name || account.institution_name}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: colors.textMuted }}>
                {account.account_type ? formatAccountType(account.account_type) : ''}{account.account_type && account.account_mask ? ' · ' : ''}{account.account_mask ? `···${account.account_mask}` : ''}
              </p>

              {/* Credit card utilization */}
              {isCreditCard && account.balance && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{fmt(balAvailable)} available</span>
                    {creditLimit > 0 && (
                      <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{Math.round(utilization)}% used</span>
                    )}
                  </div>
                  {creditLimit > 0 && (
                    <div style={{ height: 4, backgroundColor: colors.progressTrack || colors.divider, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: 4,
                        borderRadius: 2,
                        width: `${Math.min(utilization, 100)}%`,
                        backgroundColor: utilization > 75 ? '#E74C3C' : utilization > 50 ? '#854F0B' : '#0A7B6C',
                      }} />
                    </div>
                  )}
                </div>
              )}

              <p style={{ margin: '3px 0 0 0', fontSize: '0.7rem', color: colors.textMuted }}>
                {account.last_sync && !isNaN(new Date(account.last_sync).getTime())
                  ? `Synced ${new Date(account.last_sync).toLocaleDateString()}`
                  : 'Waiting for first sync…'}
              </p>
            </div>

            {/* Balance + chevron */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{
                margin: 0, fontWeight: 700, fontSize: '1rem',
                color: (isCreditCard || isLoan) && balCurrent > 0 ? (isDark ? '#7C8DB5' : '#506385') : colors.text,
              }}>
                {account.balance
                  ? (isCreditCard || isLoan) ? `-${fmt(balCurrent)}` : fmt(balCurrent)
                  : '-'}
              </p>
              {isCreditCard && creditLimit > 0 && (
                <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: colors.textMuted }}>of {fmt(creditLimit)}</p>
              )}
              <ChevronRight size={16} style={{ color: colors.textMuted, marginTop: 4 }} />
            </div>
          </div>
        </Link>

        {/* Error banner */}
        {account.error_type && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: `1px solid ${account.error_type === 'PENDING_EXPIRATION' ? '#854F0B' : colors.red}`,
            backgroundColor: account.error_type === 'PENDING_EXPIRATION' ? 'rgba(133,79,11,0.08)' : `${colors.red}10`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>
              {account.error_type === 'PENDING_EXPIRATION' ? '🔔' : '⚠️'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: colors.text }}>
                {account.error_type === 'PENDING_EXPIRATION' ? 'Re-auth needed soon' : 'Connection expired'}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: colors.textMuted }}>
                {account.error_type === 'PENDING_EXPIRATION'
                  ? 'Your bank connection expires soon. Reconnect to avoid interruption.'
                  : 'Use the mobile app to reconnect and re-authenticate with your bank.'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── Main render ──────────────────────────────── */

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          Accounts
        </h1>
        <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
          Manage your bank connections
        </p>
      </div>

      {/* ═══ CASH CARD (Collapsible) ═══ */}
      {!loading && accounts.length > 0 && (
        <>
          <Card
            style={{ marginBottom: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setSummaryExpanded(!summaryExpanded)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: colors.textMuted, fontWeight: 500 }}>Cash</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 700, color: colors.text }}>{fmt(summaryTotals.totalCash)}</p>
              </div>
              <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>
                {summaryExpanded ? '▲' : '▼'}
              </span>
            </div>
            {/* Expanded: Cash breakdown */}
            {summaryExpanded && summaryTotals.cashAccounts.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.divider}` }}>
                {summaryTotals.cashAccounts.map((acc, i) => (
                  <div key={`cash-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ fontSize: '0.8125rem', color: colors.textMuted }}>{acc.name}{acc.mask ? ` ···${acc.mask}` : ''}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{fmt(acc.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ═══ DEBT MINI CARDS (CC + Loans) ═══ */}
          {(summaryTotals.totalCredit > 0 || summaryTotals.totalLoans > 0) && (
            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '2rem' }}>
              {/* Credit Cards mini card */}
              {summaryTotals.creditAccounts.length > 0 && (
                <Card
                  style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.625rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>💳  Credit Cards</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#7C8DB5' : '#506385' }}>{fmt(summaryTotals.totalCredit)}</p>
                    <span style={{ fontSize: '0.625rem', color: colors.textMuted }}>total balance</span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.625rem', color: colors.textMuted }}>
                    {summaryTotals.creditAccounts.length} card{summaryTotals.creditAccounts.length !== 1 ? 's' : ''}
                    {summaryTotals.creditAccounts.filter(a => a.amount > 0).length > 0
                      ? ` · ${summaryTotals.creditAccounts.filter(a => a.amount > 0).length} with balance`
                      : ''}
                  </p>
                  {summaryExpanded && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.divider}` }}>
                      {summaryTotals.creditAccounts.map((acc, i) => (
                        <div key={`cc-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                          <span style={{ fontSize: '0.6875rem', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{acc.name}</span>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: acc.amount > 0 ? (isDark ? '#7C8DB5' : '#506385') : colors.textMuted }}>{acc.amount > 0 ? fmt(acc.amount) : '$0'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Loans mini card */}
              {summaryTotals.loanAccounts.length > 0 && (
                <Card
                  style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                >
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.625rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋  Loans</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#7C8DB5' : '#506385' }}>{fmt(summaryTotals.totalLoans)}</p>
                    <span style={{ fontSize: '0.625rem', color: colors.textMuted }}>owed</span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.625rem', color: colors.textMuted }}>
                    {summaryTotals.loanAccounts.length > 1
                      ? `${summaryTotals.loanAccounts.length} loans`
                      : summaryTotals.loanAccounts[0]?.name || '1 loan'}
                  </p>
                  {summaryExpanded && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.divider}` }}>
                      {summaryTotals.loanAccounts.length > 1 && summaryTotals.loanAccounts.map((acc, i) => (
                        <div key={`loan-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                          <span style={{ fontSize: '0.6875rem', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{acc.name}</span>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#7C8DB5' : '#506385' }}>{fmt(acc.amount)}</span>
                        </div>
                      ))}
                      {/* Recent payments */}
                      {summaryTotals.loanAccounts.map((acc) => {
                        const payments = loanPayments[acc.id];
                        if (!payments || payments.length === 0) return null;
                        return (
                          <div key={`lp-${acc.id}`} style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.divider}` }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.625rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Payments</p>
                            {payments.map((p, pi) => {
                              const d = new Date(p.date + 'T12:00:00');
                              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              return (
                                <div key={`p-${pi}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                  <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>{dateStr}</span>
                                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#34D399' : '#059669' }}>{fmt(p.amount)}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Sync Controls */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary" size="md"
            onClick={handleManualSync}
            loading={syncing}
            disabled={accounts.length === 0 || syncCooldown > 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: syncCooldown > 0 ? 0.5 : 1 }}
          >
            <RefreshCw size={18} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncCooldown > 0 ? `Sync Now (${syncCooldown}s)` : 'Sync Now'}
          </Button>
          <Button
            variant="secondary" size="md" disabled={true}
            title="Plaid Link for web is coming soon. Use mobile app for now."
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Connect Bank
          </Button>
        </div>
        <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.75rem 0 0 0' }}>
          Use the mobile app to connect new bank accounts
        </p>
      </Card>

      {/* Error / Success / Sync banners */}
      {error && (
        <Card style={{ backgroundColor: `${colors.red}15`, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: colors.red, flexShrink: 0 }} />
          <p style={{ color: colors.red, margin: 0, fontSize: '0.95rem', flex: 1 }}>{error}</p>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </Card>
      )}
      {success && (
        <Card style={{ backgroundColor: 'rgba(10,123,108,0.08)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={20} style={{ color: '#0A7B6C', flexShrink: 0 }} />
          <p style={{ color: '#0A7B6C', margin: 0, fontSize: '0.95rem', flex: 1 }}>{success}</p>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </Card>
      )}
      {syncResult && (
        <Card style={{ backgroundColor: 'rgba(56,189,248,0.08)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <p style={{ color: '#38BDF8', margin: 0, fontSize: '0.95rem' }}>{syncResult}</p>
          <button onClick={() => setSyncResult(null)} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </Card>
      )}

      {/* Grouped Accounts */}
      {loading ? (
        <Card>
          <p style={{ color: colors.textMuted, margin: 0 }}>Loading accounts...</p>
        </Card>
      ) : accounts.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <Landmark size={32} style={{ color: colors.textMuted, marginBottom: '0.75rem' }} />
          <p style={{ color: colors.textMuted, margin: 0 }}>No connected accounts yet</p>
        </Card>
      ) : (
        <>
          {groupedAccounts.map((group) => (
            <div key={group.key} style={{ marginBottom: '1.5rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '1.1px', color: colors.textMuted,
                margin: '0 0 0.5rem 0',
              }}>
                {group.emoji}  {group.label}
              </p>
              {group.accounts.map(account => renderAccountRow(account, group.key))}
            </div>
          ))}
        </>
      )}

      {/* Tools */}
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <Link href={`/app/banking/transactions?accountId=&accountType=`} style={{ textDecoration: 'none' }}>
          <Card onClick={() => {}} style={{ cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <BarChart3 size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>All Transactions</h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  {txnCounts
                    ? `${txnCounts.matched} matched · ${txnCounts.unmatched} unmatched`
                    : 'View synced transactions & their status'}
                </p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>
        <Link href="/app/banking/exclusions" style={{ textDecoration: 'none' }}>
          <Card onClick={() => {}} style={{ cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Settings size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>Exclusion Rules</h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>Manage ignored merchants and patterns</p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
