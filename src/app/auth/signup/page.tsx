'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithEmail(email, password, fullName);
      router.push('/app');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push('/app');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up with Google';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '6px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: colors.text,
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    inputFocus: {
      borderColor: colors.electric,
      boxShadow: `0 0 0 3px ${colors.electric}20`,
    },
    errorMessage: {
      fontSize: '13px',
      color: colors.red,
      marginTop: '4px',
      display: 'block',
    },
    submitButton: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: colors.midnight,
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '8px',
      fontFamily: 'inherit',
    },
    submitButtonHover: {
      opacity: 0.9,
      transform: 'translateY(-1px)',
    },
    submitButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: '20px 0',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: colors.cardBorder,
    },
    dividerText: {
      fontSize: '12px',
      color: colors.textMuted,
      fontWeight: '500',
    },
    googleButton: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.inputBorder}`,
      backgroundColor: colors.card,
      color: colors.text,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'inherit',
    },
    googleButtonHover: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}10`,
    },
    linksContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginTop: '20px',
      fontSize: '13px',
      textAlign: 'center' as const,
    },
    link: {
      color: colors.electric,
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'opacity 0.2s ease',
    },
    linkHover: {
      opacity: 0.8,
    },
    signinText: {
      color: colors.textMuted,
    },
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
        Create account
      </h1>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>
        Join Keipr and simplify your budgeting
      </p>

      {error && <div style={styles.errorMessage as React.CSSProperties}>{error}</div>}

      <form onSubmit={handleEmailSignUp} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="fullname" style={styles.label}>
            Full name
          </label>
          <input
            id="fullname"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting || loading}
            style={styles.input as React.CSSProperties}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => {
              Object.keys(styles.inputFocus).forEach((key) => {
                if (key !== 'borderColor' && key !== 'boxShadow') {
                  delete (e.target.style as any)[key];
                }
              });
            }}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || loading}
            style={styles.input as React.CSSProperties}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => {
              Object.keys(styles.inputFocus).forEach((key) => {
                if (key !== 'borderColor' && key !== 'boxShadow') {
                  delete (e.target.style as any)[key];
                }
              });
            }}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting || loading}
            style={styles.input as React.CSSProperties}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => {
              Object.keys(styles.inputFocus).forEach((key) => {
                if (key !== 'borderColor' && key !== 'boxShadow') {
                  delete (e.target.style as any)[key];
                }
              });
            }}
            required
          />
          <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
            Minimum 6 characters
          </p>
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting || loading}
            style={styles.input as React.CSSProperties}
            onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
            onBlur={(e) => {
              Object.keys(styles.inputFocus).forEach((key) => {
                if (key !== 'borderColor' && key !== 'boxShadow') {
                  delete (e.target.style as any)[key];
                }
              });
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loading}
          style={
            isSubmitting || loading
              ? { ...styles.submitButton, ...styles.submitButtonDisabled }
              : styles.submitButton
          }
          onMouseEnter={(e) => {
            if (!isSubmitting && !loading) {
              Object.assign(e.currentTarget.style, styles.submitButtonHover);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, styles.submitButton);
          }}
        >
          {isSubmitting || loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <div style={styles.dividerText}>Or sign up with</div>
        <div style={styles.dividerLine} />
      </div>

      <button
        onClick={handleGoogleSignUp}
        disabled={isSubmitting || loading}
        style={
          isSubmitting || loading
            ? { ...styles.googleButton, opacity: 0.5, cursor: 'not-allowed' }
            : styles.googleButton
        }
        onMouseEnter={(e) => {
          if (!isSubmitting && !loading) {
            Object.assign(e.currentTarget.style, styles.googleButtonHover);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, styles.googleButton);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isSubmitting || loading ? 'Creating account...' : 'Sign up with Google'}
      </button>

      <div style={styles.linksContainer}>
        <div>
          <span style={{ ...styles.signinText }}>Already have an account? </span>
          <Link href="/auth/login" style={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
