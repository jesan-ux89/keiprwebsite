'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { usersAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import MerchantLogo from '@/components/MerchantLogo';
import AppLayout from '@/components/layout/AppLayout';

export default function IncomePage() {
  const { colors, isDark } = useTheme();
  const { incomeSources, fmt, isUltra, isPro, refreshIncomeSources } = useApp();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackModal, setTrackModal] = useState(false);
  const [trackingTxn, setTrackingTxn] = useState<any>(null);
  const [trackName, setTrackName] = useState('');
  const [saving, setSaving] = useState(false);

  const regularSources = incomeSources.filter((s: any) => !s.isOneTime);
  const oneTimeSources = incomeSources.filter((s: any) => s.isOneTime);
  const totalPaycheck = regularSources.reduce((sum: number, s: any) => sum + (s.typicalAmount || 0), 0);

  // Helper: check if a deposit is already tracked as a one-time fund
  const isAlreadyTracked = (txn: any) => {
    const amt = Math.abs(txn.amount);
    return oneTimeSources.some((s: any) => Math.abs(s.typicalAmount - amt) < 0.01);
  };

  useEffect(() => {
    const loadDeposits = async () => {
      if (!isUltra) { setLoading(false); return; }
      try {
        const res = await usersAPI.getIncomeDeposits({ days: 180, limit: 100 });
        const sorted = (((res as any).data?.deposits || []) as any[])
          .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
        setDeposits(sorted);
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
    <AppLayout pageTitle="Income">
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

      <section className="app-page-hero" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="app-page-kicker">Income</p>
          <h1 className="app-page-title">Every dollar coming in.</h1>
          <p className="app-page-subtitle">
            Track regular paychecks and one-time funds so the budget knows what belongs to this cycle.
          </p>
          <div className="app-metric-grid" style={{ marginTop: '1.35rem' }}>
            {[
              { label: 'Per paycheck', value: fmt(totalPaycheck), detail: `${regularSources.length} regular source${regularSources.length === 1 ? '' : 's'}`, color: colors.green },
              { label: 'One-time funds', value: oneTimeSources.length, detail: 'tracked separately', color: colors.amber },
              { label: 'Recent deposits', value: fmt(totalDeposits), detail: `${deposits.length} detected`, color: colors.text },
            ].map((item) => (
              <div key={item.label} className="app-soft-panel" style={{ padding: '0.95rem' }}>
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.textMuted }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: item.color }}>
                  {item.value}
                </p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: colors.textMuted }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '1px', margin: '1.5rem 0 0.25rem 0' }}>
            One-Time Funds
          </h2>
          {isUltra && (
            <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0 0 0.75rem 0' }}>
              For money not deposited into your connected accounts (cash, gifts, etc.)
            </p>
          )}
          {!isUltra && <div style={{ height: '0.5rem' }} />}
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
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      if (txn.matched_income_source_id || txn.matchedIncomeSourceId) {
                        alert(`This deposit is linked to ${txn.source_name || txn.sourceName || 'an income source'}.`);
                        return;
                      }
                      if (isAlreadyTracked(txn)) {
                        alert('This deposit is already saved as a One-Time Fund.');
                        return;
                      }
                      setTrackingTxn(txn);
                      setTrackName(txn.cleaned_name || txn.merchant_name || txn.name || 'Deposit');
                      setTrackModal(true);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(232,229,220,0.05)' : 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    >
                      <MerchantLogo billName={txn.merchant_name || txn.name || ''} category={txn.budget_category || 'Income'} size={38} isDark={isDark} />
                      <div style={{ flex: 1, marginLeft: '0.75rem' }}>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                          {txn.merchant_name || txn.name || 'Deposit'}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: colors.textSub, margin: '0.125rem 0 0 0' }}>
                          {formatDate(txn.transaction_date)}
                          {(txn.source_name || txn.sourceName) ? ` - ${txn.source_name || txn.sourceName}` : ''}
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

      {/* Track as One-Time Fund Modal */}
      {trackModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setTrackModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: '2rem',
            width: '90%',
            maxWidth: 420,
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: colors.text, margin: '0 0 0.25rem 0' }}>
              Track as One-Time Fund
            </h3>
            <p style={{ fontSize: '0.8rem', color: colors.textSub, margin: '0 0 1.25rem 0' }}>
              Save this deposit so you can track how it's used
            </p>

            {/* Amount display */}
            <div style={{
              background: isDark ? 'rgba(10,123,108,0.08)' : 'rgba(10,123,108,0.06)',
              borderRadius: 14,
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1.25rem',
              border: `1px solid ${isDark ? 'rgba(10,123,108,0.2)' : 'rgba(10,123,108,0.15)'}`,
            }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0A7B6C', margin: 0 }}>
                {trackingTxn ? fmt(Math.abs(trackingTxn.amount)) : ''}
              </p>
              <p style={{ fontSize: '0.75rem', color: colors.textSub, margin: '0.25rem 0 0 0' }}>
                {trackingTxn ? new Date(trackingTxn.transaction_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
              </p>
            </div>

            {/* Name input */}
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fund Name
            </label>
            <input
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: colors.inputBg,
                borderRadius: 12,
                padding: '0.875rem',
                fontSize: '1rem',
                color: colors.text,
                border: `1px solid ${colors.cardBorder}`,
                marginTop: '0.375rem',
                marginBottom: '1.25rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., 401k Withdrawal, Tax Refund"
            />

            {/* Confirm button */}
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await usersAPI.addIncomeSource({
                    name: trackName.trim() || 'Deposit',
                    frequency: 'monthly',
                    typicalAmount: Math.abs(trackingTxn.amount),
                    isOneTime: true,
                    linkedTransactionId: trackingTxn.plaid_transaction_id || trackingTxn.id,
                  });
                  if (refreshIncomeSources) await refreshIncomeSources();
                  setTrackModal(false);
                  setTrackingTxn(null);
                  alert(`"${trackName.trim()}" has been added to your One-Time Funds.`);
                } catch (err: any) {
                  if (err?.response?.data?.code === 'PRO_REQUIRED') {
                    alert('One-time fund tracking requires Keipr Pro.');
                  } else {
                    alert('Could not save. Please try again.');
                  }
                } finally {
                  setSaving(false);
                }
              }}
              style={{
                width: '100%',
                backgroundColor: '#38BDF8',
                borderRadius: 14,
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#fff',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save as One-Time Fund'}
            </button>

            {/* Cancel */}
            <button
              onClick={() => setTrackModal(false)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '0.75rem',
                marginTop: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: colors.textSub,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
