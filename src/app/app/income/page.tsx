'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import MerchantLogo from '@/components/MerchantLogo';

export default function IncomePage() {
  const { colors, isDark } = useTheme();
  const { incomeSources, fmt, isUltra } = useApp();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const regularSources = incomeSources.filter((s: any) => !s.isOneTime);
  const oneTimeSources = incomeSources.filter((s: any) => s.isOneTime);
  const totalPaycheck = regularSources.reduce((sum: number, s: any) => sum + (s.typicalAmount || 0), 0);

  useEffect(() => {
    const loadDeposits = async () => {
      if (!isUltra) { setLoading(false); return; }
      try {
        const [incomeRes, matchedRes] = await Promise.all([
          bankingAPI.getAllTransactions({ category: 'income', days: 60, limit: 50 }),
          bankingAPI.getAllTransactions({ category: 'income_matched', days: 60, limit: 50 }),
        ]);
        const incomeTxns = (incomeRes as any).data?.transactions || [];
        const matchedTxns = (matchedRes as any).data?.transactions || [];
        const all = [...incomeTxns, ...matchedTxns].sort(
          (a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        );
        setDeposits(all);
      } catch (err) {
        console.log('Error loading deposits:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDeposits();
  }, [isUltra]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFrequency = (freq: string) => {
    if (freq === 'biweekly') return 'Every 2 weeks';
    if (freq === 'weekly') return 'Weekly';
    if (freq === 'twicemonthly') return 'Twice a month';
    if (freq === 'monthly') return 'Monthly';
    return freq;
  };

  // Group deposits by month
  const groupedDeposits: Record<string, any[]> = {};
  deposits.forEach((txn: any) => {
    const d = new Date(txn.transaction_date + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedDeposits[key]) groupedDeposits[key] = [];
    groupedDeposits[key].push(txn);
  });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link href="/app" style={{ color: colors.text, textDecoration: 'none', fontSize: '1.25rem' }}>←</Link>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: colors.text, margin: 0 }}>Income</h1>
      </div>

      {/* Total Hero */}
      <Card style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.7rem', color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.375rem 0' }}>
          Per Paycheck
        </p>
        <p style={{ fontSize: '2rem', fontWeight: 800, color: '#0A7B6C', margin: 0 }}>
          {fmt(totalPaycheck)}
        </p>
        {regularSources.length > 1 && (
          <p style={{ fontSize: '0.8rem', color: colors.textSub, margin: '0.25rem 0 0 0' }}>
            from {regularSources.length} income sources
          </p>
        )}
      </Card>

      {/* Income Sources */}
      <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.75rem 0' }}>
        Income Sources
      </h2>
      {regularSources.map((source: any) => (
        <Card key={source.id} style={{ padding: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, backgroundColor: '#0A7B6C20',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A7B6C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>{source.name}</p>
            <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.125rem 0 0 0' }}>
              {formatFrequency(source.frequency)}
              {source.nextPayDate ? ` · Next: ${formatDate(source.nextPayDate)}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0A7B6C', margin: 0 }}>{fmt(source.typicalAmount)}</p>
            {source.isPrimary && (
              <p style={{ fontSize: '0.625rem', color: '#38BDF8', margin: '0.125rem 0 0 0' }}>PRIMARY</p>
            )}
          </div>
        </Card>
      ))}

      {/* One-Time Funds */}
      {oneTimeSources.length > 0 && (
        <>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1.25rem 0 0.75rem 0' }}>
            One-Time Funds
          </h2>
          {oneTimeSources.map((source: any) => (
            <Card key={source.id} style={{ padding: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, backgroundColor: '#854F0B20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>{source.name}</p>
                <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.125rem 0 0 0' }}>One-time</p>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#854F0B', margin: 0 }}>{fmt(source.typicalAmount)}</p>
            </Card>
          ))}
        </>
      )}

      {/* Recent Deposits (Ultra only) */}
      {isUltra && (
        <>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1.5rem 0 0.75rem 0' }}>
            Recent Deposits
          </h2>

          {loading ? (
            <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: colors.textSub, margin: 0 }}>Loading deposits...</p>
            </Card>
          ) : deposits.length === 0 ? (
            <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: colors.textSub, margin: 0 }}>No deposits found in the last 60 days</p>
            </Card>
          ) : (
            Object.entries(groupedDeposits).map(([month, txns]) => (
              <div key={month} style={{ marginBottom: '0.75rem' }}>
                {/* Month header */}
                <div style={{
                  backgroundColor: isDark ? 'rgba(232,229,220,0.04)' : 'rgba(0,0,0,0.07)',
                  padding: '0.5rem 0.875rem', borderRadius: 8, marginBottom: '0.25rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSub }}>{month}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A7B6C' }}>
                    {fmt(txns.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0))}
                  </span>
                </div>

                {/* Transactions */}
                {txns.map((txn: any) => (
                  <div key={txn.id} style={{
                    display: 'flex', alignItems: 'center', padding: '0.75rem 0.25rem',
                    borderBottom: `0.5px solid ${colors.cardBorder}`,
                  }}>
                    <MerchantLogo
                      merchantName={txn.merchant_name || txn.name || ''}
                      category={txn.budget_category || 'Income'}
                      size={36}
                    />
                    <div style={{ flex: 1, marginLeft: '0.75rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                        {txn.merchant_name || txn.name || 'Deposit'}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: colors.textSub, margin: '0.125rem 0 0 0' }}>
                        {formatDate(txn.transaction_date)}
                        {txn.display_category === 'income_matched' ? ' · Matched' : ''}
                      </p>
                    </div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0A7B6C', margin: 0 }}>
                      +{fmt(Math.abs(txn.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* Manage link */}
      <Link href="/app/settings" style={{ textDecoration: 'none', display: 'block', marginTop: '1.5rem' }}>
        <Card style={{ padding: '0.875rem', textAlign: 'center', cursor: 'pointer' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#38BDF8', margin: 0 }}>Manage Income Sources</p>
        </Card>
      </Link>
    </div>
  );
}
