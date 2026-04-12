'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { aiAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';

/* ── Type Definitions ────────────────────────────────────────────────── */
interface PipelineStats {
  userRule: number; globalMap: number; plaidMapping: number; plaidRaw: number; default: number; unknown: number; total: number;
}
interface SuggestionStats {
  total: number; pending: number; applied: number; dismissed: number;
  byType: { categoryFix: number; budgetCreation: number; categoryConsolidation: number };
}
interface MatchStats { total: number; confirmed: number; rejected: number; pending: number; avgConfidence: number; }
interface DetectionStats { totalDetected: number; confirmed: number; stillPending: number; confirmRate: number; }
interface GlobalMerchantStats {
  totalClassified: number; plaidMappingsCount: number; avgConfidence: number;
  bySource: { crowdsourced: number; aiBatch: number; aiOnetime: number; plaidMapped: number };
}
interface RulesStats { total: number; bySource: { user: number; aiCorrection: number; aiNewMerchant: number }; }
interface UserImpact { totalUsers: number; ultraUsers: number; aiEnabledUsers: number; bankConnectedUsers: number; }
interface CoverageStats { totalTransactions: number; categorized: number; uncategorized: number; coveragePercent: number; autoMatchedBills: number; totalCategoryRules: number; }
interface WeeklyTrend { week: string; suggestionsApplied: number; suggestionsDismissed: number; matchesConfirmed: number; matchesRejected: number; detected: number; confirmed: number; }
interface TimelineEvent {
  type: string; subtype?: string; status?: string; payload?: Record<string, any>;
  confidence?: number; reasoning?: string; action?: string; merchant?: string;
  category?: string; source?: string; amount?: number; timestamp: string; resolvedAt?: string;
}
interface DataFlowField { field: string; description: string; feedsInto: string; }
interface PerUserRow { userId: string; total: number; autoResolved: number; defaultCount: number; autoPercent: number; }
interface ServerImpact {
  dashboardFeed: { txnsWithCategory: number; totalTxns: number; feedPercent: number; spendingBudgets: number; totalBudgetAmount: number };
  cacheEfficiency: { globalCacheSize: number; savedAiCalls: number; freshAiCalls: number; cacheHitRate: number; avgConfidence: number };
  perUserBreakdown: PerUserRow[];
  dataFlowFields: DataFlowField[];
}
interface AdminStats {
  pipeline: PipelineStats; suggestions: SuggestionStats; matchFeedback: MatchStats;
  detection: DetectionStats; globalMerchants: GlobalMerchantStats; categoryRules: RulesStats;
  userImpact: UserImpact; coverage: CoverageStats; accuracyTrends: WeeklyTrend[];
  timeline: TimelineEvent[]; apiKeyConfigured: boolean; serverImpact: ServerImpact | null;
}

