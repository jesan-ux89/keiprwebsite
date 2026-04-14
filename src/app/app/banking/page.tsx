'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import MerchantLogo from '@/components/MerchantLogo';
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
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────── */

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  custom_name?: string | null;
  account_mask: string;
  account_type?: string;
  is_synced: boolean;
  last_sync: string;
  error_type?: string | null;
  balance_display?: 'both' | 'available' | 'present';
  is_primary_checking?: boolean;
  // Credit-card liability fields (populated by Plaid liabilitiesGet)
  statement_close_date?: string | null;
  payment_due_date?: string | null;
  last_statement_balance?: number | null;
  minimum_payment?: number | null;
  last_payment_date?: string | null;
  last_payment_amount?: number | null;
  apr_percentage?: number | null;
  is_overdue?: boolean | null;
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDueUrgency(dueDate?: string | null, isOverdue?: boolean | null): 'overdue' | 'soon' | 'ok' | null {
  if (!dueDate) return null;
  if (isOverdue) return 'overdue';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const daysUntil = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'soon';
  return 'ok';
}

interface AccountBalance {
  id: string;
  current: number;
  available: number;
}

interface AccountWithBalance extends BankAccount {
  balance?: AccountBalance;
}

// Display name helper — prefer user's custom_name if set.
function getDisplayName(a: Partial<BankAccount>): string {
  return (a.custom_name && a.custom_name.trim()) || a.account_name || a.institution_name || '';
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
  const { isUltra, fmt, bankAccounts: cachedAccounts, fetchBankAccounts } = useApp();
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
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [syncSettingsOpen, setSyncSettingsOpen] = useState(false);

  useEffect(() => {
    if (syncCooldown <= 0) return;
    const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [syncCooldown]);

  useEffect(() => {
    if (!isUltra) return;
    // Use cached accounts for instant render
    if (cachedAccounts.length > 0) {
      const accts = cachedAccounts.filter((a: any) => a.is_active !== false);
      setAccounts(accts.map((acc: any) => ({ ...acc })));
      setLoading(false);
    }
    // Always fetch fresh data (includes balances which aren't cached)
    loadAll();
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
    // Only show loading if no cached data
    if (cachedAccounts.length === 0) setLoading(true);
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
        balance: balMap[acc.id] || { id: acc.id, current: 0, available: 0 },
      }));

      setAccounts(accountsWithBalance);
      setError(null);
      // Update context cache
      fetchBankAccounts(true);
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
      const entry = { id: acc.id, name: getDisplayName(acc), mask: acc.account_mask || '', amount: bal };
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

  /* ─── Accounts Summary Sidebar ──────────────────── */

  function renderSummaryCard() {
    return (
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Summary
          </h3>

          {/* Assets */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>Assets</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0A7B6C' }}>{fmt(summaryTotals.totalCash)}</span>
            </div>
            <div style={{ height: 6, backgroundColor: colors.progressTrack || colors.divider, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: 6, backgroundColor: '#0A7B6C', width: '100%' }} />
            </div>
          </div>

          {/* Cash breakdown rows */}
          {summaryTotals.cashAccounts.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cash Breakdown</p>
              {summaryTotals.cashAccounts.map((acc, i) => (
                <div key={`cash-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.8rem' }}>
                  <span style={{ color: colors.textMuted }}>{acc.name}{acc.mask ? ` ···${acc.mask}` : ''}</span>
                  <span style={{ fontWeight: 600, color: colors.text }}>{fmt(acc.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: colors.divider, margin: '1rem 0' }} />

          {/* Liabilities */}
          {(summaryTotals.totalCredit > 0 || summaryTotals.totalLoans > 0) && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liabilities</p>
              {summaryTotals.creditAccounts.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: colors.textMuted }}>Credit Cards</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#7C8DB5' : '#506385' }}>{fmt(summaryTotals.totalCredit)}</span>
                </div>
              )}
              {summaryTotals.loanAccounts.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.8rem' }}>
                  <span style={{ color: colors.textMuted }}>Loans</span>
                  <span style={{ fontWeight: 600, color: isDark ? '#7C8DB5' : '#506385' }}>{fmt(summaryTotals.totalLoans)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Download CSV link */}
        <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: '1rem' }}>
          <a href="#" style={{ fontSize: '0.8125rem', color: colors.electric, textDecoration: 'none', fontWeight: 500 }}>
            ↓ Download CSV
          </a>
        </div>
      </Card>
    );
  }

  /* ─── Main render ──────────────────────────────── */

  // Build topBarActions with refresh and add buttons
  const topBarActions = (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Button
        variant="secondary" size="sm" disabled={true}
        title="Plaid Link for web is coming soon. Use mobile app for now."
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Plus size={16} />
        Add
      </Button>
    </div>
  );

  return (
    <AppLayout
      pageTitle="Accounts"
      topBarActions={topBarActions}
    >
      <TwoColumnLayout sidebar={renderSummaryCard()}>
        <div style={{ maxWidth: '600px' }}>

          {/* Hero Stats: Net Worth + Cash Balance */}
          {!loading && accounts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {/* Net Worth Card */}
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Net Worth
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.875rem', fontWeight: 700, color: colors.text }}>
                    {fmt(summaryTotals.totalCash - summaryTotals.totalDebt)}
                  </span>
                  {(summaryTotals.totalCash - summaryTotals.totalDebt) > 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#0A7B6C', fontWeight: 600 }}>
                      <ArrowUp size={14} />
                      {fmt(summaryTotals.totalCash - summaryTotals.totalDebt)}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: isDark ? '#F87171' : '#DC2626', fontWeight: 600 }}>
                      <ArrowDown size={14} />
                      {fmt(Math.abs(summaryTotals.totalCash - summaryTotals.totalDebt))}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>This month</p>
              </Card>

              {/* Cash Balance Card */}
              <Card style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cash Balance
                </p>
                <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A7B6C', margin: '0 0 0.5rem 0' }}>
                  {fmt(summaryTotals.totalCash)}
                </p>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>
                  Last synced {accounts.length > 0 && accounts[0].last_sync
                    ? (() => {
                      const d = new Date(accounts[0].last_sync);
                      const now = new Date();
                      const minutes = Math.floor((now.getTime() - d.getTime()) / 60000);
                      if (minutes < 1) return 'just now';
                      if (minutes < 60) return `${minutes}m ago`;
                      const hours = Math.floor(minutes / 60);
                      if (hours < 24) return `${hours}h ago`;
                      return d.toLocaleDateString();
                    })()
                    : 'never'}
                </p>
              </Card>
            </div>
          )}

          {/* Help text */}
          {accounts.length === 0 && !loading && (
            <Card style={{ backgroundColor: isDark ? 'rgba(56,189,248,0.05)' : 'rgba(56,189,248,0.03)', marginBottom: '2rem', padding: '1.5rem' }}>
              <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.875rem' }}>
                Use the mobile app to connect your first bank account. Your accounts and balance data will appear here.
              </p>
            </Card>
          )}

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

          {/* Grouped Accounts with Monarch design */}
          {loading ? (
            <Card>
              <p style={{ color: colors.textMuted, margin: 0 }}>Loading accounts...</p>
            </Card>
          ) : accounts.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <Landmark size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
                No connected accounts
              </h3>
              <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.875rem' }}>
                Connect your bank accounts using the mobile app to see them here.
              </p>
            </Card>
          ) : (
            <>
              {groupedAccounts.map((group) => (
                <div key={group.key} style={{ marginBottom: '2rem' }}>
                  {/* Group header */}
                  <h3 style={{
                    fontSize: '0.875rem', fontWeight: 700, color: colors.text,
                    margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{group.emoji}</span>
                    {group.label}
                  </h3>

                  {/* Account cards in group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {group.accounts.map(account => {
                      const isCreditCard = group.key === 'credit';
                      const isLoan = group.key === 'loan';
                      const balCurrent = account.balance?.current || 0;
                      const balAvailable = account.balance?.available || 0;
                      const creditLimit = isCreditCard ? balCurrent + balAvailable : 0;
                      const utilization = isCreditCard && creditLimit > 0 ? (balCurrent / creditLimit) * 100 : 0;

                      return (
                        <Card
                          key={account.id}
                          style={{
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => window.location.href = `/app/banking/transactions?accountId=${account.id}&accountName=${encodeURIComponent(getDisplayName(account))}&accountType=${account.account_type || ''}`}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = colors.electric;
                            (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(56,189,248,0.03)' : 'rgba(56,189,248,0.02)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = colors.divider;
                            (e.currentTarget as HTMLElement).style.backgroundColor = colors.card;
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {/* Bank logo */}
                            <MerchantLogo
                              billName={account.institution_name || account.account_name || 'Bank'}
                              category={isCreditCard ? 'Credit Card' : isLoan ? 'Loans' : 'Banking'}
                              size={36}
                              isDark={isDark}
                            />

                            {/* Account name + type */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                <p style={{ fontSize: '0.9125rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                                  {getDisplayName(account)}
                                </p>
                                {account.is_primary_checking && (
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                                    color: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.15)',
                                    padding: '0.1rem 0.4rem', borderRadius: 4,
                                  }}>
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '0.8rem', color: colors.textMuted, margin: 0 }}>
                                {account.account_type ? formatAccountType(account.account_type) : ''}{account.account_type && account.account_mask ? ' · ' : ''}
                                {account.account_mask ? `···${account.account_mask}` : ''}
                              </p>
                            </div>

                            {/* Balance + chevron */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {(() => {
                                const mode = account.balance_display || 'both';
                                // Cash: Available prominent with Present secondary (matches mobile)
                                if (!isCreditCard && !isLoan && account.balance) {
                                  const primaryVal = mode === 'present' ? balCurrent : balAvailable;
                                  const primaryLabel = mode === 'present' ? 'Present' : 'Available';
                                  const showSecondary = mode === 'both' && balCurrent !== balAvailable;
                                  return (
                                    <>
                                      <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: colors.text }}>
                                        {fmt(primaryVal)}
                                      </p>
                                      <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: colors.textMuted }}>
                                        {primaryLabel}
                                      </p>
                                      {showSecondary && (
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: colors.textMuted }}>
                                          Present {fmt(balCurrent)}
                                        </p>
                                      )}
                                    </>
                                  );
                                }
                                // Credit / loan — existing display
                                return (
                                  <p style={{
                                    margin: 0, fontWeight: 700, fontSize: '1rem',
                                    color: (isCreditCard || isLoan) && balCurrent > 0 ? (isDark ? '#7C8DB5' : '#506385') : colors.text,
                                  }}>
                                    {account.balance
                                      ? (isCreditCard || isLoan) ? `-${fmt(balCurrent)}` : fmt(balCurrent)
                                      : '-'}
                                  </p>
                                );
                              })()}
                              <ChevronRight size={16} style={{ color: colors.textMuted, marginTop: 2 }} />
                            </div>
                          </div>

                          {/* Credit card utilization bar */}
                          {isCreditCard && account.balance && creditLimit > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{fmt(balAvailable)} available</span>
                                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{Math.round(utilization)}% used</span>
                              </div>
                              <div style={{ height: 4, backgroundColor: colors.progressTrack || colors.divider, borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                  height: 4, borderRadius: 2,
                                  width: `${Math.min(utilization, 100)}%`,
                                  backgroundColor: utilization > 75 ? '#E74C3C' : utilization > 50 ? '#854F0B' : '#0A7B6C',
                                }} />
                              </div>
                            </div>
                          )}

                          {/* Credit card: statement / due date from Plaid Liabilities */}
                          {isCreditCard && (account.payment_due_date || account.statement_close_date) && (() => {
                            const urgency = getDueUrgency(account.payment_due_date, account.is_overdue);
                            const dueColor = urgency === 'overdue' ? '#E74C3C' : urgency === 'soon' ? '#854F0B' : colors.textMuted;
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                                {account.payment_due_date && (
                                  <span style={{ fontSize: '0.75rem', color: dueColor, fontWeight: urgency === 'overdue' ? 700 : 400 }}>
                                    {urgency === 'overdue' ? 'Overdue ' : 'Due '}
                                    {formatShortDate(account.payment_due_date)}
                                    {account.minimum_payment != null && ` · Min ${fmt(account.minimum_payment)}`}
                                  </span>
                                )}
                                {account.last_statement_balance != null && (
                                  <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                    Statement {fmt(account.last_statement_balance)}
                                    {account.statement_close_date ? ` · Closed ${formatShortDate(account.statement_close_date)}` : ''}
                                  </span>
                                )}
                                {account.apr_percentage != null && (
                                  <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                                    APR {account.apr_percentage.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Sync status */}
                          <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.75rem 0 0 0' }}>
                            {account.last_sync && !isNaN(new Date(account.last_sync).getTime())
                              ? `Synced ${new Date(account.last_sync).toLocaleDateString()}`
                              : 'Waiting for first sync…'}
                          </p>

                          {/* Error banner */}
                          {account.error_type && (
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: `1px solid ${account.error_type === 'PENDING_EXPIRATION' ? '#854F0B' : colors.red}`,
                              backgroundColor: account.error_type === 'PENDING_EXPIRATION' ? 'rgba(133,79,11,0.08)' : `${colors.red}10`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              fontSize: '0.8rem',
                            }}>
                              <span style={{ flexShrink: 0 }}>
                                {account.error_type === 'PENDING_EXPIRATION' ? '🔔' : '⚠️'}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, color: colors.text }}>
                                  {account.error_type === 'PENDING_EXPIRATION' ? 'Re-auth needed soon' : 'Connection expired'}
                                </p>
                                <p style={{ margin: '0.2rem 0 0 0', color: colors.textMuted, fontSize: '0.75rem' }}>
                                  {account.error_type === 'PENDING_EXPIRATION'
                                    ? 'Your bank connection expires soon. Reconnect to avoid interruption.'
                                    : 'Use the mobile app to reconnect and re-authenticate with your bank.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
          {/* ═══ Sync Settings (collapsible) ═══ */}
          {!loading && accounts.length > 0 && (
            <div style={{ paddingTop: '1.5rem', paddingBottom: '1rem' }}>
              <button
                onClick={() => setSyncSettingsOpen(prev => !prev)}
                style={{
                  background: 'none', border: 'none', color: colors.textMuted,
                  fontSize: '0.8125rem', cursor: 'pointer', padding: '0.5rem 1rem',
                  display: 'block', margin: '0 auto',
                }}
              >
                {syncSettingsOpen ? '▾ Sync Settings' : '▸ Sync Settings'}
              </button>

              {syncSettingsOpen && (
                <div style={{
                  marginTop: '0.75rem', borderRadius: '12px', border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.card, overflow: 'hidden',
                }}>
                  {/* Sync Transactions */}
                  <button
                    onClick={handleManualSync}
                    disabled={syncing || syncCooldown > 0}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '0.875rem 1rem', background: 'none', border: 'none',
                      borderBottom: `1px solid ${colors.cardBorder}`, cursor: syncing || syncCooldown > 0 ? 'default' : 'pointer',
                      opacity: syncing || syncCooldown > 0 ? 0.5 : 1, textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500 }}>Sync Transactions</div>
                      <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '2px' }}>Pull latest purchases & deposits</div>
                    </div>
                    {syncing ? (
                      <RefreshCw size={16} style={{ color: '#38BDF8', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <span style={{ color: syncCooldown > 0 ? colors.textMuted : '#38BDF8', fontSize: '0.8125rem', fontWeight: 500 }}>
                        {syncCooldown > 0 ? `${syncCooldown}s` : 'Sync'}
                      </span>
                    )}
                  </button>

                  {/* Refresh Balances */}
                  <button
                    onClick={async () => {
                      try {
                        setRefreshingBalances(true);
                        setError(null);
                        const balancesRes = await bankingAPI.getBalances(true);
                        const balMap: Record<string, AccountBalance> = {};
                        if (balancesRes?.data?.accounts) {
                          balancesRes.data.accounts.forEach((bal: any) => {
                            balMap[bal.id] = {
                              id: bal.id,
                              current: bal.current_balance ?? bal.current ?? 0,
                              available: bal.available_balance ?? bal.available ?? 0,
                            };
                          });
                        }
                        setAccounts(prev => prev.map(acc => ({ ...acc, balance: balMap[acc.id] || acc.balance })));
                      } catch {
                        setError('Failed to refresh balances.');
                      } finally {
                        setRefreshingBalances(false);
                      }
                    }}
                    disabled={refreshingBalances}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '0.875rem 1rem', background: 'none', border: 'none',
                      cursor: refreshingBalances ? 'default' : 'pointer',
                      opacity: refreshingBalances ? 0.5 : 1, textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ color: colors.text, fontSize: '0.875rem', fontWeight: 500 }}>Refresh Balances</div>
                      <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '2px' }}>Get live account balances</div>
                    </div>
                    {refreshingBalances ? (
                      <RefreshCw size={16} style={{ color: '#38BDF8', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <span style={{ color: '#38BDF8', fontSize: '0.8125rem', fontWeight: 500 }}>Refresh</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </TwoColumnLayout>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
