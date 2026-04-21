'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

type PaySchedule = 'biweekly' | 'twicemonthly' | 'weekly' | 'monthly' | 'irregular';

const schedules: Array<{
  key: PaySchedule;
  label: string;
  description: string;
  emoji: string;
}> = [
  { key: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks', emoji: '📅' },
  { key: 'twicemonthly', label: '1st & 15th', description: 'Twice a month', emoji: '🗓' },
  { key: 'weekly', label: 'Weekly', description: 'Every week', emoji: '📆' },
  { key: 'monthly', label: 'Monthly', description: 'Once a month', emoji: '💼' },
  { key: 'irregular', label: 'Irregular', description: 'Gig / freelance', emoji: '🔀' },
];

export default function PaySchedulePage() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState<PaySchedule>('biweekly');

  const handleContinue = () => {
    router.push(`/onboarding/income?schedule=${selected}`);
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
    stepLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.textMuted,
      marginBottom: '12px',
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
      marginBottom: '24px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.electric,
      width: '17%',
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    optionCard: (isSelected: boolean) => ({
      padding: '20px',
      backgroundColor: colors.card,
      border: `2px solid ${isSelected ? colors.electric : colors.cardBorder}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }),
    emoji: {
      fontSize: '32px',
      lineHeight: 1,
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: '16px',
      fontWeight: 600,
      color: colors.text,
      marginBottom: '4px',
    },
    optionDescription: {
      fontSize: '13px',
      color: colors.textMuted,
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
        <div style={styles.stepLabel}>Step 1 of 6</div>
        <h1 style={styles.title}>How often do you get paid?</h1>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.optionsGrid}>
          {schedules.map((schedule) => (
            <div
              key={schedule.key}
              style={styles.optionCard(selected === schedule.key)}
              onClick={() => setSelected(schedule.key)}
            >
              <div style={styles.emoji}>{schedule.emoji}</div>
              <div style={styles.optionContent}>
                <div style={styles.optionLabel}>{schedule.label}</div>
                <div style={styles.optionDescription}>{schedule.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <button style={styles.button} onClick={handleContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}