export default function AIAdminPage() {
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try { setLoading(true); setError(''); const res = await aiAPI.getAdminStats(); setStats(res.data); }
    catch (err: any) { setError(err.response?.data?.error || 'Failed to load AI stats'); }
    finally { setLoading(false); }
  }

  if (!isAdmin) {
    return (<div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}><p>Access denied. Admin only.</p><Link href="/app" style={{ color: colors.electric }}>Back to Dashboard</Link></div>);
  }

  if (loading) {
    return (<div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}><h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '1.5rem' }}>AI Admin Dashboard</h1><Card style={{ height: '12rem', padding: '2rem' }}><p style={{ color: colors.textMuted }}>Loading global AI stats...</p></Card></div>);
  }

  if (error || !stats) {
    return (<div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}><h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '1rem' }}>AI Admin Dashboard</h1><Card style={{ padding: '1.5rem', textAlign: 'center' }}><p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p><button onClick={loadStats} style={{ padding: '0.5rem 1rem', backgroundColor: colors.electric, color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Retry</button></Card></div>);
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'server', label: 'Server' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'trends', label: 'Trends' },
    { key: 'detection', label: 'Detection' },
    { key: 'merchants', label: 'Merchants' },
    { key: 'timeline', label: 'Activity' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <Link href="/app/settings/ai" style={{ color: colors.electric, textDecoration: 'none', fontSize: '0.875rem' }}>&larr; AI Settings</Link>
        <button onClick={loadStats} style={{ padding: '0.375rem 0.75rem', backgroundColor: 'transparent', color: colors.electric, border: `1px solid ${colors.electric}`, borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>Refresh</button>
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '0.25rem' }}>AI Admin Dashboard</h1>
      <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '1.25rem' }}>Global view of how AI is improving Keipr across all users.</p>

      {/* Status badges */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <Badge label={stats.apiKeyConfigured ? 'AI Engine Active' : 'API Key Missing'} color={stats.apiKeyConfigured ? colors.green : '#EF4444'} />
        <Badge label={`${stats.userImpact.totalUsers} Users`} color={colors.electric} />
        <Badge label={`${stats.userImpact.bankConnectedUsers} Banks Connected`} color={colors.electric} />
        <Badge label={`${stats.coverage.coveragePercent}% Categorized`} color={stats.coverage.coveragePercent >= 80 ? colors.green : colors.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '0.625rem 0.875rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            backgroundColor: 'transparent', whiteSpace: 'nowrap',
            color: activeTab === tab.key ? colors.electric : colors.textMuted,
            borderBottom: activeTab === tab.key ? `2px solid ${colors.electric}` : '2px solid transparent', marginBottom: '-1px',
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab stats={stats} colors={colors} />}
      {activeTab === 'server' && <ServerTab stats={stats} colors={colors} />}
      {activeTab === 'pipeline' && <PipelineTab stats={stats} colors={colors} />}
      {activeTab === 'trends' && <TrendsTab trends={stats.accuracyTrends} colors={colors} />}
      {activeTab === 'detection' && <DetectionTab stats={stats} colors={colors} />}
      {activeTab === 'merchants' && <MerchantsTab stats={stats} colors={colors} />}
      {activeTab === 'timeline' && <TimelineTab timeline={stats.timeline} colors={colors} />}
    </div>
  );
}

