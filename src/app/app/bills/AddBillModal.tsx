'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const CATEGORIES = [
  'Utilities',
  'Rent/Mortgage',
  'Insurance',
  'Subscriptions',
  'Transportation',
  'Food & Groceries',
  'Healthcare',
  'Entertainment',
  'Debt Repayment',
  'Savings',
  'Other',
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
  };
}

export default function AddBillModal({ isOpen, onClose, billToEdit }: AddBillModalProps) {
  const { colors } = useTheme();
  const { addBill, updateBill } = useApp();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [dueDay, setDueDay] = useState(1);
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [isAutoPay, setIsAutoPay] = useState(false);
  const [isSplit, setIsSplit] = useState(false);

  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [p4, setP4] = useState('');

  // Initialize form with bill data if editing
  useEffect(() => {
    if (billToEdit) {
      setName(billToEdit.name);
      setCategory(billToEdit.category);
      setDueDay(billToEdit.dueDay);
      setAmount(billToEdit.total.toString());
      setIsRecurring(billToEdit.isRecurring);
      setIsAutoPay(billToEdit.isAutoPay);
      setIsSplit(billToEdit.isSplit);

      if (billToEdit.isSplit) {
        setP1(billToEdit.p1?.toString() || '');
        setP2(billToEdit.p2?.toString() || '');
        setP3(billToEdit.p3?.toString() || '');
        setP4(billToEdit.p4?.toString() || '');
      }
    } else {
      // Reset form
      setName('');
      setCategory('Utilities');
      setDueDay(1);
      setAmount('');
      setIsRecurring(true);
      setIsAutoPay(false);
      setIsSplit(false);
      setP1('');
      setP2('');
      setP3('');
      setP4('');
    }
    setErrors({});
  }, [isOpen, billToEdit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Bill name is required';
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (dueDay < 1 || dueDay > 31) {
      newErrors.dueDay = 'Due day must be between 1 and 31';
    }

    if (isSplit) {
      const p1Num = parseFloat(p1) || 0;
      const p2Num = parseFloat(p2) || 0;
      const p3Num = parseFloat(p3) || 0;
      const p4Num = parseFloat(p4) || 0;
      const totalSplit = p1Num + p2Num + p3Num + p4Num;

      if (totalSplit !== amountNum) {
        newErrors.splits = `Split amounts (${totalSplit.toFixed(2)}) must equal total amount (${amountNum.toFixed(2)})`;
      }

      if (p1Num < 0 || p2Num < 0 || p3Num < 0 || p4Num < 0) {
        newErrors.splits = 'All split amounts must be non-negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

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

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const amountNum = parseFloat(amount) || 0;
  const splitTotal = (parseFloat(p1) || 0) + (parseFloat(p2) || 0) + (parseFloat(p3) || 0) + (parseFloat(p4) || 0);
  const splitRemaining = amountNum - splitTotal;

  return (
    <Modal
      title={billToEdit ? 'Edit Bill' : 'Add New Bill'}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Basic Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Bill Name"
            type="text"
            placeholder="e.g., Electricity, Netflix"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.text,
              }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: '0.5rem',
                color: colors.text,
                fontSize: '1rem',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              backgroundColor: colors.background,
              borderRadius: '0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              style={{
                cursor: 'pointer',
                width: '18px',
                height: '18px',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>
              Recurring
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              backgroundColor: colors.background,
              borderRadius: '0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={isAutoPay}
              onChange={(e) => setIsAutoPay(e.target.checked)}
              style={{
                cursor: 'pointer',
                width: '18px',
                height: '18px',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>
              AutoPay
            </span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              backgroundColor: colors.background,
              borderRadius: '0.5rem',
            }}
          >
            <input
              type="checkbox"
              checked={isSplit}
              onChange={(e) => setIsSplit(e.target.checked)}
              style={{
                cursor: 'pointer',
                width: '18px',
                height: '18px',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: colors.text, fontWeight: 500 }}>
              Split
            </span>
          </label>
        </div>

        {/* Split amounts */}
        {isSplit && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: colors.background,
              borderRadius: '0.5rem',
              border: `1px solid ${colors.divider}`,
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: colors.text,
                margin: '0 0 1rem 0',
              }}
            >
              Split Across Paychecks
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
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
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: colors.red,
                }}
              >
                {errors.splits}
              </p>
            )}

            {splitRemaining !== 0 && !errors.splits && (
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: colors.amber,
                }}
              >
                Remaining to allocate: ${Math.abs(splitRemaining).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {errors.submit && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: `${colors.red}20`,
              border: `1px solid ${colors.red}`,
              borderRadius: '0.5rem',
              color: colors.red,
              fontSize: '0.875rem',
            }}
          >
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: `1px solid ${colors.divider}`,
          }}
        >
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {billToEdit ? 'Update Bill' : 'Add Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
