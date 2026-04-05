'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordPage() {
  const { sendPasswordReset, loading } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
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
      padding: '10px 12px',
      backgroundColor: `${colors.red}15`,
      borderRadius: '6px',
      border: `1px solid ${colors.red}30`,
    },
    successMessage: {
      fontSize: '13px',
      color: colors.green,
      marginTop: '4px',
      display: 'block',
      padding: '10px 12px',
      backgroundColor: `${colors.green}15`,
      borderRadius: '6px',
      border: `1px solid ${colors.green}30`,
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
    helpText: {
      fontSize: '13px',
      color: colors.textMuted,
      lineHeight: '1.5',
    },
  };

  if (success) {
    return (
      <div>
        <h1
          style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '16px' }}
        >
          Check your email
        </h1>

        <div
          style={{
            backgroundColor: `${colors.green}15`,
            border: `1px solid ${colors.green}30`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <p style={{ ...styles.helpText, color: colors.green, margin: '0' }}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <p style={styles.helpText}>
          Click the link in the email to reset your password. The link will expire in 1 hour for
          security reasons.
        </p>

        <p style={{ ...styles.helpText, marginTop: '16px' }}>
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.electric,
              cursor: 'pointer',
              fontWeight: '500',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              fontSize: '13px',
              padding: 0,
            }}
          >
            try another email
          </button>
          .
        </p>

        <div style={styles.linksContainer}>
          <Link href="/auth/login" style={styles.link}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
        Forgot password?
      </h1>
      <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '24px' }}>
        Enter your email and we'll send you a link to reset it
      </p>

      {error && <div style={styles.errorMessage as React.CSSProperties}>{error}</div>}

      <form onSubmit={handleSendReset} style={styles.form}>
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
          {isSubmitting || loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div style={styles.linksContainer}>
        <Link href="/auth/login" style={styles.link}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
