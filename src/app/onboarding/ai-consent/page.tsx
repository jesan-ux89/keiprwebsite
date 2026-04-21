'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';

/**
 * AI Consent — Step 4/5 of onboarding (Ultra path only).
 *
 * Only reached when the user picks the Ultra path from /setup-choice.
 * AI Accountant is Ultra-only, so Free/Pro users never see this page.
 *
 * Accepting calls POST /me/ai-consent and POST /me/ai-settings with
 * enabled=true so the AI Accountant can run its onboarding pass once
 * Plaid finishes syncing. Skipping stamps ai_prompted_at so the
 * Dashboard first-login prompt doesn't nag later.
 *
 * Mirrors mobile AIConsentScreen.tsx exactly.
 */
function AIConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = searchParams.toString();
  const continueTo = `/onboarding/bank-import${queryString ? `?${queryString}` : ''}`;

  async function handleEnable() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await aiAPI.getSettings();
      const version = res?.data?.consent_current_version;
      if (!version) {
        // Feature flag off — fall through silently
        router.push(continueTo);
        return;
      }
      await aiAPI.acceptConsent(version);
      await aiAPI.setEnabled(true, 'onboarding');
      router.push(continueTo);
    } catch (err: any) {
      if (err?.response?.status === 503) {
        // Feature off — pass through
        router.push(continueTo);
        return;
      }
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong';
      setError(`Couldn't save consent (${msg}). You can enable later in Settings.`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    // Fire-and-forget — don't block navigation
    try { await aiAPI.markPrompted(); } catch {}
    router.push(continueTo);
  }

  function handleBack() {
    router.back();
  }

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: { marginBottom: '24px' },
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
    progressBar: {
      height: '3px',
      backgroundColor: colors.progressTrack,
      borderRadius: '2px',
      overflow: 'hidden' as const,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.electric,
      width: '80%',
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '560px',
      width: '100%',
      margin: '0 auto',
    },
    iconBox: {
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      backgroundColor: 'rgba(156,94,250,0.12)',
      border: '1px solid rgba(156,94,250,0.25)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '26px',
      marginBottom: '16px',
    },
    title: {
      fontSize: '26px',
      fontWeight: 700,
      color: colors.text,
      marginBottom: '10px',
      lineHeight: 1.25,
    },
    sub: {
      fontSize: '14px',
      color: colors.textSub,
      lineHeight: 1.55,
      marginBottom: '24px',
    },
    sectionLabel: {
      fontSize: '11px',
      fontWeight: 700,
      color: colors.textMuted,
      letterSpacing: '1.2px',
      textTransform: 'uppercase' as const,
      marginTop: '16px',
      marginBottom: '10px',
    },
    feature: {
      display: 'flex',
      gap: '10px',
      marginBottom: '10px',
      alignItems: 'flex-start' as const,
    },
    featureDot: {
      color: '#9C5EFA',
      fontSize: '14px',
      lineHeight: '18px',
      flex: '0 0 auto',
    },
    featureText: {
      fontSize: '13px',
      color: colors.textSub,
      lineHeight: 1.5,
    },
    errorBox: {
      backgroundColor: 'rgba(163,45,45,0.1)',
      borderRadius: '8px',
      padding: '10px 12px',
      marginTop: '16px',
      color: '#F87171',
      fontSize: '13px',
    },
    footer: {
      marginTop: '28px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
      maxWidth: '560px',
      width: '100%',
      margin: '28px auto 0 auto',
    },
    primaryBtn: {
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: 700,
      cursor: submitting ? 'not-allowed' : 'pointer',
      border: 'none',
      backgroundColor: colors.electric,
      color: '#0C4A6E',
      opacity: submitting ? 0.7 : 1,
      transition: 'opacity 0.2s ease',
    },
    skipLink: {
      fontSize: '14px',
      color: colors.textSub,
      textAlign: 'center' as const,
      fontWeight: 500,
      padding: '8px',
      cursor: 'pointer',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
          <a style={styles.backLink} onClick={handleBack}>← Back</a>
          <span style={styles.stepLabel}>Step 4 of 5 · AI Assistant</span>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.iconBox}>✨</div>

        <h1 style={styles.title}>Let Keipr's AI Assistant do the heavy lifting.</h1>
        <p style={styles.sub}>
          An automated audit layer that reviews your budget after every bank sync — it detects mortgage-staging chains, deduplicates credit-card payments, splits big bills across paychecks, and flags unusual categorizations.
        </p>

        <div style={styles.sectionLabel}>What it handles for you</div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Spots savings patterns (e.g. transferring $1,958 biweekly to pay a $3,916 mortgage) and turns them into a staging chain.</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Catches duplicate bills when the same payment shows up twice (credit-card leg + checking leg).</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Auto-assigns bills to the right paycheck based on their due dates.</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Never charges you a cent more — it's included with Ultra.</span>
        </div>

        <div style={styles.sectionLabel}>Your data</div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Bill names, amounts, and categories are sent to Anthropic for processing only — not for training models.</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Your name, email, account numbers, and bank login are never sent.</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>Requests are deleted after processing (zero-retention endpoint).</span>
        </div>
        <div style={styles.feature}>
          <span style={styles.featureDot}>•</span>
          <span style={styles.featureText}>You can turn it off anytime in Settings → AI Assistant.</span>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
      </div>

      <div style={styles.footer}>
        <button style={styles.primaryBtn} onClick={handleEnable} disabled={submitting}>
          {submitting ? 'Saving...' : 'Enable AI Assistant'}
        </button>
        <button style={styles.skipLink} onClick={handleSkip} disabled={submitting}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

export default function AIConsentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />}>
      <AIConsentContent />
    </Suspense>
  );
}
