'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import { reportsAPI } from '@/lib/api';

/**
 * Reports Page — Ultra-only analytics.
 * Data-backed: spending-by-category bar chart + 6-month trend + MoM comparison + CSV export.
 * Uses pure SVG for charts (no chart library dependency).
 */

type CategoryRow = {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  amountCents: number;
  txnCount: number;
};

type MonthRow = {
  year: number;
  month: number;
  totalSpentCents: number;
  totalIncomeCents: number;
};

// Fallback palette for categories that don't have a user-assigned color
const FALLBACK_PALETTE = [
  '#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#84CC16', '#A855F7',
];

function centsToDollars(c: number): number {
  return c / 100;
}

function monthShortLabel(year: number, month: number): string {
  // month is 1-based
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function resolveColor(cat: CategoryRow, idx: number): string {
  if (cat.color && cat.color !== '#0C4A6E') return cat.color;
  return FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
}

export default function ReportsPage() {
  const { colors, isDark } = useTheme();
  const { isUltra, billsLoading, fmt } = useApp();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [trend, setTrend] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gate: redirect non-Ultra users
  useEffect(() => {
    if (!billsLoading && !isUltra) {
      router.push('/app');
    }
  }, [isUltra, billsLoading, router]);

  // Fetch report data
  useEffect(() => {
    if (!isUltra) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [catRes, trendRes] = await Promise.all([
          reportsAPI.getSpendingByCategory(6),
          reportsAPI.getMonthlyTrend(6),
        ]);
        if (cancelled) return;
        setCategories(catRes.data?.categories || []);
        setTrend(trendRes.data?.months || []);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to load reports';
        setErrorMsg(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isUltra]);

  const totalSpent = useMemo(
    () => categories.reduce((s, c) => s + c.amountCents, 0),
    [categories]
  );

  // Month-over-month: compare last month vs previous month
  const { momPct, lastMonthCents, prevMonthCents } = useMemo(() => {
    if (trend.length < 2) {
      return { momPct: null as number | null, lastMonthCents: 0, prevMonthCents: 0 };
    }
    const last = trend[trend.length - 1].totalSpentCents;
    const prev = trend[trend.length - 2].totalSpentCents;
    if (prev === 0) {
      return { momPct: null, lastMonthCents: last, prevMonthCents: prev };
    }
    return {
      momPct: ((last - prev) / prev) * 100,
      lastMonthCents: last,
      prevMonthCents: prev,
    };
  }, [trend]);

  // CSV export: combines category breakdown + monthly trend
  const handleExport = () => {
    const lines: string[] = [];
    lines.push('Keipr Spending Report');
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push('');
    lines.push('Spending by Category (last 6 months)');
    lines.push('Category,Amount USD,Transactions');
    for (const c of categories) {
      const amount = centsToDollars(c.amountCents).toFixed(2);
      const safeName = `"${c.categoryName.replace(/"/g, '""')}"`;
      lines.push(`${safeName},${amount},${c.txnCount}`);
    }
    lines.push('');
    lines.push('Monthly Trend');
    lines.push('Year,Month,Spent USD,Income USD');
    for (const m of trend) {
      lines.push(`${m.year},${m.month},${centsToDollars(m.totalSpentCents).toFixed(2)},${centsToDollars(m.totalIncomeCents).toFixed(2)}`);
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keipr-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || billsLoading) {
    return (
      <AppLayout pageTitle="Reports" showMonthNav={false}>
        <DashboardSkeleton />
      </AppLayout>
    );
  }
  if (!isUltra) return null;

  const hasData = categories.length > 0 || trend.some(m => m.totalSpentCents > 0);

  const exportButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExport}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <Download size={16} />
      Export CSV
    </Button>
  );

  if (!hasData && !errorMsg) {
    return (
      <AppLayout pageTitle="Reports" showMonthNav={false} topBarActions={exportButton}>
        <EmptyState
          icon="banking"
          title="No spending data yet"
          description="Once your bank transactions sync, you'll see spending breakdowns and trends here."
          actionLabel="Go to Dashboard"
          onAction={() => router.push('/app')}
        />
      </AppLayout>
    );
  }

  // Pre-compute colors per category so list + chart + sidebar stay in sync
  const catsWithColor = categories.map((c, idx) => ({ ...c, resolvedColor: resolveColor(c, idx) }));
  const topForChart = catsWithColor.slice(0, 8);
  const maxCatAmount = topForChart.reduce((m, c) => Math.max(m, c.amountCents), 0) || 1;

  return (
    <AppLayout pageTitle="Reports" showMonthNav={false} topBarActions={exportButton}>
      <TwoColumnLayout
        sidebar={
          <CategorySidebar
            categories={catsWithColor}
            totalSpent={totalSpent}
            momPct={momPct}
            lastMonthCents={lastMonthCents}
            prevMonthCents={prevMonthCents}
            colors={colors}
            fmt={fmt}
          />
        }
      >
        {errorMsg && (
          <div
            style={{
              backgroundColor: `${colors.danger || '#EF4444'}15`,
              border: `1px solid ${colors.danger || '#EF4444'}40`,
              color: colors.danger || '#EF4444',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            Failed to load reports: {errorMsg}
          </div>
        )}

        {/* Spending by Category bar chart */}
        <Card colors={colors}>
          <CardHeader
            title="Spending by Category"
            subtitle={`Last 6 months · ${catsWithColor.length} ${catsWithColor.length === 1 ? 'category' : 'categories'}`}
            colors={colors}
          />

          {topForChart.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
              No categorized spending in the last 6 months.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topForChart.map((c) => {
                const widthPct = (c.amountCents / maxCatAmount) * 100;
                return (
                  <div key={c.categoryName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '3px',
                            backgroundColor: c.resolvedColor,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: colors.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.categoryName}
                        </span>
                        <span style={{ fontSize: '11px', color: colors.textMuted, flexShrink: 0 }}>
                          · {c.txnCount} {c.txnCount === 1 ? 'txn' : 'txns'}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, flexShrink: 0 }}>
                        {fmt(centsToDollars(c.amountCents))}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        backgroundColor: colors.progressTrack || (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${widthPct}%`,
                          backgroundColor: c.resolvedColor,
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div style={{ height: '20px' }} />

        {/* 6-month trend chart */}
        <Card colors={colors}>
          <CardHeader
            title="Monthly Trend"
            subtitle="Spending and income, last 6 months"
            colors={colors}
          />
          <TrendChart trend={trend} colors={colors} isDark={isDark} fmt={fmt} />
        </Card>
      </TwoColumnLayout>
    </AppLayout>
  );
}

// ───────────────────────── Sub-components ─────────────────────────

function Card({ children, colors }: { children: React.ReactNode; colors: Record<string, string> }) {
  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: '14px',
        padding: '22px',
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, colors }: { title: string; subtitle?: string; colors: Record<string, string> }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: colors.text, margin: 0, marginBottom: '4px' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TrendChart({
  trend,
  colors,
  isDark,
  fmt,
}: {
  trend: MonthRow[];
  colors: Record<string, string>;
  isDark: boolean;
  fmt: (n: number) => string;
}) {
  if (trend.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
        No transaction history yet.
      </div>
    );
  }

  // SVG area+line chart
  const W = 620;
  const H = 220;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const spentVals = trend.map(m => m.totalSpentCents);
  const incomeVals = trend.map(m => m.totalIncomeCents);
  const maxVal = Math.max(1, ...spentVals, ...incomeVals);
  // Round max up to nearest $1000 for a nicer y-axis
  const niceMax = Math.ceil(maxVal / 100 / 1000) * 1000 * 100 || maxVal;

  const xFor = (idx: number) =>
    trend.length <= 1 ? padL + innerW / 2 : padL + (idx / (trend.length - 1)) * innerW;
  const yFor = (cents: number) => padT + innerH - (cents / niceMax) * innerH;

  // Points
  const spentPts = trend.map((m, i) => ({ x: xFor(i), y: yFor(m.totalSpentCents), cents: m.totalSpentCents }));
  const incomePts = trend.map((m, i) => ({ x: xFor(i), y: yFor(m.totalIncomeCents), cents: m.totalIncomeCents }));

  const spentLine = spentPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const incomeLine = incomePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const spentArea = `${spentLine} L${spentPts[spentPts.length - 1].x},${padT + innerH} L${spentPts[0].x},${padT + innerH} Z`;

  const spentColor = colors.electric || '#38BDF8';
  const incomeColor = colors.success || '#10B981';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Y-axis grid lines at 25%, 50%, 75%, 100%
  const gridLines = [0.25, 0.5, 0.75, 1.0].map(f => ({
    y: padT + innerH - innerH * f,
    label: fmt(centsToDollars(niceMax * f)),
  }));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Y-axis grid + labels */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={g.y} y2={g.y} stroke={gridColor} strokeWidth={1} />
            <text
              x={padL - 6}
              y={g.y + 3}
              textAnchor="end"
              fontSize={10}
              fill={colors.textMuted}
              style={{ fontFamily: 'inherit' }}
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Spending area fill */}
        <path d={spentArea} fill={spentColor} fillOpacity={0.14} />

        {/* Spending line */}
        <path d={spentLine} fill="none" stroke={spentColor} strokeWidth={2} />

        {/* Income line (dashed) */}
        <path d={incomeLine} fill="none" stroke={incomeColor} strokeWidth={2} strokeDasharray="4 3" />

        {/* Data point dots for spending */}
        {spentPts.map((p, i) => (
          <g key={`sp-${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill={spentColor} />
            <title>{`${monthShortLabel(trend[i].year, trend[i].month)}: ${fmt(centsToDollars(p.cents))}`}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {trend.map((m, i) => (
          <text
            key={`xl-${i}`}
            x={xFor(i)}
            y={padT + innerH + 18}
            textAnchor="middle"
            fontSize={11}
            fill={colors.textMuted}
            style={{ fontFamily: 'inherit' }}
          >
            {monthShortLabel(m.year, m.month)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginTop: '10px',
          paddingTop: '12px',
          borderTop: `1px solid ${colors.cardBorder}`,
          fontSize: '11px',
          color: colors.textMuted,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '14px', height: '3px', backgroundColor: spentColor, borderRadius: '2px' }} />
          Spending
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '14px',
              height: '0',
              borderTop: `2px dashed ${incomeColor}`,
            }}
          />
          Income
        </span>
      </div>
    </div>
  );
}

function CategorySidebar({
  categories,
  totalSpent,
  momPct,
  lastMonthCents,
  prevMonthCents,
  colors,
  fmt,
}: {
  categories: (CategoryRow & { resolvedColor: string })[];
  totalSpent: number;
  momPct: number | null;
  lastMonthCents: number;
  prevMonthCents: number;
  colors: Record<string, string>;
  fmt: (n: number) => string;
}) {
  const momColor =
    momPct === null
      ? colors.textMuted
      : momPct > 0
        ? (colors.danger || '#EF4444')
        : (colors.success || '#10B981');

  const momLabel =
    momPct === null ? '—' : `${momPct > 0 ? '+' : ''}${momPct.toFixed(1)}%`;

  return (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: '14px',
        padding: '18px',
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '12px',
        }}
      >
        Category Breakdown
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '360px',
          overflowY: 'auto',
          marginBottom: '14px',
        }}
      >
        {categories.length === 0 ? (
          <div style={{ fontSize: '12px', color: colors.textMuted }}>No categories yet.</div>
        ) : (
          categories.map((c) => {
            const pct = totalSpent > 0 ? (c.amountCents / totalSpent) * 100 : 0;
            return (
              <div key={c.categoryName} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: c.resolvedColor,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.text,
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.categoryName}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>
                    {pct.toFixed(1)}% · {c.txnCount} {c.txnCount === 1 ? 'txn' : 'txns'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, flexShrink: 0 }}>
                  {fmt(centsToDollars(c.amountCents))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: colors.text }}>Total Spending</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: colors.text }}>
            {fmt(centsToDollars(totalSpent))}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}
        >
          Month over Month
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: colors.textMuted }}>vs last month</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: momColor }}>
            {momLabel}
          </span>
        </div>
        <div style={{ fontSize: '11px', color: colors.textMuted }}>
          This month: {fmt(centsToDollars(lastMonthCents))} · Prev: {fmt(centsToDollars(prevMonthCents))}
        </div>
      </div>
    </div>
  );
}
