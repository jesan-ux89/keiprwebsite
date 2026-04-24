'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Check, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

interface Confirmation {
  id: string;
  bill_id: string;
  plaid_transaction_id: string;
  merchant_name: string;
  amount: number;
  transaction_date: string;
  confidence_score: number;
  match_method: string;
  status: string;
  bills?: { name: string; total_amount: number; due_day_of_month?: number; is_split?: boolean; split_count?: number };
}

interface BillGroup {
  billId: string;
  billName: string;
  billAmount: number;
  dueDayOfMonth?: number;
  items: Confirmation[];
}

export default function ConfirmationsPage() {
  const { colors } = useTheme();
  const { fmt, refreshPendingConfirmations } = useApp();

  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [excluding, setExcluding] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Group confirmations by bill
  const billGroups: BillGroup[] = useMemo(() => {
    const groupMap = new Map<string, BillGroup>();
    for (const conf of confirmations) {
      const key = conf.bill_id;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          billId: key,
          billName: conf.bills?.name || 'Unknown Bill',
          billAmount: conf.bills?.total_amount || 0,
          dueDayOfMonth: conf.bills?.due_day_of_month,
          items: [],
        });
      }
      groupMap.get(key)!.items.push(conf);
    }
    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => a.billName.localeCompare(b.billName));
    for (const g of groups) {
      g.items.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    }
    return groups;
  }, [confirmations]);

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getConfirmations();
      setConfirmations(Array.isArray(res.data?.confirmations) ? res.data.confirmations : []);
      setError(null);
    } catch (err) {
      setError('Failed to load pending confirmations');
    } finally {
      setLoading(false);
    }
  };

  const clearItemError = (id: string) => {
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleConfirm = async (id: string) => {
    clearItemError(id);
    setConfirming(id);
    try {
      await bankingAPI.confirmMatch(id);
      setConfirmations((prev) => prev.filter((c) => c.id !== id));
      refreshPendingConfirmations();
    } catch (err: any) {
      const status = err.response?.status;
      const serverError = err.response?.data?.error || err.response?.data?.message || 'Failed to confirm match';
      const hint = status === 422 ? '\nSet up your pay schedule in Settings to resolve this.' : '';
      setItemErrors((prev) => ({ ...prev, [id]: serverError + hint }));
    } finally {
      setConfirming(null);
    }
  };

  const handleReject = async (id: string) => {
    clearItemError(id);
    setRejecting(id);
    try {
      await bankingAPI.rejectMatch(id);
      setConfirmations((prev) => prev.filter((c) => c.id !== id));
      refreshPendingConfirmations();
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message || 'Failed to reject match';
      setItemErrors((prev) => ({ ...prev, [id]: serverError }));
    } finally {
      setRejecting(null);
    }
  };

  const handleIgnoreMerchant = async (conf: Confirmation) => {
    setExcluding(conf.id);
    try {
      await bankingAPI.addExclusionRule({
        rule_type: 'merchant',
        rule_value: conf.merchant_name,
      });
      const merchantLower = conf.merchant_name.toLowerCase();
      setConfirmations((prev) => prev.filter((c) => c.merchant_name.toLowerCase() !== merchantLower));
      refreshPendingConfirmations();
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message || 'Failed to ignore merchant';
      setItemErrors((prev) => ({ ...prev, [conf.id]: serverError }));
    } finally {
      setExcluding(null);
    }
  };

  const toggleGroup = (billId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [billId]: !prev[billId] }));
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout pageTitle="Confirm Payments">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app/banking" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={18} style={{ color: colors.text }} />
            </Button>
          </Link>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.95rem' }}>
            Review and confirm transaction-to-bill matches
          </p>
        </div>

        {/* Screen-level error */}
        {error && (
          <Card
            style={{
              backgroundColor: `${colors.red}15`,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={20} style={{ color: colors.red, flexShrink: 0 }} />
            <p style={{ color: colors.red, margin: 0, fontSize: '0.95rem', flex: 1 }}>{error}</p>
          </Card>
        )}

        {/* Loading */}
        {loading ? (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: colors.textMuted }}>Loading confirmations...</p>
          </Card>
        ) : billGroups.length === 0 ? (
          /* Empty state */
          <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: `${colors.green}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Check size={28} style={{ color: colors.green }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
              All caught up!
            </h2>
            <p style={{ color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
              No pending confirmations right now.
              <br />
              We&apos;ll notify you when new matches arrive.
            </p>
          </Card>
        ) : (
          /* Bill groups */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {billGroups.map((group) => {
              const isCollapsed = collapsedGroups[group.billId] === true;
              const count = group.items.length;

              return (
                <Card key={group.billId} style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.billId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem 1.25rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: colors.electric,
                        }}
                      >
                        {group.billName}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: colors.textMuted }}>
                        {fmt(group.billAmount)}
                        {group.dueDayOfMonth ? ` · Due day ${group.dueDayOfMonth}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          backgroundColor: colors.electric,
                          color: '#fff',
                          borderRadius: '9999px',
                          padding: '0.15rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {count}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight size={16} style={{ color: colors.textMuted }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: colors.textMuted }} />
                      )}
                    </div>
                  </button>

                  {/* Transactions within group */}
                  {!isCollapsed &&
                    group.items.map((conf, idx) => {
                      const confidencePct = Math.round((conf.confidence_score || 0) * 100);
                      const variancePct =
                        group.billAmount > 0
                          ? Math.round((Math.abs(conf.amount - group.billAmount) / group.billAmount) * 100)
                          : 0;
                      const itemError = itemErrors[conf.id];
                      const isAnyActioning = confirming !== null || rejecting !== null || excluding !== null;

                      return (
                        <div
                          key={conf.id}
                          style={{
                            padding: '1rem 1.25rem',
                            borderTop: `1px solid ${colors.divider}`,
                          }}
                        >
                          {/* Transaction info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, color: colors.text, fontSize: '0.95rem' }}>
                                {conf.merchant_name}
                              </p>
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: colors.textMuted }}>
                                {formatDate(conf.transaction_date)}
                                {' · '}
                                {confidencePct}% match
                                {variancePct > 0 && (
                                  <span style={{ color: variancePct > 5 ? colors.amber : colors.green }}>
                                    {' · '}{variancePct}% variance
                                  </span>
                                )}
                              </p>
                            </div>
                            <p style={{ margin: 0, fontWeight: 700, color: colors.text, fontSize: '1rem' }}>
                              {fmt(conf.amount)}
                            </p>
                          </div>

                          {/* Inline error */}
                          {itemError && (
                            <div
                              style={{
                                backgroundColor: `${colors.amber}15`,
                                borderRadius: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                marginBottom: '0.5rem',
                              }}
                            >
                              <p style={{ margin: 0, fontSize: '0.8rem', color: colors.amber, whiteSpace: 'pre-line' }}>
                                {itemError}
                              </p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReject(conf.id)}
                              loading={rejecting === conf.id}
                              disabled={isAnyActioning}
                              style={{ flex: 1 }}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConfirm(conf.id)}
                              loading={confirming === conf.id}
                              disabled={isAnyActioning}
                              style={{ flex: 1 }}
                            >
                              Confirm
                            </Button>
                          </div>

                          {/* Ignore merchant */}
                          <button
                            onClick={() => handleIgnoreMerchant(conf)}
                            disabled={excluding === conf.id}
                            style={{
                              marginTop: '0.5rem',
                              background: 'transparent',
                              border: 'none',
                              cursor: excluding === conf.id ? 'wait' : 'pointer',
                              color: colors.textMuted,
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                              padding: 0,
                              opacity: excluding === conf.id ? 0.5 : 1,
                            }}
                          >
                            {excluding === conf.id ? 'Ignoring...' : `Don't ask again for "${conf.merchant_name}"`}
                          </button>
                        </div>
                      );
                    })}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
