'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────── */

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  is_synced: boolean;
  last_sync: string;
  error_type?: string | null;
}

interface BankingStatus {
  connected: boolean;
  accounts: number;
  lastSync: string;
}

/* ─── Component ──────────────────────────────────── */

export default function BankingPage() {
  const { colors } = useTheme();
  const { isUltra, fmt } = useApp();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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

  async function loadAll() {
    setLoading(true);
    try {
      const [accountsRes, statusRes] = await Promise.allSettled([
        bankingAPI.getAccounts(),
        bankingAPI.getStatus(),
      ]);
      if (accountsRes.status === 'fulfilled') setAccounts(Array.isArray(accountsRes.value.data?.accounts) ? accountsRes.value.data.accounts : []);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data?.status || null);
      setError(null);
      // Fetch transaction counts for preview
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
    if (!window.confirm('Are you sure you want to unlink this account?')) return;
    try {
      await bankingAPI.unlinkAccount(id);
      setAccounts(accounts.filter(acc => acc.id !== id));
    } catch (err) {
      console.error('Failed to unlink account:', err);
      setError('Failed to unlink account');
    }
  };

  /* ─── Ultra gate ───────────────────────────────── */

  if (!isUltra) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            {isUltra ? 'Accounts' : 'Connected Banking'}
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

  /* ─── Main render ──────────────────────────────── */

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          {isUltra ? 'Accounts' : 'Connected Banking'}
        </h1>
        <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
          Manage your bank connections
        </p>
      </div>

      {/* Overview + Sync */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
            Overview
          </h2>
          {status && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Connected Accounts</p>
                <p style={{ color: colors.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{status.accounts}</p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>Last Sync</p>
                <p style={{ color: colors.text, fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                  {status.lastSync && !isNaN(new Date(status.lastSync).getTime()) ? new Date(status.lastSync).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
        <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '1rem 0 0 0' }}>
          Note: Connected banking is best experienced on the mobile app
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

      {/* Accounts Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1.5rem 0' }}>Accounts</h2>
        {loading ? (
          <p style={{ color: colors.textMuted, margin: 0 }}>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: colors.background, borderRadius: '0.75rem' }}>
            <Landmark size={32} style={{ color: colors.textMuted, marginBottom: '0.75rem' }} />
            <p style={{ color: colors.textMuted, margin: 0 }}>No connected accounts yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accounts.map((account) => (
              <div key={account.id} style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem', border: `1px solid ${colors.divider}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.text, fontWeight: 600, margin: '0 0 0.25rem 0' }}>{account.institution_name}</p>
                    <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>{account.account_name} • {account.account_mask}</p>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: 0 }}>
                      Last synced: {account.last_sync && !isNaN(new Date(account.last_sync).getTime()) ? new Date(account.last_sync).toLocaleDateString() : 'Waiting for first sync…'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={account.is_synced} onChange={() => handleToggleSync(account.id, account.is_synced)} style={{ cursor: 'pointer' }} />
                      <span style={{ color: colors.text, fontSize: '0.875rem' }}>{account.is_synced ? 'Syncing' : 'Paused'}</span>
                    </label>
                    <Button variant="danger" size="sm" onClick={() => handleUnlinkAccount(account.id)}>Unlink</Button>
                  </div>
                </div>

                {/* Per-account error banner */}
                {account.error_type && (
                  <div style={{
                    marginTop: '0.75rem',
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
            ))}
          </div>
        )}
      </Card>

      {/* ─── Tools ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <Link href="/app/banking/transactions" style={{ textDecoration: 'none' }}>
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
