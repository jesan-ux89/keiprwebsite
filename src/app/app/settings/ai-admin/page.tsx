'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { aiAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';

interface SuggestionStats {
  total: number;
  pending: number;
  applied: number;
  dismissed: number;
  byType: { categoryFix: number; budgetCreation: number; categoryConsolidation: number };
}

interface MatchStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  avgConfidence: number;
}

interface RulesStats {
  total: number;
  bySource: { user: number; aiCorrection: number; aiNewMerchant: number };
  rules: { merchant: string; category: string; source: string; createdAt: string }[];
}

interface GlobalStats {
  totalClassified: number;
  bySource: { crowdsourced: number; aiBatch: number; aiOnetime: number; plaidMapped: number };
  plaidMappingsCount: number;
}

interface TimelineEvent {
  type: 'suggestion' | 'match_feedback' | 'classification';
  subtype?: string;
  status?: string;
  payload?: Record<string, any>;
  confidence?: number;
  reasoning?: string;
  action?: string;
  merchant?: string;
  category?: string;
  source?: string;
  timestamp: string;
  resolvedAt?: string;
}

interface AdminStats {
  suggestions: SuggestionStats;
  matchFeedback: MatchStats;
  categoryRules: RulesStats;
  globalMerchants: GlobalStats;
  timeline: TimelineEvent[];
  apiKeyConfigured: boolean;
}

export default function AIAdminPage() {
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'merchants' | 'rules'>('overview');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError('');
      const res = await aiAPI.getAdminStats();
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load AI stats');
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
        <p>Access denied. Admin only.</p>
        <Link href="/app" style={{ color: colors.electric }}>Back to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link href="/app/settings/ai" style={{ color: colors.electric, textDecoration: 'none', fontSize: '0.875rem' }}>
            &larr; AI Settings
          </Link>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '1.5rem' }}>AI Admin Dashboard</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <Card key={i} style={{ height: '8rem', opacity: 0.5 }}>
              <div style={{ padding: '1.5rem', color: colors.textMuted }}>Loading...</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <Link href="/app/settings/ai" style={{ color: colors.electric, textDecoration: 'none', fontSize: '0.875rem' }}>
          &larr; AI Settings
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: '1rem 0' }}>AI Admin Dashboard</h1>
        <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>
          <button onClick={loadStats} style={{ padding: '0.5rem 1rem', backgroundColor: colors.electric, color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Activity' },
    { key: 'merchants', label: 'Merchants' },
    { key: 'rules', label: 'Rules' },
  ] as const;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <Link href="/app/settings/ai" style={{ color: colors.electric, textDecoration: 'none', fontSize: '0.875rem' }}>
          &larr; AI Settings
        </Link>
        <button onClick={loadStats} style={{ padding: '0.375rem 0.75rem', backgroundColor: 'transparent', color: colors.electric, border: `1px solid ${colors.electric}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
          Refresh
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '0.25rem' }}>AI Admin Dashboard</h1>
      <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '1.5rem' }}>
        Monitor how AI is categorizing, matching, and optimizing your finances.
      </p>

      {/* API Status */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.375rem 0.75rem', borderRadius: '999px', marginBottom: '1.5rem',
        fontSize: '0.8125rem', fontWeight: 500,
        backgroundColor: stats.apiKeyConfigured ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
        color: stats.apiKeyConfigured ? colors.green : '#EF4444',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stats.apiKeyConfigured ? colors.green : '#EF4444' }} />
        {stats.apiKeyConfigured ? 'AI Engine Active' : 'API Key Missing'}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.625rem 1rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              backgroundColor: 'transparent',
              color: activeTab === tab.key ? colors.electric : colors.textMuted,
              borderBottom: activeTab === tab.key ? `2px solid ${colors.electric}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} colors={colors} />}
      {activeTab === 'timeline' && <TimelineTab timeline={stats.timeline} colors={colors} />}
      {activeTab === 'merchants' && <MerchantsTab stats={stats.globalMerchants} colors={colors} />}
      {activeTab === 'rules' && <RulesTab stats={stats.categoryRules} colors={colors} />}
    </div>
  );
}

