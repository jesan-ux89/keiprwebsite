'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { planAPI } from '@/lib/api';
import { getPlanMonths } from '@/lib/payPeriods';
import { Plus, Loader } from 'lucide-react';

interface PlanBill {
  id: string;
  bill_id: string;
  plan_id: string;
  name: string;
  expected_amount: number;
  planned_amount: number;
  due_day: number;
}

interface Plan {
  id: string;
  year: number;
  month: number;
  bills: PlanBill[];
}

export default function PlanPage() {
  const { colors, isDark } = useTheme();
  const { bills, fmt } = useApp();
  const [months, setMonths] = useState<any[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    setMonths(getPlanMonths());
    setSelectedMonthIndex(0);
  }, []);

  useEffect(() => {
    if (months.length === 0) return;

    const loadPlan = async () => {
      setLoading(true);
      try {
        const selectedMonth = months[selectedMonthIndex];
        const res = await planAPI.get(selectedMonth.year, selectedMonth.month);
        setPlan(res.data?.plan || null);
      } catch (error) {
        console.error('Failed to load plan:', error);
        setPlan(null);
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [selectedMonthIndex, months]);

  const handleCreatePlan = async () => {
    if (months.length === 0) return;
    setLoading(true);
    try {
      const selectedMonth = months[selectedMonthIndex];
      const res = await planAPI.create({
        year: selectedMonth.year,
        month: selectedMonth.month,
      });
      setPlan(res.data?.plan || null);
    } catch (error) {
      console.error('Failed to create plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSnapshotBills = async () => {
    if (months.length === 0) return;
    setLoading(true);
    try {
      const selectedMonth = months[selectedMonthIndex];
      const res = await planAPI.snapshotBills(selectedMonth.year, selectedMonth.month);
      setPlan(res.data?.plan || null);
    } catch (error) {
      console.error('Failed to snapshot bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanBill = async (planBillId: string, newAmount: number) => {
    if (months.length === 0 || !plan) return;
    try {
      const selectedMonth = months[selectedMonthIndex];
      await planAPI.updatePlanBill(selectedMonth.year, selectedMonth.month, planBillId, {
        planned_amount: newAmount,
      });
      // Refresh plan
      const res = await planAPI.get(selectedMonth.year, selectedMonth.month);
      setPlan(res.data?.plan || null);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update plan bill:', error);
    }
  };

  const handleDeletePlanBill = async (planBillId: string) => {
    if (months.length === 0 || !plan) return;
    try {
      const selectedMonth = months[selectedMonthIndex];
      await planAPI.deletePlanBill(selectedMonth.year, selectedMonth.month, planBillId);
      // Refresh plan
      const res = await planAPI.get(selectedMonth.year, selectedMonth.month);
      setPlan(res.data?.plan || null);
    } catch (error) {
      console.error('Failed to delete plan bill:', error);
    }
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '900px',
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
    monthSelector: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      overflowX: 'auto' as const,
      paddingBottom: '4px',
    },
    monthButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
    },
    monthButtonActive: {
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
      borderColor: colors.midnight,
    },
    monthButtonHover: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}10`,
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      flexWrap: 'wrap' as const,
    },
    button: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      backgroundColor: colors.card,
      color: colors.text,
      border: `1px solid ${colors.inputBorder}`,
    },
    buttonHover: {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
    planTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '24px',
    },
    tableHead: {
      backgroundColor: colors.card,
      borderBottom: `1px solid ${colors.cardBorder}`,
    },
    tableHeaderCell: {
      padding: '12px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    tableHeaderCellRight: {
      textAlign: 'right' as const,
    },
    tableRow: {
      borderBottom: `1px solid ${colors.cardBorder}`,
      transition: 'background-color 0.2s ease',
    },
    tableRowHover: {
      backgroundColor: `${colors.electric}05`,
    },
    tableCell: {
      padding: '12px',
      fontSize: '13px',
      color: colors.text,
    },
    tableCellRight: {
      textAlign: 'right' as const,
    },
    amountInput: {
      width: '100px',
      padding: '6px 8px',
      borderRadius: '6px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontSize: '13px',
      fontFamily: 'inherit',
    },
    deleteButton: {
      padding: '4px 8px',
      fontSize: '12px',
      backgroundColor: colors.red,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    summary: {
      backgroundColor: colors.card,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.cardBorder}`,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px',
    },
    summaryItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    summaryLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    summaryValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: colors.text,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      color: colors.textMuted,
    },
    emptyStateTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.text,
      marginBottom: '8px',
    },
    emptyStateDescription: {
      fontSize: '13px',
      marginBottom: '20px',
    },
  };

  if (months.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Loader size={32} />
      </div>
    );
  }

  const selectedMonth = months[selectedMonthIndex];
  const hasPlan = plan !== null;

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <Loader size={32} />
      </div>
    );
  }

  const totalPlanned = plan?.bills.reduce((sum, b) => sum + (b.planned_amount || b.expected_amount), 0) || 0;
  const totalExpected = plan?.bills.reduce((sum, b) => sum + b.expected_amount, 0) || 0;
  const difference = totalPlanned - totalExpected;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Forward Planning</h1>
        <p style={styles.subtitle}>Plan and forecast your bills for upcoming months</p>
      </div>

      {/* Month Selector */}
      <div style={styles.monthSelector}>
        {months.map((month, idx) => (
          <button
            key={idx}
            style={{
              ...styles.monthButton,
              ...(selectedMonthIndex === idx ? styles.monthButtonActive : {}),
            }}
            onMouseEnter={(e) => {
              if (selectedMonthIndex !== idx) {
                Object.assign(e.currentTarget.style, styles.monthButtonHover);
              }
            }}
            onMouseLeave={(e) => {
              if (selectedMonthIndex !== idx) {
                Object.assign(e.currentTarget.style, styles.monthButton);
              }
            }}
            onClick={() => setSelectedMonthIndex(idx)}
          >
            {month.label}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      {!hasPlan ? (
        <div style={styles.actionButtons}>
          <button
            style={styles.button}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonHover })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.button)}
            onClick={handleCreatePlan}
          >
            <Plus size={16} /> Create Plan
          </button>
        </div>
      ) : (
        <div style={styles.actionButtons}>
          <button
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonSecondary, ...styles.buttonHover })}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonSecondary })}
            onClick={handleSnapshotBills}
          >
            <Plus size={16} /> Snapshot Bills
          </button>
        </div>
      )}

      {/* Plan Content */}
      {!hasPlan ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateTitle}>No plan for {selectedMonth.label}</div>
          <p style={styles.emptyStateDescription}>
            Create a plan to set expected bills and amounts for this month
          </p>
        </div>
      ) : (
        <>
          {plan.bills.length > 0 ? (
            <>
              {/* Bills Table */}
              <table style={styles.planTable}>
                <thead style={styles.tableHead}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Bill Name</th>
                    <th style={{ ...styles.tableHeaderCell, ...styles.tableHeaderCellRight }}>Due Day</th>
                    <th style={{ ...styles.tableHeaderCell, ...styles.tableHeaderCellRight }}>Expected</th>
                    <th style={{ ...styles.tableHeaderCell, ...styles.tableHeaderCellRight }}>Planned</th>
                    <th style={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.bills.map((planBill) => (
                    <tr
                      key={planBill.id}
                      style={styles.tableRow}
                      onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.tableRow, ...styles.tableRowHover })}
                      onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.tableRow)}
                    >
                      <td style={styles.tableCell}>{planBill.name}</td>
                      <td style={{ ...styles.tableCell, ...styles.tableCellRight }}>{planBill.due_day}</td>
                      <td style={{ ...styles.tableCell, ...styles.tableCellRight }}>{fmt(planBill.expected_amount)}</td>
                      <td style={{ ...styles.tableCell, ...styles.tableCellRight }}>
                        {editingId === planBill.id ? (
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            style={styles.amountInput}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingId(planBill.id);
                              setEditAmount(String(planBill.planned_amount || planBill.expected_amount));
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {fmt(planBill.planned_amount || planBill.expected_amount)}
                          </span>
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        {editingId === planBill.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              style={{ ...styles.deleteButton, backgroundColor: colors.green }}
                              onClick={() => handleUpdatePlanBill(planBill.id, parseFloat(editAmount))}
                            >
                              Save
                            </button>
                            <button
                              style={styles.deleteButton}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleDeletePlanBill(planBill.id)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Footer */}
              <div style={styles.summary}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Total Expected</div>
                  <div style={styles.summaryValue}>{fmt(totalExpected)}</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Total Planned</div>
                  <div style={styles.summaryValue}>{fmt(totalPlanned)}</div>
                </div>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>Difference</div>
                  <div style={{ ...styles.summaryValue, color: difference > 0 ? colors.amber : colors.green }}>
                    {difference > 0 ? '+' : ''}{fmt(difference)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateTitle}>No bills in this plan</div>
              <p style={styles.emptyStateDescription}>
                Click "Snapshot Bills" to copy your current bills into this plan
              </p>
              <button
                style={styles.button}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonHover })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.button)}
                onClick={handleSnapshotBills}
              >
                <Plus size={16} /> Snapshot Bills
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
