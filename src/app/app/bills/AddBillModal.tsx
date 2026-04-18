'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { spendingAPI } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import CategoryIcon from '@/components/CategoryIcon';

const CATEGORIES = [
  'Dining',
  'Fun',
  'Groceries',
  'Healthcare',
  'Housing',
  'Insurance',
  'Other',
  'Savings',
  'Subscriptions',
  'Transport',
  'Utilities',
];

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  billToEdit?: {
    id: string;
    name: string;
    category: string;
    dueDay: number;
    total: number;
    isRecurring: boolean;
    isAutoPay: boolean;
    isSplit: boolean;
    p1?: number;
    p2?: number;
    p3?: number;
    p4?: number;
    paidWith?: string | null;
  };
  initialType?: 'bill' | 'budget';
}

export default function AddBillModal({ isOpen, onClose, billToEdit, initialType }: AddBillModalProps) {
  const { colors, isDark } = useTheme();
  const { addBill, updateBill, fmt, canSplit, isUltra, spendingBudgets, fetchSpendingBudgets, categories: dbCategories, creditCards, plaidCards, bills } = useApp();

  const categoryNames = Array.from(new Set([
    ...(dbCategories.length > 0 ? dbCategories.map(c => c.name) : []),
    ...CATEGORIES,
  ])).sort((a, b) => a.localeCompare(b));

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Type selector state
  const [expenseType, setExpenseType] = useState<'bill' | 'budget'>(initialType || 'bill');

  // ── Fixed Bill state ──
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [dueDay, setDueDay] = useState(1);
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [isAutoPay, setIsAutoPay] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [paidWith, setPaidWith] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [p4, setP4] = useState('');

  // ── Spending Target state ──
  const [targetCategory, setTargetCategory] = useState('Groceries');
  const [targetAmount, setTargetAmount] = useState('');

  // Categories that already have budgets
  const existingBudgetCategories = new Set((spendingBudgets || []).map((b: any) => b.category));

  // Initialize/reset form
  useEffect(() => {
    if (billToEdit) {
      setExpenseType('bill');
      setName(billToEdit.name);
      setCategory(billToEdit.category);
      setDueDay(billToEdit.dueDay);
      setAmount(billToEdit.total.toString());
      setIsRecurring(billToEdit.isRecurring);
      setIsAutoPay(billToEdit.isAutoPay);
      setIsSplit(billToEdit.isSplit);
      setPaidWith(billToEdit.paidWith || '');
      if (billToEdit.isSplit) {
        setP1(billToEdit.p1?.toString() || '');
        setP2(billToEdit.p2?.toString() || '');
        setP3(billToEdit.p3?.toString() || '');
        setP4(billToEdit.p4?.toString() || '');
      }
    } else {
      setExpenseType(initialType || 'bill');
      setName('');
      setCategory('Utilities');
      setDueDay(1);
      setAmount('');
      setIsRecurring(true);
      setIsAutoPay(false);
      setIsSplit(false);
      setPaidWith('');
      setP1('');
      setP2('');
      setP3('');
      setP4('');
      setTargetCategory('Groceries');
      setTargetAmount('');
    }
    setErrors({});
  }, [isOpen, billToEdit, initialType]);

  // ── Validation ──
  const validateBillForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Bill name is required';
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (dueDay < 1 || dueDay > 31) newErrors.dueDay = 'Due day must be between 1 and 31';
    if (isSplit) {
      const p1Num = parseFloat(p1) || 0;
      const p2Num = parseFloat(p2) || 0;
      const p3Num = parseFloat(p3) || 0;
      const p4Num = parseFloat(p4) || 0;
      const totalSplit = p1Num + p2Num + p3Num + p4Num;
      if (totalSplit !== amountNum) newErrors.splits = `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${amountNum.toFixed(2)})`;
      if (p1Num < 0 || p2Num < 0 || p3Num < 0 || p4Num < 0) newErrors.splits = 'All split amounts must be non-negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBudgetForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amt = parseFloat(targetAmount);
    if (!targetAmount || amt <= 0) newErrors.targetAmount = 'Target amount must be greater than 0';
    if (existingBudgetCategories.has(targetCategory)) newErrors.targetCategory = 'This category already has a spending target';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit handlers ──
  const handleBillSubmit = async () => {
    if (!validateBillForm()) return;
    setLoading(true);
    try {
      const billData = {
        name: name.trim(),
        category,
        dueDay: parseInt(dueDay.toString()),
        total: parseFloat(amount),
        isRecurring,
        isAutoPay,
        isSplit,
        paidWith: paidWith || null,
      };
      if (isSplit) {
        Object.assign(billData, {
          p1: parseFloat(p1) || 0,
          p2: parseFloat(p2) || 0,
          p3: parseFloat(p3) || 0,
          p4: parseFloat(p4) || 0,
        });
      }
      if (billToEdit) {
        await updateBill(billToEdit.id, billData);
      } else {
        await addBill(billData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save bill:', error);
      setErrors({ submit: 'Failed to save bill. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSubmit = async () => {
    if (!validateBudgetForm()) return;
    setLoading(true);
    try {
      await spendingAPI.createBudget({
        category: targetCategory,
        budgetAmount: parseFloat(targetAmount),
      });
      await fetchSpendingBudgets();
      onClose();
    } catch (error: any) {
      console.error('Failed to create spending target:', error);
      setErrors({ submit: error?.response?.data?.error || 'Failed to create spending target. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseType === 'budget') {
      handleBudgetSubmit();
    } else {
      handleBillSubmit();
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const amountNum = parseFloat(amount) || 0;
  const splitTotal = (parseFloat(p1) || 0) + (parseFloat(p2) || 0) + (parseFloat(p3) || 0) + (parseFloat(p4) || 0);
  const splitRemaining = amountNum - splitTotal;

  const modalTitle = billToEdit ? 'Edit Bill' : 'Add Expense';

  return (
    <Modal
      title={modalTitle}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Type Selector (only when adding new, not editing) ── */}
        {!billToEdit && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              onClick={() => setExpenseType('bill')}
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: `2px solid ${expenseType === 'bill' ? '#38BDF8' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                backgroundColor: expenseType === 'bill' ? (isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.04)') : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>📋</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>Fixed Bill</div>
              <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '0.25rem', lineHeight: 1.4 }}>
                Rent, insurance, Netflix...<br />Same amount each time
              </div>
            </div>
            <div
              onClick={() => setExpenseType('budget')}
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: `2px solid ${expenseType === 'budget' ? '#38BDF8' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                backgroundColor: expenseType === 'budget' ? (isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.04)') : 'transparent',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>📊</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>Spending Target</div>
              <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '0.25rem', lineHeight: 1.4 }}>
                Groceries, gas, dining...<br />Budget a target amount
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            FIXED BILL FORM
           ══════════════════════════════════════════════════════ */}
        {(expenseType === 'bill' || billToEdit) && (
          <>
            {/* Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Expense Name"
                type="text"
                placeholder="e.g., Electricity, Netflix"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <div>
                <label style={{
                  display: 'block', marginBottom: '0.5rem',
                  fontSize: '0.875rem', fontWeight: 500, color: colors.text,
                }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem',
                    backgroundColor: colors.inputBg, border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '0.5rem', color: colors.text, fontSize: '1rem',
                    cursor: 'pointer', boxSizing: 'border-box',
                  }}
                >
                  {categoryNames.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount and Due Day */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
              />
              <Input
                label="Due Day of Month"
                type="number"
                placeholder="1-31"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                error={errors.dueDay}
              />
            </div>

            {/* Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                padding: '0.75rem', backgroundColor: colors.background, borderRadius: '0.5rem',
              }}>
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>Recurring</span>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                padding: '0.75rem', backgroundColor: colors.background, borderRadius: '0.5rem',
              }}>
                <input type="checkbox" checked={isAutoPay} onChange={(e) => setIsAutoPay(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>AutoPay</span>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
                padding: '0.75rem', backgroundColor: colors.background, borderRadius: '0.5rem',
              }}>
                <input type="checkbox" checked={isSplit}
                  disabled={!isSplit && !canSplit(billToEdit?.id)}
                  onChange={(e) => setIsSplit(e.target.checked)}
                  style={{
                    cursor: canSplit(billToEdit?.id) || isSplit ? 'pointer' : 'not-allowed',
                    width: '18px', height: '18px',
                    opacity: !isSplit && !canSplit(billToEdit?.id) ? 0.5 : 1,
                  }} />
                <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>
                  Split {!canSplit(billToEdit?.id) && !isSplit ? '(Pro)' : ''}
                </span>
              </label>
            </div>

            {/* Paid With */}
            {(() => {
              const plaidCardNames = (plaidCards || []).map((cc: any) => cc.cardName);
              const manualCards = creditCards.length > 0
                ? creditCards.map((cc: any) => cc.cardName).filter((n: string) => !plaidCardNames.includes(n))
                : [...new Set((bills || []).filter((b: any) => b.paidWith).map((b: any) => b.paidWith))].filter(n => !plaidCardNames.includes(n));
              const hasOptions = plaidCardNames.length > 0 || manualCards.length > 0;
              return (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: colors.textSub, letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    PAID WITH (OPTIONAL)
                  </label>
                  <select
                    value={paidWith}
                    onChange={(e) => setPaidWith(e.target.value)}
                    style={{
                      width: '100%', padding: '0.625rem 0.75rem', fontSize: '0.875rem',
                      backgroundColor: colors.inputBg || colors.cardBg, color: colors.text,
                      border: `1px solid ${colors.inputBorder || colors.divider}`, borderRadius: '0.5rem',
                      appearance: 'auto', cursor: 'pointer',
                    }}
                  >
                    <option value="">Bank account (direct)</option>
                    {plaidCardNames.length > 0 && <optgroup label="Connected Cards">
                      {plaidCardNames.map((card: string) => (
                        <option key={card} value={card}>💳 {card}</option>
                      ))}
                    </optgroup>}
                    {manualCards.length > 0 && <optgroup label="Custom Cards">
                      {manualCards.map((card: string) => (
                        <option key={card} value={card}>{card}</option>
                      ))}
                    </optgroup>}
                    {paidWith && !plaidCardNames.includes(paidWith) && !manualCards.includes(paidWith) && (
                      <option value={paidWith}>{paidWith}</option>
                    )}
                  </select>
                  {!hasOptions && (
                    <input
                      type="text"
                      placeholder="Or type a card name, e.g. Chase Sapphire"
                      value={paidWith}
                      onChange={(e) => setPaidWith(e.target.value)}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginTop: '0.5rem',
                        backgroundColor: colors.inputBg || colors.cardBg, color: colors.text,
                        border: `1px solid ${colors.inputBorder || colors.divider}`, borderRadius: '0.375rem',
                      }}
                    />
                  )}
                </div>
              );
            })()}

            {/* Split amounts */}
            {isSplit && (
              <div style={{
                padding: '1rem', backgroundColor: colors.background,
                borderRadius: '0.5rem', border: `1px solid ${colors.divider}`,
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
                  Split Across Paychecks
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {[
                    { num: 1, value: p1, setValue: setP1 },
                    { num: 2, value: p2, setValue: setP2 },
                    { num: 3, value: p3, setValue: setP3 },
                    { num: 4, value: p4, setValue: setP4 },
                  ].map(({ num, value, setValue }) => (
                    <Input
                      key={num}
                      label={`Paycheck ${num}`}
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  ))}
                </div>
                {errors.splits && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: colors.red }}>{errors.splits}</p>
                )}
                {splitRemaining !== 0 && !errors.splits && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: colors.amber }}>
                    Remaining to allocate: {fmt(Math.abs(splitRemaining))}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            SPENDING TARGET FORM
           ══════════════════════════════════════════════════════ */}
        {expenseType === 'budget' && !billToEdit && (
          <>
            {/* Category selector */}
            <div>
              <label style={{
                display: 'block', marginBottom: '0.5rem',
                fontSize: '0.875rem', fontWeight: 500, color: colors.text,
              }}>Category</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
              }}>
                {categoryNames.map(cat => {
                  const isSelected = targetCategory === cat;
                  const alreadyHas = existingBudgetCategories.has(cat);
                  return (
                    <div
                      key={cat}
                      onClick={() => !alreadyHas && setTargetCategory(cat)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                        border: `1.5px solid ${isSelected ? '#38BDF8' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                        backgroundColor: alreadyHas
                          ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                          : isSelected
                            ? (isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.04)')
                            : 'transparent',
                        cursor: alreadyHas ? 'not-allowed' : 'pointer',
                        opacity: alreadyHas ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CategoryIcon category={cat} size={20} isDark={isDark} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.8rem', fontWeight: isSelected ? 600 : 400,
                          color: alreadyHas ? colors.textMuted : colors.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {cat}
                        </div>
                        {alreadyHas && (
                          <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Has target</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.targetCategory && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: colors.red }}>{errors.targetCategory}</p>
              )}
            </div>

            {/* Target amount */}
            <Input
              label="Target Amount (per paycheck)"
              type="number"
              placeholder="e.g., 400"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              error={errors.targetAmount}
            />

            {targetAmount && parseFloat(targetAmount) > 0 && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '0.5rem',
                backgroundColor: isDark ? 'rgba(56,189,248,0.06)' : 'rgba(56,189,248,0.04)',
                border: `1px solid ${isDark ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.1)'}`,
              }}>
                <p style={{ fontSize: '0.85rem', color: colors.text, margin: 0 }}>
                  You'll budget <strong>{fmt(parseFloat(targetAmount))}</strong> per paycheck for <strong>{targetCategory}</strong>.
                  We'll track your actual spending against this target.
                </p>
              </div>
            )}
          </>
        )}

        {/* Error message */}
        {errors.submit && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: `${colors.red}20`,
            border: `1px solid ${colors.red}`,
            borderRadius: '0.5rem',
            color: colors.red,
            fontSize: '0.875rem',
          }}>
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', gap: '1rem', justifyContent: 'flex-end',
          paddingTop: '1rem', borderTop: `1px solid ${colors.divider}`,
        }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            {billToEdit ? 'Update Bill' : (expenseType === 'budget' ? 'Save Target' : 'Add Bill')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
