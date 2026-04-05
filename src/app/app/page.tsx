'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { paychecksAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

type ViewMode = 'paycheck' | 'cycles' | 'monthly';

interface PaycheckData {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  frequency: string;
}

export default function DashboardPage() {
  const { colors } = useTheme();
  const { bills, billsLoading, refreshBills, incomeSources, fmt, isBillPaid, markBillPaid } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('paycheck');
  const [currentPaycheck, setCurrentPaycheck] = useState<PaycheckData | null>(null);
  const [paycheckLoading, setPaycheckLoading] = useState(false);
  const [currentPaycheckBills, setCurrentPaycheckBills] = useState<typeof bills>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current paycheck
  useEffect(() => {
    const fetchCurrentPaycheck = async () => {
      setPaycheckLoading(true);
      try {
        const res = await paychecksAPI.getCurrent();
        setCurrentPaycheck(res.data?.paycheck || null);
      } catch (error) {
        console.error('Failed to fetch current paycheck:', error);
      } finally {
        setPaycheckLoading(false);
      }
    };

    fetchCurrentPaycheck();
  }, []);

  // Filter bills for current paycheck
  useEffect(() => {
    if (!currentPaycheck || !bills.length) {
      setCurrentPaycheckBills([]);
      return;
    }

    const start = new Date(currentPaycheck.startDate);
    const end = new Date(currentPaycheck.endDate);

    const filtered = bills.filter((bill) => {
      const billDueDate = new Date();
      billDueDate.setDate(bill.dueDay);

      if (bill.isSplit) {
        return true; // Split bills appear in every paycheck
      }

      return billDueDate >= start && billDueDate <= end;
    });

    setCurrentPaycheckBills(filtered);
  }, [currentPaycheck, bills]);

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshBills();
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate monthly income based on pay frequency (matches mobile app logic)
  const getMonthlyIncome = (source: { amount: number; frequency: string }) => {
    switch (source.frequency) {
      case 'weekly': return source.amount * 4;
      case 'biweekly': return source.amount * 2;
      case 'twicemonthly': return source.amount * 2;
      case 'monthly': return source.amount;
      default: return source.amount;
    }
  };

  // Calculate totals
  const totalIncome = incomeSources.reduce((sum, source) => sum + getMonthlyIncome(source), 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.total, 0);
  const remaining = totalIncome - totalBills;
  const billsPaid = bills.filter((bill) => {
    // For simplicity, check if all splits are paid or bill is fully funded
    if (bill.isSplit) {
      return bill.p1done && bill.p2done && bill.p3done && bill.p4done;
    }
    return bill.funded >= bill.total;
  }).length;

  // Calculate progress for current paycheck
  const currentPaycheckTotal = currentPaycheckBills.reduce((sum, bill) => sum + bill.total, 0);
  const currentPaycheckIncome = currentPaycheck ? currentPaycheck.amount : 0;
  const progressPercent = currentPaycheckTotal > 0 ? (currentPaycheckIncome / currentPaycheckTotal) * 100 : 0;

  // Group bills by category
  const billsByCategory = bills.reduce(
    (acc, bill) => {
      if (!acc[bill.category]) {
        acc[bill.category] = [];
      }
      acc[bill.category].push(bill);
      return acc;
    },
    {} as Record<string, typeof bills>
  );

  // Calculate monthly bills
  const monthlyTotal = bills.reduce((sum, bill) => {
    if (bill.isRecurring) {
      return sum + bill.total;
    }
    return sum;
  }, 0);

  const isLoading = billsLoading || paycheckLoading;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.text,
              margin: 0,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              color: colors.textMuted,
              margin: '0.5rem 0 0 0',
              fontSize: '0.95rem',
            }}
          >
            Overview of your finances
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <RefreshCw size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.textMuted,
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Total Income
              </p>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: colors.green,
                  margin: 0,
                }}
              >
                {fmt(totalIncome)}
              </p>
            </div>
            <TrendingUp size={24} style={{ color: colors.green, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.textMuted,
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Total Bills
              </p>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: colors.amber,
                  margin: 0,
                }}
              >
                {fmt(totalBills)}
              </p>
            </div>
            <Receipt size={24} style={{ color: colors.amber, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.textMuted,
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Remaining
              </p>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: remaining >= 0 ? colors.green : colors.red,
                  margin: 0,
                }}
              >
                {fmt(remaining)}
              </p>
            </div>
            <CheckCircle2 size={24} style={{ color: remaining >= 0 ? colors.green : colors.red, opacity: 0.7 }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: colors.textMuted,
                  margin: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Bills Paid
              </p>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: colors.electric,
                  margin: 0,
                }}
              >
                {billsPaid}/{bills.length}
              </p>
            </div>
            <CheckCircle2 size={24} style={{ color: colors.electric, opacity: 0.7 }} />
          </div>
        </Card>
      </div>

      {/* View Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: `1px solid ${colors.divider}`,
        }}
      >
        {(['paycheck', 'cycles', 'monthly'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '1rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: viewMode === mode ? 600 : 500,
              color: viewMode === mode ? colors.electric : colors.textMuted,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: viewMode === mode ? `2px solid ${colors.electric}` : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {mode === 'paycheck' ? 'Paycheck' : mode === 'cycles' ? 'Bill Cycles' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {isLoading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading...</p>
        </Card>
      ) : viewMode === 'paycheck' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Current Paycheck Section */}
          {currentPaycheck && (
            <Card>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 0.5rem 0',
                  }}
                >
                  Current Paycheck
                </h2>
                <p
                  style={{
                    color: colors.textMuted,
                    fontSize: '0.875rem',
                    margin: 0,
                  }}
                >
                  {new Date(currentPaycheck.startDate).toLocaleDateString()} -{' '}
                  {new Date(currentPaycheck.endDate).toLocaleDateString()}
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                    Income
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.green, margin: 0 }}>
                    {fmt(currentPaycheckIncome)}
                  </p>
                </div>
                <div>
                  <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                    Due This Period
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.amber, margin: 0 }}>
                    {fmt(currentPaycheckTotal)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Progress</span>
                  <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: colors.progressTrack,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(progressPercent, 100)}%`,
                      backgroundColor: colors.electric,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Bills in this paycheck */}
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 1rem 0',
                  }}
                >
                  Bills Due This Period ({currentPaycheckBills.length})
                </h3>

                {currentPaycheckBills.length === 0 ? (
                  <p
                    style={{
                      color: colors.textMuted,
                      fontSize: '0.95rem',
                      margin: 0,
                    }}
                  >
                    No bills due this paycheck
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentPaycheckBills.map((bill) => {
                      const isPaid = bill.isSplit
                        ? bill.p1done && bill.p2done && bill.p3done && bill.p4done
                        : bill.funded >= bill.total;

                      return (
                        <div
                          key={bill.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            backgroundColor: colors.background,
                            borderRadius: '0.5rem',
                            borderLeft: `4px solid ${isPaid ? colors.green : colors.amber}`,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                color: colors.text,
                                margin: 0,
                              }}
                            >
                              {bill.name}
                            </p>
                            <p
                              style={{
                                fontSize: '0.875rem',
                                color: colors.textMuted,
                                margin: '0.25rem 0 0 0',
                              }}
                            >
                              {bill.category}
                              {bill.isSplit && ' • Split'}
                              {bill.isAutoPay && ' • AutoPay'}
                            </p>
                          </div>
                          <div
                            style={{
                              textAlign: 'right',
                              marginRight: '1rem',
                            }}
                          >
                            <p
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: colors.text,
                                margin: 0,
                              }}
                            >
                              {fmt(bill.total)}
                            </p>
                            <p
                              style={{
                                fontSize: '0.875rem',
                                color: isPaid ? colors.green : colors.textMuted,
                                margin: '0.25rem 0 0 0',
                              }}
                            >
                              {isPaid ? 'Paid' : `Due day ${bill.dueDay}`}
                            </p>
                          </div>
                          {!isPaid && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => markBillPaid(bill.id, 1)}
                              style={{
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      ) : viewMode === 'cycles' ? (
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: colors.text,
              margin: '0 0 1.5rem 0',
            }}
          >
            Bills by Cycle
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(billsByCategory).map(([category, categoryBills]) => (
              <Card key={category}>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 1rem 0',
                  }}
                >
                  {category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {categoryBills.map((bill) => (
                    <div
                      key={bill.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: colors.background,
                        borderRadius: '0.375rem',
                      }}
                    >
                      <span style={{ color: colors.text, fontWeight: 500 }}>{bill.name}</span>
                      <span style={{ color: colors.text, fontWeight: 600 }}>{fmt(bill.total)}</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${colors.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: colors.textMuted, fontWeight: 500 }}>Total</span>
                  <span style={{ color: colors.text, fontWeight: 700 }}>
                    {fmt(categoryBills.reduce((sum, b) => sum + b.total, 0))}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: colors.text,
                margin: '0 0 1rem 0',
              }}
            >
              Monthly Summary
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem',
              }}
            >
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  Monthly Bills
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.amber, margin: 0 }}>
                  {fmt(monthlyTotal)}
                </p>
              </div>
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  Total Income
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: 700, color: colors.green, margin: 0 }}>
                  {fmt(totalIncome)}
                </p>
              </div>
              <div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  Surplus
                </p>
                <p
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: totalIncome - monthlyTotal >= 0 ? colors.green : colors.red,
                    margin: 0,
                  }}
                >
                  {fmt(totalIncome - monthlyTotal)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