/* ── Overview Tab ────────────────────────────────────────────────────── */
function OverviewTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Suggestions" value={stats.suggestions.total} colors={colors} />
        <StatCard label="Applied" value={stats.suggestions.applied} accent={colors.green} colors={colors} />
        <StatCard label="Pending" value={stats.suggestions.pending} accent={colors.amber} colors={colors} />
        <StatCard label="Dismissed" value={stats.suggestions.dismissed} accent={colors.textMuted} colors={colors} />
      </div>

      {/* Suggestions by Type */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Suggestions by Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <TypeRow label="Category Fixes" count={stats.suggestions.byType.categoryFix} total={stats.suggestions.total} color="#38BDF8" colors={colors} />
          <TypeRow label="Budget Suggestions" count={stats.suggestions.byType.budgetCreation} total={stats.suggestions.total} color="#A78BFA" colors={colors} />
          <TypeRow label="Category Merges" count={stats.suggestions.byType.categoryConsolidation} total={stats.suggestions.total} color="#FB923C" colors={colors} />
        </div>
      </Card>

      {/* Match Feedback */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Bill Match Feedback</h3>
        {stats.matchFeedback.total === 0 ? (
          <p style={{ fontSize: '0.875rem', color: colors.textMuted }}>No match feedback recorded yet. As you confirm or reject bill matches, stats will appear here.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <MiniStat label="Confirmed" value={stats.matchFeedback.confirmed} colors={colors} />
              <MiniStat label="Rejected" value={stats.matchFeedback.rejected} colors={colors} />
              <MiniStat label="Avg Confidence" value={`${stats.matchFeedback.avgConfidence}%`} colors={colors} />
            </div>
          </>
        )}
      </Card>

      {/* Category Rules Summary */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Your Category Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <MiniStat label="Total Rules" value={stats.categoryRules.total} colors={colors} />
          <MiniStat label="User-Created" value={stats.categoryRules.bySource.user} colors={colors} />
          <MiniStat label="AI-Created" value={stats.categoryRules.bySource.aiCorrection + stats.categoryRules.bySource.aiNewMerchant} colors={colors} />
        </div>
      </Card>
    </div>
  );
}

/* ── Timeline Tab ───────────────────────────────────────────────────── */
function TimelineTab({ timeline, colors }: { timeline: TimelineEvent[]; colors: any }) {
  if (timeline.length === 0) {
    return (
      <Card style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: colors.textMuted }}>No AI activity recorded yet. Run a scan from AI Settings to get started.</p>
      </Card>
    );
  }

  function getEventIcon(event: TimelineEvent): string {
    if (event.type === 'suggestion') {
      if (event.status === 'applied') return '✅';
      if (event.status === 'dismissed') return '❌';
      return '💡';
    }
    if (event.type === 'match_feedback') {
      if (event.action === 'confirmed') return '✅';
      if (event.action === 'rejected') return '❌';
      return '🔗';
    }
    if (event.type === 'classification') return '🏷️';
    return '📋';
  }

  function getEventDescription(event: TimelineEvent): string {
    if (event.type === 'suggestion') {
      const p = event.payload || {};
      if (event.subtype === 'category_fix') {
        return `Category fix: ${p.merchantName || 'Unknown'} → ${p.suggestedCategory || '?'} (${event.status})`;
      }
      if (event.subtype === 'budget_creation') {
        return `Budget suggestion: ${p.category || '?'} at $${Math.round((p.suggestedAmount || 0) / 100)}/paycheck (${event.status})`;
      }
      if (event.subtype === 'category_consolidation') {
        return `Merge categories: ${(p.categories || []).join(', ')} → ${p.suggestedCategory || '?'} (${event.status})`;
      }
      return `Suggestion (${event.status})`;
    }
    if (event.type === 'match_feedback') {
      return `Match feedback: ${event.action} (confidence: ${Math.round((event.confidence || 0) * 100)}%)`;
    }
    if (event.type === 'classification') {
      return `Classified "${event.merchant}" as ${event.category} (${event.source}, ${Math.round((event.confidence || 0) * 100)}%)`;
    }
    return 'Unknown event';
  }

  function formatTime(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <Card style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {timeline.map((event, idx) => (
          <div key={idx} style={{
            padding: '0.875rem 1.25rem',
            borderBottom: idx < timeline.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1rem', lineHeight: '1.5' }}>{getEventIcon(event)}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: colors.text, margin: 0, lineHeight: 1.5 }}>
                {getEventDescription(event)}
              </p>
              {event.type === 'suggestion' && event.payload?.reasoning && (
                <p style={{ fontSize: '0.8125rem', color: colors.textMuted, fontStyle: 'italic', margin: '0.25rem 0 0 0' }}>
                  {event.payload.reasoning}
                </p>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: colors.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {formatTime(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Merchants Tab ──────────────────────────────────────────────────── */
function MerchantsTab({ stats, colors }: { stats: GlobalStats; colors: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Classified" value={stats.totalClassified} colors={colors} />
        <StatCard label="AI Batch" value={stats.bySource.aiBatch} accent="#A78BFA" colors={colors} />
        <StatCard label="AI One-time" value={stats.bySource.aiOnetime} accent="#38BDF8" colors={colors} />
        <StatCard label="Plaid Mapped" value={stats.bySource.plaidMapped} accent="#FB923C" colors={colors} />
      </div>

      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.75rem' }}>Classification Sources</h3>
        <p style={{ fontSize: '0.875rem', color: colors.textMuted, lineHeight: 1.6 }}>
          The AI categorization system uses a 5-step pipeline: user rules, global merchant map ({stats.totalClassified} merchants), Plaid-to-Keipr mappings ({stats.plaidMappingsCount} mappings), raw Plaid category, then a default fallback. AI batch classification runs weekly (Sunday 4AM UTC) for new unknown merchants.
        </p>
      </Card>

      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.75rem' }}>How It Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            { step: '1', label: 'User Rules', desc: 'Your personal merchant-to-category rules (highest priority)' },
            { step: '2', label: 'Global Map', desc: 'Crowdsourced merchant classifications shared across all users' },
            { step: '3', label: 'Plaid Mapping', desc: 'Plaid category names mapped to Keipr categories' },
            { step: '4', label: 'Raw Plaid', desc: 'Direct use of Plaid\'s category if it matches a Keipr category' },
            { step: '5', label: 'AI Fallback', desc: 'Claude Haiku classifies unknown merchants on-the-fly' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: colors.electric, color: '#fff', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              }}>{item.step}</span>
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>{item.label}</span>
                <span style={{ fontSize: '0.8125rem', color: colors.textMuted, marginLeft: '0.5rem' }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Rules Tab ──────────────────────────────────────────────────────── */
function RulesTab({ stats, colors }: { stats: RulesStats; colors: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard label="Total Rules" value={stats.total} colors={colors} />
        <StatCard label="User-Created" value={stats.bySource.user} accent={colors.green} colors={colors} />
        <StatCard label="AI-Created" value={stats.bySource.aiCorrection + stats.bySource.aiNewMerchant} accent="#A78BFA" colors={colors} />
      </div>

      {stats.rules.length === 0 ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>No category rules created yet. Rules are created when you apply AI category suggestions or manually recategorize merchants.</p>
        </Card>
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
            padding: '0.75rem 1.25rem', backgroundColor: colors.cardBorder + '30',
            fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px',
          }}>
            <span>Merchant</span>
            <span>Category</span>
            <span>Source</span>
            <span>Date</span>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {stats.rules.map((rule, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr auto auto',
                padding: '0.75rem 1.25rem', alignItems: 'center',
                borderBottom: idx < stats.rules.length - 1 ? `1px solid ${colors.cardBorder}` : 'none',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text }}>{rule.merchant}</span>
                <span style={{ fontSize: '0.875rem', color: colors.text }}>{rule.category}</span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 500, padding: '0.125rem 0.5rem', borderRadius: '999px',
                  backgroundColor: rule.source === 'user' ? 'rgba(52,211,153,0.15)' : 'rgba(167,139,250,0.15)',
                  color: rule.source === 'user' ? colors.green : '#A78BFA',
                }}>
                  {rule.source === 'user' ? 'Manual' : 'AI'}
                </span>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, marginLeft: '1rem' }}>
                  {new Date(rule.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Shared Components ──────────────────────────────────────────────── */
function StatCard({ label, value, accent, colors }: { label: string; value: number | string; accent?: string; colors: any }) {
  return (
    <Card style={{ padding: '1rem 1.25rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: accent || colors.text, margin: 0 }}>
        {value}
      </p>
    </Card>
  );
}

function MiniStat({ label, value, colors }: { label: string; value: number | string; colors: any }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text, margin: 0 }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>{label}</p>
    </div>
  );
}

function TypeRow({ label, count, total, color, colors }: { label: string; count: number; total: number; color: string; colors: any }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.875rem', color: colors.text }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: colors.progressTrack || colors.cardBorder, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
