'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

function SetupChoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();

  const schedule = searchParams.get('schedule') || '';
  const amount = searchParams.get('amount') || '';
  const nickname = searchParams.get('nickname') || '';
  const nextPayday = searchParams.get('nextPayday') || '';

  const queryParams = `schedule=${schedule}&amount=${amount}&nickname=${nickname}&nextPayday=${nextPayday}`;

  const handleManualEntry = () => {
    router.push(`/onboarding/first-bill?${queryParams}`);
  };

  const handleBankImport = () => {
    router.push(`/onboarding/bank-import?${queryParams}`);
  };

  const handleBack = () => {
    router.push(`/onboarding/income?schedule=${schedule}`);
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
      width: '50%',
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    choiceGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '16px',
    },
    choiceCard: (isHighlighted: boolean) => ({
      padding: '24px',
      backgroundColor: colors.card,
      border: `2px solid ${isHighlighted ? colors.electric : colors.cardBorder}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column' as const,
    }),
    icon: {
      fontSize: '40px',
      marginBottom: '16px',
      lineHeight: 1,
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: colors.text,
      marginBottom: '8px',
    },
    cardDescription: {
      fontSize: '14px',
      color: colors.textMuted,
      marginBottom: '16px',
      lineHeight: 1.5,
    },
    badges: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap' as const,
    },
    badge: (bgColor: string, textColor: string) => ({
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: bgColor,
      color: textColor,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.4px',
    }),
    footer: {
      marginTop: '32px',
      padding: '20px',
      backgroundColor: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      fontSize: '12px',
      color: colors.textMuted,
      lineHeight: 1.6,
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <a style={styles.backLink} onClick={handleBack}>
            ← Back
          </a>
          <span style={styles.stepLabel}>Step 3 of 5</span>
        </div>
        <h1 style={styles.title}>How should we find your bills?</h1>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.choiceGrid}>
          {/* Manual Entry Card */}
          <div style={styles.choiceCard(false)} onClick={handleManualEntry}>
            <div style={styles.icon}>✏️</div>
            <div style={styles.cardTitle}>I'll enter them myself</div>
            <div style={styles.cardDescription}>
              Best if you know your bills off the top of your head.
            </div>
            <div style={styles.badges}>
              <span
                style={styles.badge(colors.green, colors.background)}
              >
                Free
              </span>
            </div>
          </div>

          {/* Bank Import Card */}
          <div style={styles.choiceCard(true)} onClick={handleBankImport}>
            <div style={styles.icon}>🏦</div>
            <div style={styles.cardTitle}>Find them from my bank</div>
            <div style={styles.cardDescription}>
              No typing — we detect your bills automatically.
            </div>
            <div style={styles.badges}>
              <span
                style={styles.badge(colors.electric, colors.background)}
              >
                Ultra
              </span>
              <span
                style={styles.badge('transparent', colors.green)}
              >
                7-day free trial
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        🔒 Bank import uses 256-bit encryption via Plaid. We never see your login
        credentials.
      </div>
    </div>
  );
}

export default function SetupChoicePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <SetupChoiceContent />
    </Suspense>
  );
}
