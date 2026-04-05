'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { paychecksAPI } from '@/lib/api';
import { getPayPeriods, isBillInPeriod, getCurrentPeriod } from '@/lib/payPeriods';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';

interface Paycheck {
  id: string;
  amount: number;
  frequency: string;
  next_pay_date: string;
  anchor_date: string;
}

export default function TrackerPage() {
  const { colors, isDark } = useTheme();
  const { bills, billPayments, incomeSources, isBillPaid, markBillPaid, unmarkBillPaid, fmt } = useApp();
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load paycheck data to get frequency and anchor date
  useEffect(() => {
    const loadPaychecks = async () => {
      try {
        const res = await paychecksAPI.getAll();
        const paycheckArray = Array.isArray(res.data?.paychecks) ? res.data.paychecks : [];
        setPaychecks(paycheckArray);

        // Generate periods from the first income source
        if (incomeSources.length > 0) {
          const source = incomeSources[0];
          const generatedPeriods = getPayPeriods(new Date().toISOString().split('T')[0], source.frequency);
          setPeriods(generatedPeriods);

          // Find current period
          const currentPeriod = generatedPeriods.find((p) => {
            const today = new Date();
            return today >= p.start && today <= p.end;
          });

          if (currentPeriod) {
            const index = generatedPeriods.indexOf(currentPeriod);
            setCurrentPeriodIndex(Math.max(0, index));
          }
        }
      } catch (error) {
        console.error('Failed to load paycheck data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (incomeSources.length > 0) {
      loadPaychecks();
    }
  }, [incomeSources]);

  if (loading || periods.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          color: colors.textMuted,
        }}
      >
        <Loader size={32} />
      </div>
    );
  }

  const period = periods[currentPeriodIndex];
  const billsInPeriod = bills.filter((b) => isBillInPeriod(b, period));

  const paidCount = billsInPeriod.reduce((count, bill) => {
    if (bill.isSplit) {
      const splits = [bill.p1done, bill.p2done, bill.p3done, bill.p4done].filter(Boolean).length;
      return count + splits;
    }
    return isBillPaid(bill.id, period.paycheckNum) ? count + 1 : count;
  }, 0);

  const totalCount = billsInPeriod.reduce((count, bill) => {
    if (bill.isSplit) {
      return count + [bill.p1, bill.p2, bill.p3, bill.p4].filter((x) => x > 0).length;
    }
    return count + 1;
  }, 0);

  const progressPercent = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  const handleBillToggle = async (billId: string) => {
    try {
      if (isBillPaid(billId, period.paycheckNum)) {
        const payment = billPayments.find((p) => p.billId === billId && p.paycheckNum === period.paycheckNum);
        if (payment) {
          await unmarkBillPaid(payment.id);
        }
      } else {
        await markBillPaid(billId, period.paycheckNum);
      }
    } catch (error) {
      console.error('Failed to toggle bill payment:', error);
    }
  };

  const handleSplitToggle = async (billId: string, splitNum: 1 | 2 | 3 | 4) => {
    // Split toggling would be handled here - for now we show a placeholder
    console.log('Toggle split:', billId, splitNum);
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: colors.text,
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '13px',
      color: colors.textMuted,
      marginBottom: '16px',
    },
    progressSection: {
      backgroundColor: colors.card,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      border: `1px solid ${colors.cardBorder}`,
    },
    progressLabel: {
      fontSize: '13px',
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: '8px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    progressText: {
      fontSize: '18px',
      fontWeight: '700',
      color: colors.text,
      marginBottom: '12px',
    },
    progressBarContainer: {
      height: '8px',
      backgroundColor: colors.progressTrack,
      borderRadius: '4px',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.green,
      transition: 'width 0.3s ease',
    },
    navigationSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      gap: '16px',
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.card,
      color: colors.text,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      padding: 0,
    },
    navButtonHover: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}10`,
    },
    periodDisplay: {
      flex: 1,
      textAlign: 'center' as const,
    },
    periodLabel: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.text,
      marginBottom: '4px',
    },
    periodDate: {
      fontSize: '12px',
      color: colors.textMuted,
    },
    billsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    billItem: {
      backgroundColor: colors.card,
      borderRadius: '12px',
      padding: '12px',
      border: `1px solid ${colors.cardBorder}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      transition: 'all 0.2s ease',
    },
    billItemHover: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}05`,
    },
    billCheckbox: {
      width: '20px',
      height: '20px',
      borderRadius: '6px',
      border: `2px solid ${colors.inputBorder}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px',
      transition: 'all 0.2s ease',
    },
    billCheckboxChecked: {
      backgroundColor: colors.green,
      borderColor: colors.green,
    },
    billCheckmark: {
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    billContent: {
      flex: 1,
      minWidth: 0,
    },
    billName: {
      fontSize: '14px',
      fontWeight: '600',
      color: colors.text,
      marginBottom: '4px',
    },
    billAmount: {
      fontSize: '12px',
      color: colors.textMuted,
    },
    splitsContainer: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
      flexWrap: 'wrap' as const,
    },
    splitBadge: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontSize: '11px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    splitBadgeActive: {
      backgroundColor: colors.green,
      borderColor: colors.green,
      color: '#FFFFFF',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: colors.textMuted,
    },
    emptyStateTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.text,
      marginBottom: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Payment Tracker</h1>
        <p style={styles.subtitle}>Track which bills you've paid this paycheck period</p>
      </div>

      {/* Progress */}
      <div style={styles.progressSection}>
        <div style={styles.progressLabel}>Overall Progress</div>
        <div style={styles.progressText}>
          {paidCount} of {totalCount} bills paid
        </div>
        <div style={styles.progressBarContainer}>
          <div style={{ ...styles.progressBar, width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Navigation */}
      <div style={styles.navigationSection}>
        <button
          style={styles.navButton}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.navButtonHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...styles.navButton })}
          onClick={() => setCurrentPeriodIndex(Math.max(0, currentPeriodIndex - 1))}
          disabled={currentPeriodIndex === 0}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={styles.periodDisplay}>
          <div style={styles.periodLabel}>{period.label}</div>
          <div style={styles.periodDate}>
            {period.start.toLocaleDateString()} - {period.end.toLocaleDateString()}
          </div>
        </div>

        <button
          style={styles.navButton}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.navButtonHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...styles.navButton })}
          onClick={() => setCurrentPeriodIndex(Math.min(periods.length - 1, currentPeriodIndex + 1))}
          disabled={currentPeriodIndex === periods.length - 1}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bills List */}
      {billsInPeriod.length > 0 ? (
        <div style={styles.billsList}>
          {billsInPeriod.map((bill) => {
            const isPaid = isBillPaid(bill.id, period.paycheckNum);

            return (
              <div
                key={bill.id}
                style={styles.billItem}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.billItem, ...styles.billItemHover })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.billItem)}
              >
                {!bill.isSplit ? (
                  <>
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={() => handleBillToggle(bill.id)}
                      style={{
                        ...styles.billCheckbox,
                        ...(isPaid ? styles.billCheckboxChecked : {}),
                      }}
                    />
                    <div style={styles.billContent}>
                      <div style={styles.billName}>{bill.name}</div>
                      <div style={styles.billAmount}>
                        {bill.total ? fmt(bill.total) : 'No amount'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={styles.billName}>{bill.name} (Split)</div>
                      <div style={styles.splitsContainer}>
                        {bill.p1 > 0 && (
                          <button
                            style={{
                              ...styles.splitBadge,
                              ...(bill.p1done ? styles.splitBadgeActive : {}),
                            }}
                            onClick={() => handleSplitToggle(bill.id, 1)}
                          >
                            P1
                          </button>
                        )}
                        {bill.p2 > 0 && (
                          <button
                            style={{
                              ...styles.splitBadge,
                              ...(bill.p2done ? styles.splitBadgeActive : {}),
                            }}
                            onClick={() => handleSplitToggle(bill.id, 2)}
                          >
                            P2
                          </button>
                        )}
                        {bill.p3 > 0 && (
                          <button
                            style={{
                              ...styles.splitBadge,
                              ...(bill.p3done ? styles.splitBadgeActive : {}),
                            }}
                            onClick={() => handleSplitToggle(bill.id, 3)}
                          >
                            P3
                          </button>
                        )}
                        {bill.p4 > 0 && (
                          <button
                            style={{
                              ...styles.splitBadge,
                              ...(bill.p4done ? styles.splitBadgeActive : {}),
                            }}
                            onClick={() => handleSplitToggle(bill.id, 4)}
                          >
                            P4
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateTitle}>No bills this period</div>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            No bills are due during {period.label}
          </p>
        </div>
      )}
    </div>
  );
}
