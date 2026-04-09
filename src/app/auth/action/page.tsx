'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

type ActionMode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | null;
type Status = 'loading' | 'success' | 'error' | 'resetForm';

export default function AuthActionPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading...</div>}>
      <AuthActionContent />
    </Suspense>
  );
}

function AuthActionContent() {
  const searchParams = useSearchParams();
  const { colors, isDark } = useTheme();

  const mode = searchParams.get('mode') as ActionMode;
  const oobCode = searchParams.get('oobCode') || '';
  const continueUrl = searchParams.get('continueUrl');

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  // Password reset form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing action code.');
      setStatus('error');
      return;
    }

    switch (mode) {
      case 'verifyEmail':
        handleVerifyEmail();
        break;
      case 'resetPassword':
        handleVerifyResetCode();
        break;
      case 'recoverEmail':
        handleRecoverEmail();
        break;
      default:
        setError('Unknown action type.');
        setStatus('error');
    }
  }, [mode, oobCode]);

  async function handleVerifyEmail() {
    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setStatus('error');
    }
  }

  async function handleVerifyResetCode() {
    try {
      const userEmail = await verifyPasswordResetCode(auth, oobCode);
      setEmail(userEmail);
      setStatus('resetForm');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setStatus('error');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPwd) {
      setError('Passwords do not match.');
      return;
    }
    setResetting(true);
    setError('');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setResetting(false);
    }
  }

  async function handleRecoverEmail() {
    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
      setStatus('error');
    }
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/expired-action-code': return 'This link has expired. Please request a new one.';
      case 'auth/invalid-action-code': return 'This link is invalid or has already been used.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found': return 'No account found for this action.';
      case 'auth/weak-password': return 'Password is too weak. Use at least 6 characters.';
      default: return 'Something went wrong. Please try again.';
    }
  }

  function getTitle(): string {
    if (status === 'loading') return 'Processing...';
    if (status === 'error') return 'Something went wrong';

    switch (mode) {
      case 'verifyEmail':
        return status === 'success' ? 'Email verified!' : 'Verifying...';
      case 'resetPassword':
        return status === 'success' ? 'Password updated!' : 'Reset your password';
      case 'recoverEmail':
        return status === 'success' ? 'Email recovered!' : 'Recovering...';
      default:
        return 'Action';
    }
  }

  function getDescription(): string {
    if (status === 'loading') return 'Hang tight while we process your request.';
    if (status === 'error') return error;

    switch (mode) {
      case 'verifyEmail':
        return status === 'success'
          ? 'Your email has been verified. You can now sign in to your account.'
          : 'Verifying your email address...';
      case 'resetPassword':
        return status === 'success'
          ? 'Your password has been reset. You can now sign in with your new password.'
          : `Enter a new password for ${email}`;
      case 'recoverEmail':
        return status === 'success'
          ? 'Your email address has been recovered.'
          : 'Recovering your email address...';
      default:
        return '';
    }
  }

  const s = getStyles(colors, isDark);

  return (
    <div>
      {/* Status icon */}
      <div style={s.iconWrap}>
        {status === 'loading' && <span style={s.iconLoading}>⏳</span>}
        {status === 'success' && <span style={s.iconSuccess}>✓</span>}
        {status === 'error' && <span style={s.iconError}>✕</span>}
        {status === 'resetForm' && <span style={s.iconReset}>🔑</span>}
      </div>

      {/* Title */}
      <h1 style={s.title}>{getTitle()}</h1>

      {/* Description */}
      <p style={s.description}>{getDescription()}</p>

      {/* Password reset form */}
      {status === 'resetForm' && (
        <form onSubmit={handleResetPassword} style={s.form}>
          {error && (
            <div style={s.errorBanner}>
              <span style={s.errorText}>{error}</span>
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>NEW PASSWORD</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={s.input}
              autoFocus
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Re-enter password"
              style={s.input}
            />
          </div>
          <button type="submit" style={s.btn} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {/* CTA buttons */}
      {status === 'success' && (
        <div style={s.actions}>
          <Link href="/auth/login" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={s.btn}>
              {mode === 'verifyEmail' ? 'Sign in to Keipr' : 'Back to Sign In'}
            </button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div style={s.actions}>
          {mode === 'verifyEmail' && (
            <Link href="/auth/login" style={{ textDecoration: 'none', width: '100%' }}>
              <button style={s.btn}>Go to Sign In</button>
            </Link>
          )}
          {mode === 'resetPassword' && (
            <Link href="/auth/forgot-password" style={{ textDecoration: 'none', width: '100%' }}>
              <button style={s.btn}>Request New Link</button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function getStyles(colors: any, isDark: boolean) {
  return {
    iconWrap: {
      textAlign: 'center' as const,
      marginBottom: '20px',
    },
    iconLoading: {
      fontSize: '40px',
    },
    iconSuccess: {
      display: 'inline-flex',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(4,120,87,0.08)',
      color: isDark ? '#34D399' : '#047857',
      fontSize: '24px',
      fontWeight: '700',
    },
    iconError: {
      display: 'inline-flex',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(185,28,28,0.08)',
      color: isDark ? '#F87171' : '#B91C1C',
      fontSize: '24px',
      fontWeight: '700',
    },
    iconReset: {
      fontSize: '40px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center' as const,
      margin: '0 0 8px 0',
    },
    description: {
      fontSize: '14px',
      color: colors.textMuted,
      textAlign: 'center' as const,
      lineHeight: '1.5',
      margin: '0 0 24px 0',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    field: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '10px',
      fontWeight: '500',
      color: colors.textMuted,
      letterSpacing: '1.2px',
    },
    input: {
      padding: '12px 14px',
      fontSize: '15px',
      borderRadius: '10px',
      border: `1px solid ${colors.cardBorder}`,
      backgroundColor: colors.background,
      color: colors.text,
      outline: 'none',
    },
    errorBanner: {
      padding: '10px',
      borderRadius: '8px',
      backgroundColor: isDark ? 'rgba(248,113,113,0.1)' : 'rgba(185,28,28,0.08)',
    },
    errorText: {
      fontSize: '12px',
      color: isDark ? '#F87171' : '#B91C1C',
    },
    actions: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    },
    btn: {
      width: '100%',
      padding: '14px',
      fontSize: '15px',
      fontWeight: '600',
      color: '#fff',
      backgroundColor: '#0C4A6E',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      textAlign: 'center' as const,
    },
  };
}
