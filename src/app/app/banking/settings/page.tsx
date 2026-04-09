'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import {
  ChevronLeft,
  AlertCircle,
  Trash2,
  Filter,
  Plus,
  CheckCircle2,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────── */

interface MatchEntry {
  id: string;
  bill_id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  confidence_score: number;
  match_method: string;
  status: string;
  created_at: string;
  unlinked_at?: string;
  bills?: { name: string };
  // website-specific fields from existing history page
  transaction_name?: string;
  transaction_amount?: number;
  bill_name?: string;
  bill_amount?: number;
  matched_at?: string;
}

interface ExclusionRule {
  id: string;
  rule_type?: string;
  rule_value?: string;
  merchant_pattern?: string;
  source?: string;
  created_at: string;
}

/* ─── Constants ──────────────────────────────────── */

const METHOD_LABELS: Record<string, string> = {
  auto_high: 'Auto-matched',
  auto_confirmed: 'You confirmed',
  learned: 'Learned',
  staged: 'Staged',
  manual: 'Manual',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active:               { bg: 'rgba(10,123,108,0.10)', text: '#0A7B6C', label: 'Active' },
  pending_confirmation: { bg: 'rgba(133,79,11,0.10)',  text: '#854F0B', label: 'Pending' },
  unlinked:             { bg: 'rgba(220,38,38,0.08)',  text: '#DC2626', label: 'Unlinked' },
  rejected:             { bg: 'rgba(220,38,38,0.08)',  text: '#DC2626', label: 'Rejected' },
};

const AUTO_EXCLUDED = [
  { id: 'internal', label: 'Internal transfers' },
  { id: 'atm',      label: 'ATM transactions' },
];

/* ─── Component ──────────────────────────────────── */

