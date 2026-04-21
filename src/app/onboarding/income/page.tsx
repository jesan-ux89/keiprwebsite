'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';

function IncomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  const { fmt } = useApp();

  const schedule = searchParams.get('schedule') || 'biweekly';

  const [nickname, setNickname] = useState('Main job');
  const [amount, setAmount] = useState('');
  const [nextPayday, setNextPayday] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid paycheck amount');
      return;
    }

    if (!nextPayday) {
      setError('Please select your next payday');
      return;
    }

    const params = new URLSearchParams({
      schedule,
      amount,
      nickname,
      nextPayday,
    });

    router.push(`/onboarding/setup-choice?${params.toString()}`);
  };

  const handleBack = () => {
    router.push('/onboarding/pay-schedule');
  };

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
      marginBottom: '24px',
      lineHeight: 1.2,
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
      width: '40%',
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: colors.text,
      marginBottom: '8px',
    },
    hint: {
      fontSize: '12px',
      color: colors.textMuted,
      marginTop: '4px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      fontSize: '14px',
      backgroundColor: colors.inputBg,
      border: `1px solid ${colors.inputBorder}`,
      borderRadius: '8px',
      color: colors.text,
      boxSizing: 'border-box' as const,
      transition: 'all 0.2s ease',
    },
    previewCard: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
    },
    previewLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    previewAmount: {
      fontSize: '24px',
      fontWeight: 700,
      color: colors.electric,
    },
    error: {
      color: colors.red,
      fontSize: '13px',
      marginTop: '8px',
    },
    footer: {
      marginTop: '32px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease',
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <a style={styles.backLink} onClick={handleBack}>
            ← Back
          </a>
          <span style={styles.stepLabel}>Step 2 of 5</span>
        </div>
        <h1 style={styles.title}>Tell us about your paycheck.</h1>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Nickname</label>
          <input
            style={styles.input}
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Main job"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Take-home amount</label>
          <input
            style={styles.input}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$0.00"
            step="0.01"
            min="0"
          />
          <div style={styles.hint}>After tax and deductions</div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Next payday</label>
          <input
            style={styles.input}
            type="date"
            value={nextPayday}
            onChange={(e) => setNextPayday(e.target.value)}
          />
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div style={styles.previewCard}>
            <div style={styles.previewLabel}>Your paycheck</div>
            <div style={styles.previewAmount}>${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.footer}>
        <button style={styles.button} onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}

export default function IncomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <IncomeContent />
    </Suspense>
  );
}
