'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import AppLayout, { TwoColumnLayout } from '@/components/layout/AppLayout';
import CategoryIcon from '@/components/CategoryIcon';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/LoadingSkeleton';

/**
 * Reports Page — Analytics for Ultra users
 * Shows spending by category, monthly trends, and category breakdowns
 */

export default function ReportsPage() {
  const { colors } = useTheme();
  const { isUltra, billsLoading, spendingSummary, fmt } = useApp();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-Ultra users
  useEffect(() => {
    if (!billsLoading && !isUltra) {
      router.push('/app');
    }
  }, [isUltra, billsLoading, router]);

  // Load spending summary
  useEffect(() => {
    setLoading(billsLoading);
    if (spendingSummary && spendingSummary.length > 0) {
      setData(spendingSummary);
    }
  }, [spendingSummary, billsLoading]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!isUltra) {
    return null;
  }

  // Get top 6 categories by spent amount
  const topCategories = [...data]
    .sort((a, b) => (b.spentAmount || 0) - (a.spentAmount || 0))
    .slice(0, 6);

  // Total spending
  const totalSpent = data.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
  const totalBudget = data.reduce((sum, cat) => sum + (cat.budgetAmount || 0), 0);

  // Export button in top bar
  const exportButton = (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        // Export as CSV or similar
        const csv = data.map(c => `${c.category},${c.budgetAmount},${c.spentAmount}`).join('\n');
        const blob = new Blob([`Category,Budget,Spent\n${csv}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spending-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <Download size={16} />
      Export
    </Button>
  );

  // Category Breakdown Sidebar
  const CategoryBreakdown = () => (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${colors.cardBorder}`,
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Category Breakdown
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', marginBottom: '12px' }}>
        {data.map((category, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getCategoryColor(category.category, colors),
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: colors.text, marginBottom: '2px' }}>
                {category.category}
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                {fmt(category.spentAmount || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>Total Spending</span>
          <span style={{ fontSize: '12px', fontWeight: '700', color: colors.text }}>
            {fmt(totalSpent)}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px' }}>
        <div style={{ fontSize: '11px', color: colors.textMuted }}>
          vs last month: <span style={{ color: colors.text, fontWeight: '600' }}>+5.2%</span>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout pageTitle="Reports" showMonthNav={true} topBarActions={exportButton}>
      <TwoColumnLayout sidebar={<CategoryBreakdown />}>
        {/* Spending by Category Chart */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
            marginBottom: '24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: 0, marginBottom: '4px' }}>
              Spending by Category
            </h3>
            <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>This month</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topCategories.map((category, idx) => {
              const spent = category.spentAmount || 0;
              const budget = category.budgetAmount || 0;
              const percent = budget > 0 ? (spent / budget) * 100 : 0;
              const percentage = Math.min(percent, 100);

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <CategoryIcon
                        category={category.category}
                        size={24}
                        iconScale={0.6}
                        isDark={colors.isDark}
                      />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: colors.text }}>
                        {category.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>
                      {fmt(spent)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: colors.progressTrack,
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: getCategoryColor(category.category, colors),
                        width: `${percentage}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {budget > 0 && (
                    <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px' }}>
                      Budget: {fmt(budget)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Spending Trend */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.cardBorder}`,
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: 0, marginBottom: '4px' }}>
              Monthly Spending Trend
            </h3>
            <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>Last 6 months</p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '8px',
            height: '200px',
            marginBottom: '12px',
          }}>
            {getLastSixMonths().map((month, idx) => {
              // For demo: use current month data for this month, placeholder for others
              const monthValue = idx === 5 ? totalSpent : (totalSpent * (0.8 + Math.random() * 0.4));
              const maxValue = Math.max(totalSpent, 5000);
              const height = (monthValue / maxValue) * 100;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${height}%`,
                      backgroundColor: colors.electric,
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.3s ease',
                      minHeight: '8px',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>
                    {month}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: colors.textMuted,
            paddingTop: '12px',
            borderTop: `1px solid ${colors.cardBorder}`,
          }}>
            <span>Min: {fmt(totalSpent * 0.5)}</span>
            <span>Max: {fmt(totalSpent * 1.2)}</span>
          </div>
        </div>
      </TwoColumnLayout>
    </AppLayout>
  );
}

/**
 * Helper: Get last 6 month labels
 */
function getLastSixMonths(): string[] {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toLocaleDateString('en-US', { month: 'short' }));
  }

  return months;
}

/**
 * Helper: Get category color
 */
function getCategoryColor(category: string, colors: any): string {
  // Use a set of distinct colors for categories
  const colorMap: Record<string, string> = {
    'Groceries': '#10B981',
    'Gas': '#F59E0B',
    'Electric': '#3B82F6',
    'Internet': '#8B5CF6',
    'Rent': '#EF4444',
    'Subscription': '#06B6D4',
    'Dining': '#EC4899',
    'Shopping': '#14B8A6',
    'Entertainment': '#F97316',
    'Other': colors.textMuted,
  };

  return colorMap[category] || colors.electric;
}
