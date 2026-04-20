'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { planAPI } from '@/lib/api';
import { getPlanMonths } from '@/lib/payPeriods';
import { Plus, X, ChevronDown } from 'lucide-react';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import AppLayout from '@/components/layout/AppLayout';

interface PlanBill {
  id: string;
  source_bill_id: string | null;
  name: string;
  category: string;
  due_day: number;
  amount: number;
  is_split: boolean;
  p1: number;
  p2: number;
  is_recurring: boolean;
  is_auto_pay: boolean;
  is_removed: boolean;
}

interface ProjectionMonth {
  year: number;
  month: number;
  label: string;
  projectedIncome: number;
  projectedBills: number;
  projectedRemaining: number;
  projectedRollover: number;
  billsEndingThisMonth: { billId: string; name: string; amount: number }[];
  isTight: boolean;
  isSurplus: boolean;
}

export default function PlanPage() {
  const { colors, isDark } = useTheme();
  const { fmt, isPro, categories = [], incomeSources = [] } = useApp();
  const dangerColor = isDark ? '#F08070' : '#A32D2D';
  const dangerBg = isDark ? 'rgba(240,128,112,0.12)' : 'rgba(163,45,45,0.1)';
  const MONTH_COLORS = ['#0E7490', '#7C3AED', '#B45309', '#0F766E', '#BE185D', '#1D4ED8'];

  // Multi-month projection (Pro+)
  const [projection, setProjection] = useState<ProjectionMonth[]>([]);
  const [projectionHorizon, setProjectionHorizon] = useState<6 | 12>(6);
  const [projectionLoading, setProjectionLoading] = useState(false);

  // Current month label for the locked pill
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [months, setMonths] = useState<any[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [planBills, setPlanBills] = useState<PlanBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Add bill form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addDueDay, setAddDueDay] = useState('');
  const [addCategory, setAddCategory] = useState('Other');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  // Confirmation state for remove
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    setMonths(getPlanMonths(isPro));
    setSelectedMonthIndex(0);
  }, [isPro]);

  // Fetch multi-month projection (Pro only)
  useEffect(() => {
    if (!isPro) return;
    let cancelled = false;
    setProjectionLoading(true);
    planAPI.getProjection(projectionHorizon)
      .then((res: any) => {
        if (!cancelled) setProjection(res.data?.projection || []);
      })
      .catch(() => { if (!cancelled) setProjection([]); })
      .finally(() => { if (!cancelled) setProjectionLoading(false); });
    return () => { cancelled = true; };
  }, [isPro, projectionHorizon]);

  const loadPlanBills = useCallback(async () => {
    if (months.length === 0) return;
    setLoading(true);
    try {
      const selectedMonth = months[selectedMonthIndex];
      const res = await planAPI.getBills(selectedMonth.year, selectedMonth.month);
      const bills = res.data?.planBills || [];

      if (bills.length === 0) {
        // No snapshot yet — create one
        const snapRes = await planAPI.snapshotBills(selectedMonth.year, selectedMonth.month);
        setPlanBills(snapRes.data?.planBills || []);
      } else {
        setPlanBills(bills);
      }
    } catch (error) {
      console.error('Failed to load plan bills:', error);
      setPlanBills([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthIndex, months]);

  useEffect(() => {
    loadPlanBills();
  }, [loadPlanBills]);

  const selectedMonth = months[selectedMonthIndex] || { label: '', year: 0, month: 0 };
  const activeBills = planBills.filter(b => !b.is_removed);
  const totalBillsAmt = activeBills.reduce((s, b) => s + b.amount, 0);

  const primaryIncome = incomeSources.find((s: any) => s.isPrimary) || (incomeSources.length > 0 ? incomeSources[0] : null);
  const perPaycheck = primaryIncome ? primaryIncome.typicalAmount : 0;

  // Save edit
  const handleSaveEdit = async (bill: PlanBill) => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    setPlanBills(prev => prev.map(b => b.id === bill.id ? { ...b, amount: newAmount } : b));
    setEditingId(null);
    try {
      await planAPI.updatePlanBill(selectedMonth.year, selectedMonth.month, bill.id, { amount: newAmount });
    } catch (err) {
      console.error('Failed to update plan bill:', err);
    }
  };

  // Remove bill
  const handleRemove = async (bill: PlanBill) => {
    setPlanBills(prev => prev.map(b => b.id === bill.id ? { ...b, is_removed: true } : b));
    setConfirmingRemoveId(null);
    try {
      if (bill.source_bill_id) {
        await planAPI.updatePlanBill(selectedMonth.year, selectedMonth.month, bill.id, { is_removed: true });
      } else {
        await planAPI.deletePlanBill(selectedMonth.year, selectedMonth.month, bill.id);
        setPlanBills(prev => prev.filter(b => b.id !== bill.id));
      }
    } catch (err) {
      console.error('Failed to remove plan bill:', err);
    }
  };

  // Add bill
  const handleAddBill = async () => {
    setAddError(null);
    const name = addName.trim();
    const amount = parseFloat(addAmount);
    const dueDay = parseInt(addDueDay) || 1;

    if (!name) { setAddError('Bill name is required.'); return; }
    if (isNaN(amount) || amount <= 0) { setAddError('Enter a valid amount.'); return; }
    if (dueDay < 1 || dueDay > 31) { setAddError('Due day must be between 1 and 31.'); return; }

    setAddSaving(true);
    try {
      const res = await planAPI.addPlanBill(selectedMonth.year, selectedMonth.month, {
        name,
        amount,
        dueDay,
        category: addCategory || 'Other',
        isRecurring: true,
      });
      const newBill = res.data?.planBill;
      if (newBill) {
        setPlanBills(prev => [...prev, newBill]);
      }
      setAddName('');
      setAddAmount('');
      setAddDueDay('');
      setAddCategory('Other');
      setShowAddForm(false);
      setActionStatus({ type: 'success', message: `"${name}" added to ${selectedMonth.label} plan.` });
    } catch (err) {
      setAddError('Failed to add bill. Please try again.');
    } finally {
      setAddSaving(false);
    }
  };

  // Reset snapshot
  const handleResetSnapshot = async () => {
    setLoading(true);
    try {
      const res = await planAPI.snapshotBills(selectedMonth.year, selectedMonth.month);
      setPlanBills(res.data?.planBills || []);
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setLoading(false);
    }
  };

  const suffix = (d: number) => d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th';

  const categoryOptions = (categories || []).length > 0
    ? (categories || []).map((c: any) => c.name)
    : ['Housing', 'Utilities', 'Insurance', 'Transport', 'Food', 'Health', 'Other'];

  if (months.length === 0 || loading) {
    return (
      <AppLayout pageTitle="Plan">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <CardSkeleton rows={6} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Plan">
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Month Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
        {/* Locked current month */}
        <div
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${colors.midnight}`,
            backgroundColor: colors.midnight,
            color: '#ffffff80',
            fontSize: '13px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'not-allowed',
          }}
        >
          🔒 {currentMonthLabel}
        </div>

        {/* Future months with unique colors */}
        {months.map((month, idx) => {
          const mc = MONTH_COLORS[idx % MONTH_COLORS.length];
          const isSelected = selectedMonthIndex === idx;
          return (
            <button
              key={idx}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? mc : colors.inputBorder}`,
                backgroundColor: isSelected ? mc : colors.card,
                color: isSelected ? '#FFFFFF' : colors.text,
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onClick={() => setSelectedMonthIndex(idx)}
            >
              <span style={{
                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: isSelected ? '#fff' : mc,
              }} />
              {month.label}
            </button>
          );
        })}
      </div>

      {/* Action Status Banner */}
      {actionStatus && (
        <div style={{
          backgroundColor: actionStatus.type === 'error' ? 'rgba(163,45,45,0.1)' : 'rgba(10,123,108,0.1)',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '13px', color: actionStatus.type === 'error' ? dangerColor : '#0A7B6C' }}>
            {actionStatus.message}
          </span>
          <button
            onClick={() => setActionStatus(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Projection (Pro+) — multi-month rollover-compounded forecast */}
      {isPro && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Projection
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {([6, 12] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setProjectionHorizon(h)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: `1px solid ${projectionHorizon === h ? colors.electric : colors.inputBorder}`,
                    backgroundColor: projectionHorizon === h ? `${colors.electric}15` : 'transparent',
                    color: projectionHorizon === h ? colors.electric : colors.textSub,
                    cursor: 'pointer',
                  }}
                >
                  {h}mo
                </button>
              ))}
            </div>
          </div>

          {projectionLoading && projection.length === 0 ? (
            <div style={{ fontSize: '12px', color: colors.textMuted, padding: '10px 0' }}>Loading projection…</div>
          ) : projection.length === 0 ? (
            <div style={{ fontSize: '12px', color: colors.textMuted, padding: '10px 0' }}>
              Add bills and an income source to see your projected cash flow.
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}>
                {projection.map(m => {
                  const accent = m.isTight ? dangerColor : m.isSurplus ? '#0A7B6C' : colors.electric;
                  return (
                    <div
                      key={`${m.year}-${m.month}`}
                      style={{
                        flex: '0 0 168px',
                        backgroundColor: colors.card,
                        borderRadius: '10px',
                        padding: '14px',
                        border: `1px solid ${colors.cardBorder}`,
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSub, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: accent, marginTop: '6px' }}>
                        {fmt(m.projectedRollover)}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                        projected rollover
                      </div>
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: `1px solid ${colors.cardBorder}` }}>
                        <div style={{ fontSize: '10px', color: colors.textSub }}>In: {fmt(m.projectedIncome)}</div>
                        <div style={{ fontSize: '10px', color: colors.textSub }}>Bills: {fmt(m.projectedBills)}</div>
                      </div>
                      {m.billsEndingThisMonth.length > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: `1px solid ${colors.cardBorder}` }}>
                          <div style={{ fontSize: '9px', color: '#0A7B6C', fontWeight: 700 }}>ENDS THIS MONTH</div>
                          {m.billsEndingThisMonth.slice(0, 2).map(b => (
                            <div key={b.billId} style={{ fontSize: '10px', color: colors.text, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.name} · {fmt(b.amount)}
                            </div>
                          ))}
                          {m.billsEndingThisMonth.length > 2 && (
                            <div style={{ fontSize: '9px', color: colors.textMuted, marginTop: '2px' }}>
                              +{m.billsEndingThisMonth.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      {m.isTight && (
                        <div style={{ fontSize: '9px', color: dangerColor, marginTop: '6px', fontWeight: 600 }}>⚠ Tight month</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(() => {
                const ending = projection.flatMap(m =>
                  m.billsEndingThisMonth.map(b => ({ ...b, label: m.label }))
                );
                if (ending.length === 0) return null;
                return (
                  <div style={{
                    marginTop: '12px',
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(10,123,108,0.08)',
                    border: '1px solid rgba(10,123,108,0.2)',
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0A7B6C', marginBottom: '6px' }}>
                      Bills ending soon
                    </div>
                    {ending.slice(0, 4).map((b, i) => (
                      <div key={`${b.billId}-${i}`} style={{ fontSize: '12px', color: colors.text, marginTop: '3px' }}>
                        {b.name} ends {b.label} — {fmt(b.amount)}/mo frees up
                      </div>
                    ))}
                    {ending.length > 4 && (
                      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                        +{ending.length - 4} more over the next {projectionHorizon} months
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Summary Card */}
      <div style={{
        backgroundColor: colors.card,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${colors.cardBorder}`,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bills</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>{activeBills.length}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Planned</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>{fmt(totalBillsAmt)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Per Paycheck</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>{fmt(perPaycheck)}</div>
        </div>
      </div>

      {/* Bills Table */}
      {activeBills.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bill Name</th>
              <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Day</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeBills.sort((a, b) => (a.due_day || 1) - (b.due_day || 1)).map((bill) => (
              <tr key={bill.id} style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                <td style={{ padding: '12px', fontSize: '13px', color: colors.text }}>
                  {bill.name}
                  {!bill.source_bill_id && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: '600', color: colors.electric, backgroundColor: `${colors.electric}15`, padding: '2px 6px', borderRadius: '4px' }}>NEW</span>
                  )}
                  {bill.is_split && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: '600', color: colors.electric, backgroundColor: `${colors.electric}15`, padding: '2px 6px', borderRadius: '4px' }}>SPLIT</span>
                  )}
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: colors.textSub }}>{bill.category}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: colors.textSub, textAlign: 'right' }}>{bill.due_day}{suffix(bill.due_day)}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: colors.text, textAlign: 'right' }}>
                  {editingId === bill.id ? (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        style={{
                          width: '100px', padding: '6px 8px', borderRadius: '6px',
                          border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                          color: colors.text, fontSize: '13px', fontFamily: 'inherit',
                        }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(bill); if (e.key === 'Escape') setEditingId(null); }}
                      />
                      <button
                        onClick={() => handleSaveEdit(bill)}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: colors.green, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: colors.card, color: colors.textSub, border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => { setEditingId(bill.id); setEditAmount(String(bill.amount)); }}
                      style={{ cursor: 'pointer' }}
                      title="Click to edit amount"
                    >
                      {fmt(bill.amount)}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {confirmingRemoveId === bill.id ? (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmingRemoveId(null)}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: colors.card, color: colors.textSub, border: `1px solid ${colors.inputBorder}`, borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRemove(bill)}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: dangerBg, color: dangerColor, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingRemoveId(bill.id)}
                      style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: dangerBg, color: dangerColor, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted, marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>No bills in this plan</div>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Add bills or reset to pull in your current bills.</p>
        </div>
      )}

      {/* Add Bill Section */}
      {showAddForm ? (
        <div style={{
          backgroundColor: colors.card,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.electric}30`,
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
            Add a bill to {selectedMonth.label}
          </div>

          {addError && (
            <div style={{
              backgroundColor: 'rgba(163,45,45,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: dangerColor }}>{addError}</span>
              <button onClick={() => setAddError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>✕</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Bill Name</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Car Insurance"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                  color: colors.text, fontSize: '13px', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Amount</label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                  color: colors.text, fontSize: '13px', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Due Day</label>
              <input
                type="number"
                value={addDueDay}
                onChange={(e) => setAddDueDay(e.target.value)}
                placeholder="1–31"
                min={1}
                max={31}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: `1px solid ${colors.inputBorder}`, backgroundColor: colors.inputBg,
                  color: colors.text, fontSize: '13px', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Category chips */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Category</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {categoryOptions.map(cat => (
                <button
                  key={cat}
                  onClick={() => setAddCategory(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: '16px', fontSize: '12px', cursor: 'pointer',
                    fontWeight: addCategory === cat ? '600' : '400',
                    backgroundColor: addCategory === cat ? colors.midnight : colors.inputBg,
                    color: addCategory === cat ? '#fff' : colors.textSub,
                    border: `1px solid ${addCategory === cat ? colors.midnight : colors.inputBorder}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddBill}
              disabled={addSaving}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: 'none',
                backgroundColor: colors.midnight, color: '#fff',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                opacity: addSaving ? 0.6 : 1,
              }}
            >
              {addSaving ? 'Adding...' : 'Add bill'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddError(null); }}
              style={{
                padding: '10px 20px', borderRadius: '8px',
                border: `1px solid ${colors.inputBorder}`,
                backgroundColor: colors.card, color: colors.textSub,
                fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '14px', borderRadius: '12px', cursor: 'pointer',
            backgroundColor: `${colors.electric}08`, border: `1px solid ${colors.electric}25`,
            color: colors.electric, fontSize: '14px', fontWeight: '500',
            marginBottom: '16px',
          }}
        >
          <Plus size={18} /> Add a bill to this month
        </button>
      )}

      {/* Reset Button */}
      <button
        onClick={handleResetSnapshot}
        style={{
          display: 'block', width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer',
          border: `1px solid ${isDark ? 'rgba(240,128,112,0.3)' : 'rgba(163,45,45,0.3)'}`, backgroundColor: dangerBg,
          color: dangerColor, fontSize: '13px', fontWeight: '500', marginBottom: '8px',
        }}
      >
        Reset to current bills
      </button>

      <p style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center', marginTop: '8px' }}>
        Click an amount to edit · Click Remove to take a bill out · Click + to add
      </p>

      {/* Pro Nudge Tip */}
      {isPro && months.length >= 5 && (
        <div style={{
          marginTop: '32px', padding: '16px', borderRadius: '8px',
          backgroundColor: `${colors.electric}10`, border: `1px solid ${colors.electric}30`,
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: '18px', marginTop: '2px' }}>💡</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
              Pro feature: Plan further ahead
            </div>
            <div style={{ fontSize: '12px', color: colors.textMuted, lineHeight: '1.4' }}>
              As a Pro subscriber, you can plan 7 months in advance instead of just 4. Use these extra months to prepare for major expenses or seasonal changes.
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