/* ── Overview Tab ────────────────────────────────────────────────────── */
function OverviewTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  const s = stats.suggestions;
  const acceptRate = s.applied + s.dismissed > 0 ? Math.round((s.applied / (s.applied + s.dismissed)) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Transactions" value={stats.coverage.totalTransactions.toLocaleString()} colors={colors} />
        <StatCard label="Coverage" value={`${stats.coverage.coveragePercent}%`} accent={stats.coverage.coveragePercent >= 80 ? colors.green : colors.amber} colors={colors} />
        <StatCard label="Suggestions" value={s.total} colors={colors} />
        <StatCard label="Accept Rate" value={`${acceptRate}%`} accent={acceptRate >= 70 ? colors.green : colors.amber} colors={colors} />
        <StatCard label="Bills Detected" value={stats.detection.totalDetected} colors={colors} />
        <StatCard label="Confirm Rate" value={`${stats.detection.confirmRate}%`} accent={stats.detection.confirmRate >= 60 ? colors.green : colors.amber} colors={colors} />
      </div>

      {/* Suggestions breakdown */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Suggestions Across All Users</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <MiniStat label="Total" value={s.total} colors={colors} />
          <MiniStat label="Applied" value={s.applied} colors={colors} />
          <MiniStat label="Pending" value={s.pending} colors={colors} />
          <MiniStat label="Dismissed" value={s.dismissed} colors={colors} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <BarRow label="Category Fixes" count={s.byType.categoryFix} total={s.total} color="#38BDF8" colors={colors} />
          <BarRow label="Budget Suggestions" count={s.byType.budgetCreation} total={s.total} color="#A78BFA" colors={colors} />
          <BarRow label="Category Merges" count={s.byType.categoryConsolidation} total={s.total} color="#FB923C" colors={colors} />
        </div>
      </Card>

      {/* User Impact */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>User Impact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <MiniStat label="Total Users" value={stats.userImpact.totalUsers} colors={colors} />
          <MiniStat label="Ultra Users" value={stats.userImpact.ultraUsers} colors={colors} />
          <MiniStat label="AI Enabled" value={stats.userImpact.aiEnabledUsers} colors={colors} />
          <MiniStat label="Banks Connected" value={stats.userImpact.bankConnectedUsers} colors={colors} />
        </div>
      </Card>

      {/* Match Feedback */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Bill Match Feedback</h3>
        {stats.matchFeedback.total === 0 ? (
          <p style={{ fontSize: '0.875rem', color: colors.textMuted }}>No match feedback recorded yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <MiniStat label="Total" value={stats.matchFeedback.total} colors={colors} />
            <MiniStat label="Confirmed" value={stats.matchFeedback.confirmed} colors={colors} />
            <MiniStat label="Rejected" value={stats.matchFeedback.rejected} colors={colors} />
            <MiniStat label="Avg Confidence" value={`${stats.matchFeedback.avgConfidence}%`} colors={colors} />
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Server Impact Tab ──────────────────────────────────────────────── */
function ServerTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  const si = stats.serverImpact;
  if (!si) {
    return (<Card style={{ padding: '2rem', textAlign: 'center' }}><p style={{ color: colors.textMuted }}>Server impact data not yet available. Deploy the latest backend to enable.</p></Card>);
  }

  const df = si.dashboardFeed;
  const ce = si.cacheEfficiency;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Section: How AI Feeds the Dashboard */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>How AI Feeds the Dashboard</h3>
        <p style={{ fontSize: '0.8125rem', color: colors.textMuted, lineHeight: 1.6, marginBottom: '1rem' }}>
          Every transaction processed by the webhook gets a <code style={{ backgroundColor: colors.cardBorder, padding: '0.125rem 0.375rem', borderRadius: 4, fontSize: '0.8125rem' }}>budget_category</code> assigned via the 5-step pipeline. This field directly powers the spending summaries, category breakdowns, budget progress bars, and the Available Number on every user&apos;s dashboard.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <StatCard label="Categorized Txns" value={df.txnsWithCategory.toLocaleString()} colors={colors} />
          <StatCard label="Feed Rate" value={`${df.feedPercent}%`} accent={df.feedPercent >= 80 ? colors.green : colors.amber} colors={colors} />
          <StatCard label="Spending Budgets" value={df.spendingBudgets} colors={colors} />
          <StatCard label="Budget Total" value={`$${df.totalBudgetAmount.toLocaleString()}`} colors={colors} />
        </div>
      </Card>

      {/* Section: Data Flow Fields */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Server-Level Fields Written Per Transaction</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {si.dataFlowFields.map((f, idx) => (
            <div key={idx} style={{ paddingBottom: idx < si.dataFlowFields.length - 1 ? '0.875rem' : 0, borderBottom: idx < si.dataFlowFields.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <code style={{ backgroundColor: colors.electric + '18', color: colors.electric, padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600 }}>{f.field}</code>
              </div>
              <p style={{ fontSize: '0.8125rem', color: colors.textMuted, margin: '0.25rem 0 0.125rem 0', lineHeight: 1.5 }}>{f.description}</p>
              <p style={{ fontSize: '0.75rem', color: colors.textSub || colors.textMuted, margin: 0 }}>
                Feeds → <span style={{ fontWeight: 500, color: colors.text }}>{f.feedsInto}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Section: Global Merchant Cache Efficiency */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>Global Merchant Cache</h3>
        <p style={{ fontSize: '0.8125rem', color: colors.textMuted, lineHeight: 1.6, marginBottom: '1rem' }}>
          When AI classifies a merchant, it&apos;s cached globally. Future transactions from that merchant — for any user — skip AI entirely and use the cached result, saving API calls and money.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <StatCard label="Cache Size" value={ce.globalCacheSize} accent="#A78BFA" colors={colors} />
          <StatCard label="Cache Hits" value={ce.savedAiCalls.toLocaleString()} accent={colors.green} colors={colors} />
          <StatCard label="Fresh AI Calls" value={ce.freshAiCalls} accent="#38BDF8" colors={colors} />
          <StatCard label="Hit Rate" value={`${ce.cacheHitRate}%`} accent={ce.cacheHitRate >= 50 ? colors.green : colors.amber} colors={colors} />
          <StatCard label="Avg Confidence" value={`${ce.avgConfidence}%`} colors={colors} />
        </div>
        <div style={{ height: 10, borderRadius: 5, backgroundColor: colors.progressTrack || colors.cardBorder, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${ce.cacheHitRate}%`, backgroundColor: colors.green, height: '100%' }} title="Cache Hits" />
          <div style={{ width: `${100 - ce.cacheHitRate}%`, backgroundColor: '#38BDF8', height: '100%' }} title="Fresh AI Calls" />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: colors.textMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.green, display: 'inline-block' }} /> Cache Hits (saved)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#38BDF8', display: 'inline-block' }} /> Fresh AI Calls</span>
        </div>
      </Card>

      {/* Section: Per-User Resolution Breakdown */}
      {si.perUserBreakdown.length > 0 && (
        <Card style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>Per-User Category Resolution</h3>
          <p style={{ fontSize: '0.8125rem', color: colors.textMuted, lineHeight: 1.6, marginBottom: '1rem' }}>
            How well AI is resolving categories for each user. High auto-resolve % means fewer transactions falling to &quot;Other&quot;.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 50px', gap: '0.5rem', fontSize: '0.6875rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', paddingBottom: '0.375rem', borderBottom: `1px solid ${colors.cardBorder}` }}>
              <span>User</span><span>Resolution</span><span style={{ textAlign: 'right' }}>Auto</span><span style={{ textAlign: 'right' }}>Default</span><span style={{ textAlign: 'right' }}>Rate</span>
            </div>
            {si.perUserBreakdown.map((u, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 50px', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem', paddingBottom: '0.375rem', borderBottom: idx < si.perUserBreakdown.length - 1 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                <span style={{ color: colors.textMuted, fontFamily: 'monospace', fontSize: '0.75rem' }}>{u.userId}</span>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: colors.progressTrack || colors.cardBorder, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${u.autoPercent}%`, backgroundColor: colors.green, height: '100%' }} />
                  <div style={{ width: `${100 - u.autoPercent}%`, backgroundColor: '#EF4444', height: '100%' }} />
                </div>
                <span style={{ textAlign: 'right', color: colors.green, fontWeight: 600 }}>{u.autoResolved}</span>
                <span style={{ textAlign: 'right', color: u.defaultCount > 0 ? '#EF4444' : colors.textMuted, fontWeight: 600 }}>{u.defaultCount}</span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: u.autoPercent >= 80 ? colors.green : u.autoPercent >= 50 ? colors.amber : '#EF4444' }}>{u.autoPercent}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section: Server Pipeline Explanation */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>How It All Connects</h3>
        <div style={{ fontSize: '0.8125rem', color: colors.textMuted, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 0.75rem 0' }}><strong style={{ color: colors.text }}>Webhook receives transaction</strong> → Merchant name normalized → 5-step pipeline resolves <code style={{ backgroundColor: colors.cardBorder, padding: '0.125rem 0.25rem', borderRadius: 3, fontSize: '0.75rem' }}>budget_category</code> → If unresolved, Claude Haiku classifies → Result cached globally</p>
          <p style={{ margin: '0 0 0.75rem 0' }}><strong style={{ color: colors.text }}>Dashboard reads</strong> → <code style={{ backgroundColor: colors.cardBorder, padding: '0.125rem 0.25rem', borderRadius: 3, fontSize: '0.75rem' }}>/spending/summary</code> aggregates by budget_category → Category breakdowns, progress bars, spending pace all derive from this one field</p>
          <p style={{ margin: '0 0 0.75rem 0' }}><strong style={{ color: colors.text }}>Available Number</strong> → <code style={{ backgroundColor: colors.cardBorder, padding: '0.125rem 0.25rem', borderRadius: 3, fontSize: '0.75rem' }}>/spending/available</code> uses <code style={{ backgroundColor: colors.cardBorder, padding: '0.125rem 0.25rem', borderRadius: 3, fontSize: '0.75rem' }}>display_category</code> to exclude matched bills, income, and transfers from spending — then subtracts spending from paycheck</p>
          <p style={{ margin: 0 }}><strong style={{ color: colors.text }}>Cache learning loop</strong> → First AI call for a merchant costs ~0.1¢ → All future users get it free from the global cache → Confidence grows with each confirming user</p>
        </div>
      </Card>
    </div>
  );
}

/* ── Pipeline Tab ────────────────────────────────────────────────────── */
function PipelineTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  const p = stats.pipeline;
  const tracked = p.userRule + p.globalMap + p.plaidMapping + p.plaidRaw + p.default;
  const steps = [
    { label: 'User Rules', value: p.userRule, color: '#34D399', desc: 'Personal merchant-to-category rules (highest priority)' },
    { label: 'Global Merchant Map', value: p.globalMap, color: '#38BDF8', desc: 'Crowdsourced merchant classifications' },
    { label: 'Plaid Mapping', value: p.plaidMapping, color: '#A78BFA', desc: 'Plaid categories mapped to Keipr categories' },
    { label: 'Raw Plaid Category', value: p.plaidRaw, color: '#FB923C', desc: 'Direct Plaid category match' },
    { label: 'Default (Uncategorized)', value: p.default, color: '#EF4444', desc: 'Fell through all steps — needs improvement' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <StatCard label="Total Transactions" value={p.total.toLocaleString()} colors={colors} />
        <StatCard label="Tracked (with source)" value={tracked.toLocaleString()} colors={colors} />
        <StatCard label="Pre-tracking" value={p.unknown.toLocaleString()} accent={colors.textMuted} colors={colors} />
      </div>

      {/* Pipeline breakdown */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1.25rem' }}>5-Step Category Resolution Pipeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {steps.map((step, idx) => {
            const pct = tracked > 0 ? (step.value / tracked) * 100 : 0;
            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: step.color, color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>{idx + 1}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>{step.label}</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: colors.text }}>{step.value.toLocaleString()} <span style={{ fontWeight: 400, color: colors.textMuted }}>({pct.toFixed(1)}%)</span></span>
                </div>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: colors.progressTrack || colors.cardBorder, overflow: 'hidden', marginBottom: '0.25rem' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: step.color, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>{step.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Interpretation */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>What This Means</h3>
        <p style={{ fontSize: '0.875rem', color: colors.textMuted, lineHeight: 1.6 }}>
          As the AI system learns, traffic should shift UP the pipeline — more hits on User Rules and Global Map, fewer on Default. A healthy system has less than 5% falling through to Default. Current default rate: <strong style={{ color: tracked > 0 && (p.default / tracked) * 100 < 5 ? colors.green : '#EF4444' }}>{tracked > 0 ? ((p.default / tracked) * 100).toFixed(1) : 0}%</strong>.
        </p>
      </Card>
    </div>
  );
}

/* ── Trends Tab ──────────────────────────────────────────────────────── */
function TrendsTab({ trends, colors }: { trends: WeeklyTrend[]; colors: any }) {
  const maxVal = Math.max(...trends.map(t => Math.max(t.suggestionsApplied + t.suggestionsDismissed, t.matchesConfirmed + t.matchesRejected, t.detected + t.confirmed)), 1);

  function formatWeek(w: string) {
    const d = new Date(w + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Suggestion Accuracy */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Suggestion Accuracy (12 Weeks)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#34D399', display: 'inline-block' }} /> Applied</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} /> Dismissed</span>
          </div>
          {trends.map((t, idx) => {
            const total = t.suggestionsApplied + t.suggestionsDismissed;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 50, textAlign: 'right', flexShrink: 0 }}>{formatWeek(t.week)}</span>
                <div style={{ flex: 1, display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.progressTrack || colors.cardBorder }}>
                  {t.suggestionsApplied > 0 && <div style={{ width: `${(t.suggestionsApplied / maxVal) * 100}%`, backgroundColor: '#34D399', height: '100%' }} />}
                  {t.suggestionsDismissed > 0 && <div style={{ width: `${(t.suggestionsDismissed / maxVal) * 100}%`, backgroundColor: '#EF4444', height: '100%' }} />}
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 24, textAlign: 'right' }}>{total}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detection Trends */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Detection Quality (12 Weeks)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#34D399', display: 'inline-block' }} /> Confirmed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#FB923C', display: 'inline-block' }} /> Pending</span>
          </div>
          {trends.map((t, idx) => {
            const total = t.detected + t.confirmed;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 50, textAlign: 'right', flexShrink: 0 }}>{formatWeek(t.week)}</span>
                <div style={{ flex: 1, display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.progressTrack || colors.cardBorder }}>
                  {t.confirmed > 0 && <div style={{ width: `${(t.confirmed / maxVal) * 100}%`, backgroundColor: '#34D399', height: '100%' }} />}
                  {t.detected > 0 && <div style={{ width: `${(t.detected / maxVal) * 100}%`, backgroundColor: '#FB923C', height: '100%' }} />}
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 24, textAlign: 'right' }}>{total}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Match Accuracy */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Match Feedback (12 Weeks)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#34D399', display: 'inline-block' }} /> Confirmed</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#EF4444', display: 'inline-block' }} /> Rejected</span>
          </div>
          {trends.map((t, idx) => {
            const total = t.matchesConfirmed + t.matchesRejected;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 50, textAlign: 'right', flexShrink: 0 }}>{formatWeek(t.week)}</span>
                <div style={{ flex: 1, display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.progressTrack || colors.cardBorder }}>
                  {t.matchesConfirmed > 0 && <div style={{ width: `${(t.matchesConfirmed / maxVal) * 100}%`, backgroundColor: '#34D399', height: '100%' }} />}
                  {t.matchesRejected > 0 && <div style={{ width: `${(t.matchesRejected / maxVal) * 100}%`, backgroundColor: '#EF4444', height: '100%' }} />}
                </div>
                <span style={{ fontSize: '0.75rem', color: colors.textMuted, width: 24, textAlign: 'right' }}>{total}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ── Detection Tab ───────────────────────────────────────────────────── */
function DetectionTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  const d = stats.detection;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        <StatCard label="Total Detected" value={d.totalDetected} colors={colors} />
        <StatCard label="Confirmed" value={d.confirmed} accent={colors.green} colors={colors} />
        <StatCard label="Still Pending" value={d.stillPending} accent={colors.amber} colors={colors} />
        <StatCard label="Confirm Rate" value={`${d.confirmRate}%`} accent={d.confirmRate >= 60 ? colors.green : colors.amber} colors={colors} />
      </div>

      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>How Detection Works</h3>
        <p style={{ fontSize: '0.875rem', color: colors.textMuted, lineHeight: 1.6, margin: 0 }}>
          The detection engine scans unmatched bank transactions for recurring patterns. It looks for known recurring Plaid categories (subscriptions, utilities, insurance), regular payment intervals, and merchants appearing 3+ times. A high confirm rate means the engine is finding real bills. A low rate means it's creating noise — thresholds may need tuning.
        </p>
      </Card>

      {/* Category Rules tied to detection */}
      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>Category Rules (Global)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <MiniStat label="Total Rules" value={stats.categoryRules.total} colors={colors} />
          <MiniStat label="User-Created" value={stats.categoryRules.bySource.user} colors={colors} />
          <MiniStat label="AI-Created" value={stats.categoryRules.bySource.aiCorrection + stats.categoryRules.bySource.aiNewMerchant} colors={colors} />
        </div>
      </Card>
    </div>
  );
}

/* ── Merchants Tab ──────────────────────────────────────────────────── */
function MerchantsTab({ stats, colors }: { stats: AdminStats; colors: any }) {
  const g = stats.globalMerchants;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Total Classified" value={g.totalClassified} colors={colors} />
        <StatCard label="AI Batch" value={g.bySource.aiBatch} accent="#A78BFA" colors={colors} />
        <StatCard label="AI One-time" value={g.bySource.aiOnetime} accent="#38BDF8" colors={colors} />
        <StatCard label="Crowdsourced" value={g.bySource.crowdsourced} accent={colors.green} colors={colors} />
        <StatCard label="Plaid Mapped" value={g.bySource.plaidMapped} accent="#FB923C" colors={colors} />
        <StatCard label="Avg Confidence" value={`${g.avgConfidence}%`} colors={colors} />
      </div>

      <Card style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, marginBottom: '0.75rem' }}>Plaid Category Mappings</h3>
        <p style={{ fontSize: '0.875rem', color: colors.textMuted, lineHeight: 1.6, margin: 0 }}>
          {g.plaidMappingsCount} Plaid categories are mapped to Keipr budget categories. These mappings are used in Step 3 of the pipeline when a merchant isn't found in user rules or the global map.
        </p>
      </Card>
    </div>
  );
}

/* ── Timeline Tab ───────────────────────────────────────────────────── */
function TimelineTab({ timeline, colors }: { timeline: TimelineEvent[]; colors: any }) {
  if (timeline.length === 0) {
    return (<Card style={{ padding: '2rem', textAlign: 'center' }}><p style={{ color: colors.textMuted }}>No AI activity recorded yet.</p></Card>);
  }

  function getIcon(e: TimelineEvent): string {
    if (e.type === 'suggestion') return e.status === 'applied' ? '✅' : e.status === 'dismissed' ? '❌' : '💡';
    if (e.type === 'match_feedback') return e.action === 'confirmed' ? '✅' : e.action === 'rejected' ? '❌' : '🔗';
    if (e.type === 'classification') return '🏷️';
    if (e.type === 'detection') return e.status === 'confirmed' ? '📋✅' : '📋';
    return '📋';
  }

  function getDesc(e: TimelineEvent): string {
    if (e.type === 'suggestion') {
      const p = e.payload || {};
      if (e.subtype === 'category_fix') return `Category fix: ${p.merchantName || '?'} → ${p.suggestedCategory || '?'} (${e.status})`;
      if (e.subtype === 'budget_creation') return `Budget: ${p.category || '?'} at $${Math.round((p.suggestedAmount || 0) / 100)}/paycheck (${e.status})`;
      return `Suggestion (${e.status})`;
    }
    if (e.type === 'match_feedback') return `Match ${e.action} (${Math.round((e.confidence || 0) * 100)}% confidence)`;
    if (e.type === 'classification') return `Classified "${e.merchant}" as ${e.category} (${e.source})`;
    if (e.type === 'detection') return `Detected bill: ${e.merchant} $${((e.amount || 0) / 100).toFixed(2)} (${e.status})`;
    return 'Unknown event';
  }

  function timeAgo(ts: string): string {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
  }

  return (
    <Card style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ maxHeight: '650px', overflowY: 'auto' }}>
        {timeline.map((e, idx) => (
          <div key={idx} style={{ padding: '0.875rem 1.25rem', borderBottom: idx < timeline.length - 1 ? `1px solid ${colors.cardBorder}` : 'none', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', lineHeight: '1.5' }}>{getIcon(e)}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.875rem', color: colors.text, margin: 0, lineHeight: 1.5 }}>{getDesc(e)}</p>
              {e.type === 'suggestion' && e.payload?.reasoning && (
                <p style={{ fontSize: '0.8125rem', color: colors.textMuted, fontStyle: 'italic', margin: '0.25rem 0 0 0' }}>{e.payload.reasoning}</p>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: colors.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(e.timestamp)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Shared Components ──────────────────────────────────────────────── */
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500, backgroundColor: `${color}20`, color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color }} />{label}
    </span>
  );
}

function StatCard({ label, value, accent, colors }: { label: string; value: number | string; accent?: string; colors: any }) {
  return (
    <Card style={{ padding: '0.875rem 1rem' }}>
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: accent || colors.text, margin: 0 }}>{value}</p>
    </Card>
  );
}

function MiniStat({ label, value, colors }: { label: string; value: number | string; colors: any }) {
  return (<div style={{ textAlign: 'center' }}><p style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text, margin: 0 }}>{value}</p><p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0 0' }}>{label}</p></div>);
}

function BarRow({ label, count, total, color, colors }: { label: string; count: number; total: number; color: string; colors: any }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.875rem', color: colors.text }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, backgroundColor: colors.progressTrack || colors.cardBorder, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}
