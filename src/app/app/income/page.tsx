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

  // Income source names to exclude paychecks (already shown in Income Sources section)
  const incomeSourceNames = incomeSources.map((s: any) => (s.name || '').toUpperCase()).filter(Boolean);

  useEffect(() => {
    const loadDeposits = async () => {
      if (!isUltra) { setLoading(false); return; }
      try {
        // Simple approach: fetch income + income_matched (Plaid already classified these as real deposits)
        // Also fetch transfer — but only keep ones Plaid tagged as TRANSFER_IN_DEPOSIT (check deposits, 401k, etc.)
        const [incomeRes, matchedRes, transferRes] = await Promise.all([
          bankingAPI.getAllTransactions({ category: 'income', days: 90, limit: 100 }),
          bankingAPI.getAllTransactions({ category: 'income_matched', days: 90, limit: 100 }),
          bankingAPI.getAllTransactions({ category: 'transfer', days: 90, limit: 100 }),
        ]);
        const incomeTxns = ((incomeRes as any).data?.transactions || []) as any[];
        const matchedTxns = ((matchedRes as any).data?.transactions || []) as any[];
        // From transfers, ONLY keep actual deposits (Plaid subcategory contains DEPOSIT)
        const transferDeposits = ((transferRes as any).data?.transactions || []).filter((t: any) => {
          const sub = (t.personal_finance_subcategory || '').toUpperCase();
          return sub.includes('DEPOSIT');
        }) as any[];

        // Combine, deduplicate, exclude paychecks, sort newest first
        const seen = new Set<string>();
        const all = [...incomeTxns, ...matchedTxns, ...transferDeposits]
          .filter((t: any) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; })
          .filter((t: any) => {
            // Minimum $5 threshold — filters out savings interest pennies, rounding credits, etc.
            if (Math.abs(t.amount) < 5) return false;
            // Exclude transactions already matched to an income source (paycheck)
            if (t.matched_income_source_id) return false;
            // Exclude transactions whose name matches a known income source
            const name = (t.cleaned_name || t.merchant_name || t.name || '').toUpperCase();
            if (incomeSourceNames.some((srcName: string) => srcName && name.includes(srcName))) return false;
            return true;
          })
          .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
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
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatFrequency = (freq: string) => {
    if (freq === 'biweekly') return 'Every 2 weeks';
    if (freq === 'weekly') return 'Weekly';
    if (freq === 'twicemonthly') return 'Twice a month';
    if (freq === 'monthly') return 'Monthly';
    return freq;
  };

  const groupedDeposits: Record<string, any[]> = {};
  deposits.forEach((txn: any) => {
    const d = new Date(txn.transaction_date + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedDeposits[key]) groupedDeposits[key] = [];
    groupedDeposits[key].push(txn);
  });

  const totalDeposits = deposits.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <Link href="/app" style={{
          width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.inputBg, textDecoration: 'none', color: colors.text, fontSize: '1.1rem',
        }}>←</Link>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: colors.text, margin: 0 }}>Income</h1>
      </div>

      {/* Hero */}
      <Card style={{
        padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem',
        background: isDark ? 'rgba(10,123,108,0.08)' : 'rgba(10,123,108,0.06)',
        border: `1px solid ${isDark ? 'rgba(10,123,108,0.2)' : 'rgba(10,123,108,0.15)'}`,
      }}>
        <p style={{ fontSize: '0.75rem', color: '#0A7B6C', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
          Per Paycheck
        </p>
        <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0A7B6C', margin: 0, letterSpacing: '-0.5px' }}>
          {fmt(totalPaycheck)}
        </p>
        {regularSources.length > 1 && (
          <p style={{ fontSize: '0.8rem', color: colors.textSub, margin: '0.375rem 0 0 0' }}>
            from {regularSources.length} income sources
          </p>
        )}
      </Card>

      {/* Income Sources */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.75rem 0' }}>
        Income Sources
      </h2>
      {regularSources.map((source: any) => (
        <Link key={source.id} href="/app/settings" style={{ textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
          <Card style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', cursor: 'pointer' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(10,123,108,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A7B6C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, margin: 0 }}>{source.name}</p>
              <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.1875rem 0 0 0' }}>
                {formatFrequency(source.frequency)}
                {source.nextPayDate ? `  ·  Next: ${formatDate(source.nextPayDate)}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0A7B6C', margin: 0 }}>{fmt(source.typicalAmount)}</p>
              {source.isPrimary && (
                <span style={{
                  fontSize: '0.5625rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.5px',
                  backgroundColor: 'rgba(56,189,248,0.12)', padding: '2px 6px', borderRadius: 4,
                  display: 'inline-block', marginTop: 4,
                }}>PRIMARY</span>
              )}
            </div>
          </Card>
        </Link>
      ))}

      {/* One-Time Funds */}
      {oneTimeSources.length > 0 && (
        <>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '1px', margin: '1.5rem 0 0.75rem 0' }}>
            One-Time Funds
          </h2>
          {oneTimeSources.map((source: any) => (
            <Card key={source.id} style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(133,79,11,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, margin: 0 }}>{source.name}</p>
                <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.1875rem 0 0 0' }}>One-time</p>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#854F0B', margin: 0 }}>{fmt(source.typicalAmount)}</p>
            </Card>
          ))}
        </>
      )}

      {/* Recent Deposits (Ultra) */}
      {isUltra && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 0.75rem 0' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Recent Deposits
            </h2>
            {deposits.length > 0 && (
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A7B6C' }}>{fmt(totalDeposits)} total</span>
            )}
          </div>

          {loading ? (
            <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: colors.textSub, margin: 0 }}>Loading deposits...</p>
            </Card>
          ) : deposits.length === 0 ? (
            <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>🏦</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: '0 0 0.25rem 0' }}>No recent deposits</p>
              <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: 0 }}>Refunds, bonuses, and other deposits will appear here</p>
            </Card>
          ) : (
            <Card style={{ overflow: 'hidden', padding: 0 }}>
              {Object.entries(groupedDeposits).map(([month, txns], groupIdx) => (
                <div key={month}>
                  <div style={{
                    backgroundColor: isDark ? 'rgba(232,229,220,0.06)' : 'rgba(0,0,0,0.05)',
                    padding: '0.625rem 1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: groupIdx > 0 ? `0.5px solid ${colors.cardBorder}` : 'none',
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.text }}>{month}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0A7B6C' }}>
                      +{fmt(txns.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0))}
                    </span>
                  </div>
                  {txns.map((txn: any) => (
                    <div key={txn.id} style={{
                      display: 'flex', alignItems: 'center', padding: '0.875rem 1rem',
                      borderTop: `0.5px solid ${colors.cardBorder}40`,
                    }}>
                      <MerchantLogo billName={txn.merchant_name || txn.name || ''} category={txn.budget_category || 'Income'} size={38} isDark={isDark} />
                      <div style={{ flex: 1, marginLeft: '0.75rem' }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                          {txn.merchant_name || txn.name || 'Deposit'}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: colors.textSub, margin: '0.125rem 0 0 0' }}>
                          {formatDate(txn.transaction_date)}
                        </p>
                      </div>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0A7B6C', margin: 0 }}>
                        +{fmt(Math.abs(txn.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {/* Manage link */}
      <Link href="/app/settings" style={{ textDecoration: 'none', display: 'block', marginTop: '1.5rem' }}>
        <Card style={{
          padding: '1rem', textAlign: 'center', cursor: 'pointer',
          background: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.06)',
          border: `1px solid ${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(56,189,248,0.15)'}`,
        }}>
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#38BDF8', margin: 0 }}>Manage Income Sources</p>
        </Card>
      </Link>
    </div>
  );
}
