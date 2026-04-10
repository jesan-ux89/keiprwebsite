'use client';

import React, { useState, useCallback, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { subscriptionsAPI, bankingAPI } from '@/lib/api';
import { usePlaidLink } from 'react-plaid-link';
import { AlertCircle, Loader } from 'lucide-react';

type Step = 'trial' | 'connecting' | 'syncing' | 'success';

function BankImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors } = useTheme();
  const { refreshSubscription } = useApp();

  // Url params from previous step
  const schedule = searchParams.get('schedule') || 'biweekly';
  const amount = searchParams.get('amount') || '';
  const nickname = searchParams.get('nickname') || '';
  const nextPayday = searchParams.get('nextPayday') || '';

  const [step, setStep] = useState<Step>('trial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedBank, setConnectedBank] = useState<string | null>(null);
  const plaidReady = useRef(false);

  // ── Step 1: Start Ultra free trial ──
  const handleStartTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionsAPI.checkout('ultra_monthly');
      const checkoutUrl = res.data?.checkoutUrl || res.data?.url || res.data?.checkout_url;
      if (!checkoutUrl) {
        setError('Could not create checkout. Please try again.');
        setLoading(false);
        return;
      }
      // Open Lemon Squeezy checkout in new tab
      window.open(checkoutUrl, '_blank');
      // Poll for subscription status
      pollForSubscription();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start trial. Please try again.');
      setLoading(false);
    }
  };

  const pollForSubscription = () => {
    const maxAttempts = 40;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await subscriptionsAPI.getStatus();
        const status = res.data?.subscriptionStatus || res.data?.subscription_status;
        const plan = res.data?.plan;
        if (status === 'trialing' || status === 'active' || plan === 'ultra' || plan === 'pro') {
          // Trial activated! Refresh app state and move to Plaid
          if (refreshSubscription) await refreshSubscription();
          setLoading(false);
          setStep('connecting');
          return;
        }
      } catch (_) {
        /* ignore poll errors */
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setLoading(false);
        setError('Timed out waiting for trial activation. If you completed checkout, please continue.');
      }
    };

    setTimeout(poll, 3000); // Initial delay to give LS time to process
  };

  // ── Step 2: Get Plaid Link token ──
  const initPlaidLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bankingAPI.getLinkToken();
      const token = res.data?.link_token;
      if (!token) {
        setError('Failed to get link token. Please try again.');
        setLoading(false);
        return;
      }
      setLinkToken(token);
      plaidReady.current = true;
      setLoading(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start bank connection.');
      setLoading(false);
    }
  };

  // ── Step 3: Handle Plaid success ──
  const handlePlaidSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        setStep('syncing');
        const institution = metadata?.institution;
        const plaidAccounts = metadata?.accounts || [];

        await bankingAPI.exchangeToken({
          public_token: publicToken,
          institution: {
            id: institution?.id || null,
            name: institution?.name || 'Unknown Bank',
          },
          accounts: plaidAccounts.map((a: any) => ({
            id: a.id,
            name: a.name,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
          })),
        });

        setConnectedBank(institution?.name || 'Your bank');

        // Show success step after brief delay
        setTimeout(() => {
          setStep('success');
        }, 1500);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to connect bank. Please try again.');
        setStep('connecting');
      }
    },
    []
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => handlePlaidSuccess(publicToken, metadata),
    onExit: (err, metadata) => {
      if (err && err.error_code && err.error_code !== 'USER_EXIT') {
        setError(err.display_message || 'Bank connection failed. Please try again.');
      }
    },
  });

  const handleOpenPlaid = () => {
    if (ready && plaidReady.current) {
      open();
    }
  };

  const handleSkipTrial = () => {
    setStep('connecting');
    initPlaidLink();
  };

  const handleSkipBankImport = () => {
    const params = new URLSearchParams({
      schedule,
      amount,
      nickname,
      nextPayday,
      fromBankImport: 'true',
    });
    router.push(`/onboarding/allocate?${params.toString()}`);
  };

  const handleContinueFromSuccess = () => {
    const params = new URLSearchParams({
      schedule,
      amount,
      nickname,
      nextPayday,
      fromBankImport: 'true',
    });
    router.push(`/onboarding/allocate?${params.toString()}`);
  };

  // Get progress percentage
  const getProgress = () => {
    switch (step) {
      case 'trial':
        return 50;
      case 'connecting':
        return 60;
      case 'syncing':
        return 70;
      case 'success':
        return 90;
      default:
        return 50;
    }
  };

  // Get step label
  const getStepLabel = () => {
    switch (step) {
      case 'trial':
        return 'Step 3 of 5';
      case 'connecting':
        return 'Step 3 of 5';
      case 'syncing':
        return 'Step 3 of 5';
      case 'success':
        return 'Step 3 of 5';
      default:
        return 'Step 3 of 5';
    }
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
      width: `${getProgress()}%`,
      transition: 'width 0.3s ease',
    },
    content: {
      flex: 1,
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
    },
    card: {
      padding: '24px',
      backgroundColor: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: colors.text,
      marginBottom: '12px',
      margin: '0 0 12px 0',
    },
    cardDescription: {
      fontSize: '14px',
      color: colors.textMuted,
      marginBottom: '16px',
      lineHeight: 1.6,
    },
    featureList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginBottom: '24px',
    },
    featureItem: {
      display: 'flex',
      gap: '12px',
      fontSize: '14px',
      color: colors.text,
    },
    featureIcon: {
      color: colors.electric,
      flexShrink: 0,
      marginTop: '2px',
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
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    buttonSecondary: {
      backgroundColor: colors.card,
      color: colors.text,
      border: `1px solid ${colors.cardBorder}`,
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    error: {
      display: 'flex',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: `${colors.red}15`,
      border: `1px solid ${colors.red}30`,
      borderRadius: '8px',
      marginBottom: '20px',
      alignItems: 'flex-start',
    },
    errorIcon: {
      color: colors.red,
      flexShrink: 0,
      marginTop: '2px',
    },
    errorText: {
      color: colors.red,
      fontSize: '14px',
    },
    footer: {
      marginTop: '32px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    skipLink: {
      fontSize: '13px',
      fontWeight: 600,
      color: colors.electric,
      cursor: 'pointer',
      textDecoration: 'none',
      textAlign: 'center' as const,
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center' as const,
    },
    loadingText: {
      fontSize: '16px',
      fontWeight: 600,
      color: colors.text,
      marginTop: '16px',
    },
    successMessage: {
      padding: '20px 16px',
      backgroundColor: 'rgba(10,123,108,0.1)',
      border: '1px solid rgba(10,123,108,0.3)',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px',
      color: colors.text,
      lineHeight: 1.6,
    },
    successCheckmark: {
      fontSize: '32px',
      marginBottom: '16px',
    },
  };

  // ── STEP 1: Trial ──
  if (step === 'trial') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.topBar}>
            <a
              style={styles.backLink}
              onClick={() => router.back()}
            >
              ← Back
            </a>
            <span style={styles.stepLabel}>{getStepLabel()}</span>
          </div>
          <h1 style={styles.title}>Start your free Ultra trial</h1>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} style={styles.errorIcon} />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Ultra Plan Features</h2>
            <p style={styles.cardDescription}>
              Unlock connected banking with your 7-day free trial
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Connect your bank accounts</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Auto-detect recurring bills from transactions</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Unlimited income sources and bill splits</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Track one-time funds</span>
              </div>
              <div style={styles.featureItem}>
                <span style={styles.featureIcon}>✓</span>
                <span>Export your data</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, marginBottom: '16px' }}>
              7-day free trial. Cancel anytime. After trial, $11.99/month or $131.88/year.
            </p>
          </div>

          <div style={styles.footer}>
            <button
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onClick={handleStartTrial}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Starting trial…
                </>
              ) : (
                'Start 7-day free trial'
              )}
            </button>

            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
              }}
              onClick={handleSkipTrial}
            >
              Skip trial, just connect bank
            </button>

            <a style={styles.skipLink} onClick={handleSkipBankImport}>
              Skip — I'll review bills later
            </a>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── STEP 2: Connecting (Plaid Link) ──
  if (step === 'connecting') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.topBar}>
            <span style={styles.stepLabel}>{getStepLabel()}</span>
          </div>
          <h1 style={styles.title}>Connect your bank</h1>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.error}>
              <AlertCircle size={16} style={styles.errorIcon} />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Link your bank account</h2>
            <p style={styles.cardDescription}>
              We'll connect securely with Plaid to import your transactions and automatically detect recurring bills.
            </p>

            {!linkToken && (
              <button
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                onClick={initPlaidLink}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Loading…
                  </>
                ) : (
                  'Prepare bank connection'
                )}
              </button>
            )}

            {linkToken && plaidReady.current && (
              <button
                style={styles.button}
                onClick={handleOpenPlaid}
                disabled={!ready}
              >
                Open Plaid Link
              </button>
            )}
          </div>

          <div style={styles.footer}>
            <a style={styles.skipLink} onClick={handleSkipBankImport}>
              Skip for now
            </a>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── STEP 3: Syncing ──
  if (step === 'syncing') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.topBar}>
            <span style={styles.stepLabel}>{getStepLabel()}</span>
          </div>
          <h1 style={styles.title}>Finding your bills…</h1>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.loadingContainer}>
            <Loader size={48} style={{ color: colors.electric, animation: 'spin 2s linear infinite' }} />
            <p style={styles.loadingText}>Syncing transactions</p>
            <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '8px' }}>
              This may take a moment
            </p>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── STEP 4: Success ──
  if (step === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.topBar}>
            <span style={styles.stepLabel}>{getStepLabel()}</span>
          </div>
          <h1 style={styles.title}>Bank connected!</h1>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.successCheckmark}>✓</div>
            <h2 style={styles.cardTitle}>
              {connectedBank ? `${connectedBank} connected` : 'Bank connected'}
            </h2>

            <div style={styles.successMessage}>
              <strong>What happens next:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>We'll scan your recent transactions</li>
                <li>New recurring charges will appear as detected bills</li>
                <li>You can confirm them as bills or dismiss them</li>
                <li>Transactions stay private — we never store them</li>
              </ul>
            </div>

            <div style={styles.footer}>
              <button style={styles.button} onClick={handleContinueFromSuccess}>
                Continue to allocate →
              </button>

              <a style={styles.skipLink} onClick={handleSkipBankImport}>
                Skip for now
              </a>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}

export default function BankImportPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <BankImportContent />
    </Suspense>
  );
}
