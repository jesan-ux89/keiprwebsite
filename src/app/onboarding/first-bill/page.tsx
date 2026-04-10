'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';

const FALLBACK_CATEGORIES = [
  'Dining',
  'Fun',
  'Groceries',
  'Healthcare',
  'Housing',
  'Insurance',
  'Loans',
  'Other',
  'Savings',
  'Shopping',
  'Subscriptions',
  'Transport',
  'Utilities',
];

type BillEntry = {
  name: string;
  amount: string;
  dueDay: string;
  category: string;
  isSplit?: boolean;
};

function FirstBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  const { fmt, isPro } = useApp();

  // Pass-through query params from previous steps
  const schedule = searchParams.get('schedule') || '';
  const amount = searchParams.get('amount') || '';
  const nickname = searchParams.get('nickname') || '';
  const nextPayday = searchParams.get('nextPayday') || '';

  const [billName, setBillName] = useState('Mortgage');
  const [billAmount, setBillAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [category, setCategory] = useState('Housing');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [savedBills, setSavedBills] = useState<BillEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBack = () => {
    router.push(`/onboarding/setup-choice?schedule=${schedule}&amount=${amount}&nickname=${nickname}&nextPayday=${nextPayday}`);
  };

  const validateBill = (): boolean => {
    setError(null);

    if (!billAmount || parseFloat(billAmount) <= 0) {
      setError('Please enter a valid bill amount');
      return false;
    }

    const dueDayNum = parseInt(dueDay, 10);
    if (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31) {
      setError('Due day must be between 1 and 31');
      return false;
    }

    return true;
  };

  const handleAddBill = () => {
    if (!validateBill()) return;

    const newBill: BillEntry = {
      name: billName,
      amount: billAmount,
      dueDay,
      category,
    };

    setSavedBills((prev) => [...prev, newBill]);
    setSuccessMessage(`${billName} added. Enter your next bill or continue.`);

    // Reset form
    setBillName('');
    setBillAmount('');
    setDueDay('1');
    setCategory('Other');
    setShowCategoryDropdown(false);
  };

  const handleRemoveBill = (index: number) => {
    setSavedBills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    setError(null);

    // If there's a bill in the form, validate and add it
    if (billAmount) {
      if (!validateBill()) return;
      handleAddBill();
      // After adding the last bill, don't navigate immediately
      // Wait for the next click to navigate
    }

    // Must have at least one saved bill
    const allBills = billAmount ? [...savedBills, { name: billName, amount: billAmount, dueDay, category }] : savedBills;

    if (allBills.length === 0) {
      setError('Please enter at least one bill');
      return;
    }

    // Store bills in sessionStorage as JSON
    try {
      sessionStorage.setItem('onboarding_bills', JSON.stringify(allBills));
    } catch (e) {
      console.error('Failed to store bills in sessionStorage:', e);
    }

    // Navigate to allocate page with query params
    const params = new URLSearchParams({
      schedule,
      amount,
      nickname,
      nextPayday,
    });

    router.push(`/onboarding/allocate?${params.toString()}`);
  };

  const isFormFilled = billAmount && billName;
  const hasSavedBills = savedBills.length > 0;

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      marginBottom: '32px',
    },
    topBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    backLink: {
      color: colors.electric,
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    stepLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.textMuted,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    },
    title: {
      fontSize: '28px',
      fontWeight: 700,
      color: colors.text,
      marginBottom: '8px',
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: '14px',
      color: colors.textMuted,
      marginBottom: '20px',
      lineHeight: 1.5,
    },
    progressBar: {
      height: '3px',
      backgroundColor: colors.progressTrack,
      borderRadius: '2px',
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.electric,
      width: '70%',
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    infoCard: {
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      padding: '12px',
      marginBottom: '20px',
      fontSize: '12px',
      color: colors.textMuted,
      lineHeight: 1.5,
    },
    errorAlert: {
      backgroundColor: 'rgba(163,45,45,0.1)',
      border: `0.5px solid rgba(163,45,45,0.2)`,
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    },
    errorText: {
      color: '#A32D2D',
      fontSize: '12px',
      flex: 1,
    },
    errorClose: {
      cursor: 'pointer',
      color: '#A32D2D',
      fontWeight: '600',
      fontSize: '16px',
      lineHeight: 1,
    },
    successAlert: {
      backgroundColor: 'rgba(10,123,108,0.1)',
      border: `0.5px solid rgba(10,123,108,0.2)`,
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
    },
    successText: {
      color: '#0A7B6C',
      fontSize: '12px',
      flex: 1,
    },
    successClose: {
      cursor: 'pointer',
      color: '#0A7B6C',
      fontWeight: '600',
      fontSize: '16px',
      lineHeight: 1,
    },
    formCard: {
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '14px',
    },
    lastFormGroup: {
      marginBottom: 0,
    },
    label: {
      display: 'block',
      fontSize: '10px',
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '13px',
      fontSize: '15px',
      backgroundColor: colors.background,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      color: colors.text,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
    inputRow: {
      display: 'flex',
      gap: '12px',
    },
    inputHalf: {
      flex: 1,
    },
    selectWrapper: {
      position: 'relative' as const,
    },
    select: {
      width: '100%',
      padding: '13px',
      fontSize: '15px',
      backgroundColor: colors.background,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      color: colors.text,
      boxSizing: 'border-box' as const,
      cursor: 'pointer',
      fontFamily: 'inherit',
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(colors.textMuted)}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 13px center',
      paddingRight: '32px',
    },
    categoryDropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      marginTop: '4px',
      zIndex: 10,
      maxHeight: '200px',
      overflowY: 'auto' as const,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    categoryOption: {
      padding: '10px 13px',
      fontSize: '14px',
      color: colors.text,
      cursor: 'pointer',
      borderBottom: `0.5px solid ${colors.inputBorder}`,
      transition: 'background-color 0.2s ease',
    },
    categoryOptionActive: {
      backgroundColor: 'rgba(56,189,248,0.1)',
      color: colors.electric,
      fontWeight: '600',
    },
    savedBillsSection: {
      marginBottom: '20px',
    },
    savedBillsLabel: {
      fontSize: '10px',
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
      marginBottom: '8px',
    },
    savedBillRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBg,
      border: `0.5px solid ${colors.inputBorder}`,
      borderRadius: '10px',
      padding: '13px',
      marginBottom: '6px',
    },
    savedBillInfo: {
      flex: 1,
    },
    savedBillName: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.text,
      marginBottom: '2px',
    },
    savedBillDetails: {
      fontSize: '11px',
      color: colors.textMuted,
    },
    removeBillBtn: {
      cursor: 'pointer',
      color: '#A32D2D',
      fontSize: '16px',
      lineHeight: 1,
      paddingLeft: '8px',
    },
    footer: {
      marginTop: '20px',
      display: 'flex',
      gap: '12px',
      flexDirection: 'column' as const,
      maxWidth: '500px',
      width: '100%',
      margin: '20px auto 0',
    },
    buttonPrimary: {
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
      transition: 'all 0.2s ease',
    },
    buttonSecondary: {
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      border: `1px solid ${colors.midnight}`,
      backgroundColor: 'transparent',
      color: colors.electric,
      transition: 'all 0.2s ease',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <a style={styles.backLink} onClick={handleBack}>
            ← Back
          </a>
          <span style={styles.stepLabel}>Step 4 of 5</span>
        </div>
        <h1 style={styles.title}>Add your biggest bill first.</h1>
        <p style={styles.subtitle}>Start with rent or mortgage — you can add more after setup.</p>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.content}>
        {/* Info tip card */}
        <div style={styles.infoCard}>
          💡 Your pay schedule controls your budget. You can add more income sources or one-time funds (bonuses, tax
          refunds) anytime in Settings.
        </div>

        {/* Error alert */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorText}>{error}</span>
            <a style={styles.errorClose} onClick={() => setError(null)}>
              ✕
            </a>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div style={styles.successAlert}>
            <span style={styles.successText}>{successMessage}</span>
            <a style={styles.successClose} onClick={() => setSuccessMessage(null)}>
              ✕
            </a>
          </div>
        )}

        {/* Form card */}
        <div style={styles.formCard}>
          {/* Bill name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Bill Name</label>
            <input
              style={styles.input}
              type="text"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              placeholder="e.g. Mortgage, Rent"
            />
          </div>

          {/* Total amount */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Total Amount</label>
            <input
              style={styles.input}
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="$0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Due day and category in a row */}
          <div style={styles.inputRow}>
            <div style={styles.inputHalf}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Due Day</label>
                <input
                  style={styles.input}
                  type="number"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="1"
                  min="1"
                  max="31"
                />
              </div>
            </div>

            <div style={styles.inputHalf}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <div style={styles.selectWrapper}>
                  <select
                    style={styles.select}
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setShowCategoryDropdown(false);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setShowCategoryDropdown(false)}
                  >
                    {FALLBACK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved bills section */}
        {hasSavedBills && (
          <div style={styles.savedBillsSection}>
            <div style={styles.savedBillsLabel}>Saved Bills</div>
            {savedBills.map((bill, index) => (
              <div key={index} style={styles.savedBillRow}>
                <div style={styles.savedBillInfo}>
                  <div style={styles.savedBillName}>{bill.name}</div>
                  <div style={styles.savedBillDetails}>
                    ${parseFloat(bill.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Due {bill.dueDay} · {bill.category}
                  </div>
                </div>
                <a style={styles.removeBillBtn} onClick={() => handleRemoveBill(index)}>
                  ✕
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {!hasSavedBills ? (
          <button style={styles.buttonPrimary} onClick={handleAddBill} disabled={!isFormFilled}>
            Save this bill
          </button>
        ) : (
          <>
            <button
              style={styles.buttonPrimary}
              onClick={handleAddBill}
              disabled={!isFormFilled}
            >
              + Add another bill
            </button>

            <button style={styles.buttonSecondary} onClick={handleContinue}>
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FirstBillPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <FirstBillContent />
    </Suspense>
  );
}