export default function BankingSettingsPage() {
  const { colors } = useTheme();
  const { bills, fmt } = useApp();

  // Tab state
  type Tab = 'history' | 'rules';
  const [activeTab, setActiveTab] = useState<Tab>('history');

  // Shared
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Match History
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchEntry[]>([]);
  const [selectedBill, setSelectedBill] = useState('');
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Exclusion Rules
  const [rules, setRules] = useState<ExclusionRule[]>([]);
  const [newPattern, setNewPattern] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  /* ─── Load data ────────────────────────────────── */

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (selectedBill) {
      setFilteredMatches(matches.filter(m => m.bill_id === selectedBill));
    } else {
      setFilteredMatches(matches);
    }
    setPage(1);
  }, [selectedBill, matches]);

  async function loadAll() {
    setLoading(true);
    try {
      const [matchRes, rulesRes] = await Promise.allSettled([
        bankingAPI.getMatchHistory(),
        bankingAPI.getExclusionRules(),
      ]);
      if (matchRes.status === 'fulfilled') setMatches(Array.isArray(matchRes.value.data?.matches) ? matchRes.value.data.matches : []);
      else setError('Failed to load match history.');
      if (rulesRes.status === 'fulfilled') setRules(Array.isArray(rulesRes.value.data?.rules) ? rulesRes.value.data.rules : []);
      else setError('Failed to load exclusion rules.');
    } finally {
      setLoading(false);
    }
  }

  /* ─── Match History actions ────────────────────── */

  const handleUnlink = async (id: string) => {
    if (!window.confirm('Are you sure you want to unlink this match? The bill will be marked unpaid.')) return;
    setUnlinking(id);
    try {
      await bankingAPI.unlinkMatch(id);
      setMatches(prev => prev.map(m => m.id === id ? { ...m, status: 'unlinked', unlinked_at: new Date().toISOString() } : m));
      setSuccess('Match unlinked successfully.');
    } catch (err) {
      console.error('Failed to unlink:', err);
      setError('Failed to unlink match');
    } finally {
      setUnlinking(null);
    }
  };

  /* ─── Exclusion Rules actions ──────────────────── */

  const handleAddRule = async () => {
    if (!newPattern.trim()) return;
    setAddingRule(true);
    try {
      await bankingAPI.addExclusionRule({ rule_type: 'merchant', rule_value: newPattern.trim() });
      const res = await bankingAPI.getExclusionRules();
      setRules(Array.isArray(res.data?.rules) ? res.data.rules : []);
      setNewPattern('');
      setSuccess('Exclusion rule created');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add rule');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Delete this exclusion rule?')) return;
    setDeletingRuleId(id);
    try {
      await bankingAPI.deleteExclusionRule(id);
      setRules(prev => prev.filter(r => r.id !== id));
      setSuccess('Exclusion rule deleted');
    } catch (err) {
      setError('Failed to delete rule');
    } finally {
      setDeletingRuleId(null);
    }
  };

  /* ─── Helpers ──────────────────────────────────── */

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const paginatedMatches = filteredMatches.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

  const tabStyle = (tab: Tab) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer' as const,
    fontWeight: 600 as const,
    fontSize: '0.95rem',
    border: 'none',
    background: activeTab === tab ? colors.inputBg : 'transparent',
    color: activeTab === tab ? colors.text : colors.textMuted,
    transition: 'all 0.15s ease',
  });

  /* ─── Render ───────────────────────────────────── */

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={18} style={{ color: colors.text }} />
          </Button>
        </Link>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            Settings & Rules
          </h1>
          <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            Match history and exclusion rules
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
          Match History {matches.length > 0 && `(${matches.length})`}
        </button>
        <button style={tabStyle('rules')} onClick={() => setActiveTab('rules')}>
          Exclusion Rules {rules.length > 0 && `(${rules.length})`}
        </button>
      </div>

      {/* Banners */}
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

      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading...</p>
        </Card>
      ) : activeTab === 'history' ? (
        /* ─── Match History Tab ─── */
        <>
          {/* Filter */}
          {matches.length > 0 && (
            <Card style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Filter size={18} style={{ color: colors.textMuted }} />
              <select
                value={selectedBill}
                onChange={e => setSelectedBill(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: colors.background, border: `1px solid ${colors.divider}`, borderRadius: '0.5rem', color: colors.text, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                <option value="">All Bills</option>
                {bills.map(bill => <option key={bill.id} value={bill.id}>{bill.name}</option>)}
              </select>
              <span style={{ color: colors.textMuted, fontSize: '0.875rem', whiteSpace: 'nowrap' as const }}>
                {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
              </span>
            </Card>
          )}

          {filteredMatches.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: colors.background }}>
              <AlertCircle size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
                No matches yet
              </h2>
              <p style={{ color: colors.textMuted, margin: 0 }}>
                {selectedBill ? 'No matches for this bill' : 'When transactions are matched to your bills, they\'ll appear here.'}
              </p>
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {paginatedMatches.map(match => {
                  const billName = match.bills?.name || match.bill_name || 'Unknown Bill';
                  const merchantName = match.merchant_name || match.transaction_name || '—';
                  const amount = match.amount || match.transaction_amount || 0;
                  const txnDate = match.transaction_date;
                  const statusInfo = STATUS_COLORS[match.status] || STATUS_COLORS.active;
                  const methodLabel = METHOD_LABELS[match.match_method] || match.match_method || '';
                  const isActive = match.status === 'active';

                  return (
                    <Card key={match.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>{billName}</p>
                            <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: statusInfo.text, backgroundColor: statusInfo.bg, padding: '2px 6px', borderRadius: '4px' }}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {/* Details */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <div>
                              <span style={{ color: colors.textMuted }}>Merchant: </span>
                              <span style={{ color: colors.text, fontWeight: 500 }}>{merchantName}</span>
                            </div>
                            <div>
                              <span style={{ color: colors.textMuted }}>Amount: </span>
                              <span style={{ color: colors.text, fontWeight: 500 }}>{fmt(Math.abs(amount))}</span>
                            </div>
                            <div>
                              <span style={{ color: colors.textMuted }}>Date: </span>
                              <span style={{ color: colors.text, fontWeight: 500 }}>{formatDate(txnDate)}</span>
                            </div>
                            {methodLabel && (
                              <div>
                                <span style={{ color: colors.textMuted }}>Method: </span>
                                <span style={{ color: colors.text, fontWeight: 500 }}>{methodLabel}</span>
                              </div>
                            )}
                            {match.confidence_score != null && (
                              <div>
                                <span style={{ color: colors.textMuted }}>Confidence: </span>
                                <span style={{ color: colors.text, fontWeight: 500 }}>{Math.round(match.confidence_score * 100)}%</span>
                              </div>
                            )}
                          </div>
                          {match.status === 'unlinked' && match.unlinked_at && (
                            <p style={{ color: colors.textMuted, fontSize: '0.75rem', fontStyle: 'italic', margin: '0.5rem 0 0 0' }}>
                              Unlinked {formatDate(match.unlinked_at)}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <Button variant="danger" size="sm" onClick={() => handleUnlink(match.id)} loading={unlinking === match.id} disabled={unlinking !== null} style={{ marginLeft: '1rem', whiteSpace: 'nowrap' as const }}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button key={p} variant={page === p ? 'primary' : 'secondary'} size="sm" onClick={() => setPage(p)}>{p}</Button>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* ─── Exclusion Rules Tab ─── */
        <>
          {/* Add Rule */}
          <Card style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>Add New Rule</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Input
                placeholder="Enter merchant name or pattern (e.g., Amazon, Google Play)"
                value={newPattern}
                onChange={e => setNewPattern(e.target.value)}
                onKeyPress={e => { if (e.key === 'Enter') handleAddRule(); }}
              />
              <Button variant="primary" size="md" onClick={handleAddRule} loading={addingRule} disabled={addingRule || !newPattern.trim()} style={{ whiteSpace: 'nowrap' as const }}>
                <Plus size={18} />
              </Button>
            </div>
          </Card>

          {/* Rules list */}
          {rules.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 2rem', backgroundColor: colors.background }}>
              <AlertCircle size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>No exclusion rules</h2>
              <p style={{ color: colors.textMuted, margin: 0 }}>Add rules to ignore specific merchants or patterns from matching.</p>
            </Card>
          ) : (
            <Card>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
                Active Rules ({rules.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rules.map(rule => {
                  const displayValue = rule.rule_value || rule.merchant_pattern || '—';
                  const ruleType = rule.rule_type || 'merchant';
                  return (
                    <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem', border: `1px solid ${colors.divider}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>{displayValue}</p>
                          <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: colors.electric, backgroundColor: `${colors.electric}15`, padding: '2px 6px', borderRadius: '4px' }}>
                            {ruleType}
                          </span>
                          {rule.source && (
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{rule.source === 'auto' ? 'Auto' : 'Manual'}</span>
                          )}
                        </div>
                        <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: 0 }}>
                          Added {formatDate(rule.created_at)}
                        </p>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteRule(rule.id)} loading={deletingRuleId === rule.id} disabled={deletingRuleId !== null}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Auto-excluded */}
          <Card style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>AUTO-EXCLUDED</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {AUTO_EXCLUDED.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <CheckCircle2 size={16} style={{ color: colors.green }} />
                  <span style={{ color: colors.text, fontSize: '0.95rem' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
