'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import {
  Landmark,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Plus,
  Trash2,
  Eye,
  Settings,
  CheckCircle2,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────── */

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  is_synced: boolean;
  last_sync: string;
}

interface BankingStatus {
  connected: boolean;
  accounts: number;
  lastSync: string;
}

interface Confirmation {
  id: string;
  bill_id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  confidence_score: number;
  match_method: string;
  status: string;
  bills?: { name: string; total_amount: number };
}

interface Suggestion {
  id: string;
  merchant_name: string;
  typical_amount: number;
  occurrence_count: number;
}

/* ─── Component ──────────────────────────────────── */

export default function BankingPage() {
  const { colors } = useTheme();
  const { isUltra, fmt } = useApp();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [status, setStatus] = useState<BankingStatus | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncCooldown, setSyncCooldown] = useState(0);
  const [actioning, setActioning] = useState<string | null>(null);

  // Dismiss modal state
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [dismissType, setDismissType] = useState<'once' | 'merchant'>('once');

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
      const [accountsRes, statusRes, confirmRes, suggestRes] = await Promise.allSettled([
        bankingAPI.getAccounts(),
        bankingAPI.getStatus(),
        bankingAPI.getConfirmations(),
        bankingAPI.getSuggestions(),
      ]);
      if (accountsRes.status === 'fulfilled') setAccounts(Array.isArray(accountsRes.value.data?.accounts) ? accountsRes.value.data.accounts : []);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data?.status || null);
      if (confirmRes.status === 'fulfilled') setConfirmations(Array.isArray(confirmRes.value.data?.confirmations) ? confirmRes.value.data.confirmations : []);
      if (suggestRes.status === 'fulfilled') setSuggestions(Array.isArray(suggestRes.value.data?.suggestions) ? suggestRes.value.data.suggestions : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load banking data:', err);
      setError('Failed to load banking data');
    } finally {
      setLoading(false);
    }
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

  /* ─── Confirmation actions ─────────────────────── */

  const handleConfirm = async (id: string) => {
    setActioning(id);
    try {
      await bankingAPI.confirmMatch(id);
      setConfirmations(prev => prev.filter(c => c.id !== id));
      setSuccess('Match confirmed');
    } catch (err) {
      console.error('Failed to confirm match:', err);
      setError('Failed to confirm match');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioning(id);
    try {
      await bankingAPI.rejectMatch(id);
      setConfirmations(prev => prev.filter(c => c.id !== id));
      setSuccess('Match rejected');
    } catch (err) {
      console.error('Failed to reject match:', err);
      setError('Failed to reject match');
    } finally {
      setActioning(null);
    }
  };

  /* ─── Suggestion actions ───────────────────────── */

  const handleAddAsBill = async (suggestion: Suggestion) => {
    setActioning(suggestion.id);
    try {
      await bankingAPI.addSuggestion(suggestion.id);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setSuccess('Bill added from suggestion');
    } catch (err) {
      console.error('Failed to add suggestion:', err);
      setError('Failed to add bill');
    } finally {
      setActioning(null);
    }
  };

  const handleDismiss = async () => {
    if (!selectedSuggestion) return;
    setActioning(selectedSuggestion.id);
    try {
      await bankingAPI.dismissSuggestion(selectedSuggestion.id, dismissType);
      setSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
      setSelectedSuggestion(null);
      setDismissModalOpen(false);
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
      setError('Failed to dismiss suggestion');
    } finally {
      setActioning(null);
    }
  };

  /* ─── Helpers ──────────────────────────────────── */

  const confidenceColor = (score: number | undefined | null) => {
    if (score == null) return colors.textMuted;
    if (score >= 0.8) return colors.green;
    if (score >= 0.6) return colors.amber;
    return colors.red;
  };

  const actionItemCount = confirmations.length + suggestions.length;

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
            Connected banking lets you link your bank accounts, get automatic bill suggestions, and match transactions to your bills.
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
          Connected Banking
        </h1>
        <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
          Manage your bank connections and review matches
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
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Needs Your Review (inline confirmations + suggestions) ─── */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1.5rem 0' }}>
          Needs Your Review {actionItemCount > 0 && <span style={{ color: colors.electric, fontWeight: 700 }}>({actionItemCount})</span>}
        </h2>

        {loading ? (
          <p style={{ color: colors.textMuted, margin: 0 }}>Loading...</p>
        ) : actionItemCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: colors.background, borderRadius: '0.75rem' }}>
            <CheckCircle2 size={32} style={{ color: colors.green, marginBottom: '0.75rem' }} />
            <p style={{ color: colors.text, fontWeight: 600, margin: '0 0 0.25rem 0' }}>All caught up!</p>
            <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.875rem' }}>No pending items to review.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Pending Confirmations */}
            {confirmations.map((c) => {
              const billName = c.bills?.name || 'Unknown Bill';
              return (
              <div key={c.id} style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.75rem', border: `1px solid ${colors.divider}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#854F0B', backgroundColor: 'rgba(133,79,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Confirm</span>
                      <span style={{ fontSize: '0.75rem', color: confidenceColor(c.confidence_score), fontWeight: 600 }}>
                        {c.confidence_score != null ? `${Math.round(c.confidence_score * 100)}%` : ''}
                      </span>
                    </div>
                    <p style={{ color: colors.text, fontWeight: 600, margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                      {c.merchant_name}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                      Matched to <strong>{billName}</strong> · {c.transaction_date && !isNaN(new Date(c.transaction_date).getTime()) ? new Date(c.transaction_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <p style={{ color: colors.text, fontWeight: 700, margin: 0, fontSize: '1rem', whiteSpace: 'nowrap' as const }}>{fmt(c.amount ?? 0)}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="danger" size="sm" onClick={() => handleReject(c.id)} loading={actioning === c.id} disabled={actioning !== null}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <X size={14} /> Reject
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleConfirm(c.id)} loading={actioning === c.id} disabled={actioning !== null}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Check size={14} /> Confirm
                  </Button>
                </div>
              </div>
              );
            })}

            {/* Suggestions */}
            {suggestions.map((s) => (
              <div key={s.id} style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.75rem', border: `1px solid ${colors.divider}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: colors.electric, backgroundColor: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Suggestion</span>
                    <p style={{ color: colors.text, fontWeight: 600, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>{s.merchant_name}</p>
                    <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                      Seen {s.occurrence_count} time{s.occurrence_count !== 1 ? 's' : ''} · ~{fmt(s.typical_amount ?? 0)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm"
                    onClick={() => { setSelectedSuggestion(s); setDismissModalOpen(true); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Trash2 size={14} /> Dismiss
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleAddAsBill(s)} loading={actioning === s.id} disabled={actioning !== null}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Plus size={14} /> Add as Bill
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Tools (2 nav cards) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <Link href="/app/banking/transactions" style={{ textDecoration: 'none' }}>
          <Card onClick={() => {}} style={{ cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Eye size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>All Transactions</h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>Review all synced transactions and their categories</p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>

        <Link href="/app/banking/settings" style={{ textDecoration: 'none' }}>
          <Card onClick={() => {}} style={{ cursor: 'pointer', transition: 'all 0.2s ease', minHeight: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Settings size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>Settings & Rules</h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>Match history and exclusion rules</p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>
      </div>

      {/* ─── Dismiss Suggestion Modal ─── */}
      <Modal
        isOpen={dismissModalOpen}
        onClose={() => { setDismissModalOpen(false); setSelectedSuggestion(null); }}
        title="Dismiss Suggestion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: colors.text, margin: 0 }}>How would you like to dismiss this suggestion?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: colors.background, borderRadius: '0.5rem', cursor: 'pointer', border: dismissType === 'once' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}` }}>
              <input type="radio" name="dismissType" value="once" checked={dismissType === 'once'} onChange={() => setDismissType('once')} style={{ marginRight: '0.75rem', cursor: 'pointer' }} />
              <div>
                <p style={{ color: colors.text, fontWeight: 500, margin: 0 }}>Dismiss this suggestion</p>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Hide just this suggestion</p>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', backgroundColor: colors.background, borderRadius: '0.5rem', cursor: 'pointer', border: dismissType === 'merchant' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}` }}>
              <input type="radio" name="dismissType" value="merchant" checked={dismissType === 'merchant'} onChange={() => setDismissType('merchant')} style={{ marginRight: '0.75rem', cursor: 'pointer' }} />
              <div>
                <p style={{ color: colors.text, fontWeight: 500, margin: 0 }}>Ignore {selectedSuggestion?.merchant_name}</p>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Never suggest transactions from this merchant</p>
              </div>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" size="md" onClick={() => { setDismissModalOpen(false); setSelectedSuggestion(null); }} style={{ flex: 1 }}>Cancel</Button>
            <Button variant="danger" size="md" onClick={handleDismiss} loading={actioning === selectedSuggestion?.id} style={{ flex: 1 }}>Dismiss</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
