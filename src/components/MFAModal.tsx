'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { authAPI } from '@/lib/api';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  email: string;
}

export default function MFAModal({ isOpen, onClose, onVerified, email }: MFAModalProps) {
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer on mount
  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(300);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      await authAPI.verifyMfaCode(email, code);
      onVerified();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid code';
      setError(errorMessage);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsResending(true);

    try {
      await authAPI.sendMfaCode(email);
      setCode('');
      setTimeLeft(300);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      inputRef.current?.focus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: colors.card,
      borderRadius: '12px',
      border: `1px solid ${colors.cardBorder}`,
      padding: '32px',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: colors.text,
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '13px',
      color: colors.textMuted,
      marginBottom: '24px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    codeInput: {
      width: '100%',
      padding: '12px',
      fontSize: '32px',
      letterSpacing: '12px',
      textAlign: 'center' as const,
      borderRadius: '8px',
      border: `2px solid ${colors.inputBorder}`,
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontFamily: 'monospace',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    codeInputFocus: {
      borderColor: colors.electric,
      boxShadow: `0 0 0 3px ${colors.electric}20`,
    },
    errorMessage: {
      fontSize: '13px',
      color: colors.red,
      padding: '10px 12px',
      backgroundColor: `${colors.red}15`,
      borderRadius: '6px',
      border: `1px solid ${colors.red}30`,
    },
    timerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
    },
    timer: {
      color: timeLeft < 60 ? colors.red : colors.textMuted,
      fontWeight: '500',
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
    resendButton: {
      padding: '8px 0',
      background: 'none',
      border: 'none',
      color: colors.electric,
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      fontFamily: 'inherit',
      textDecoration: 'underline',
    },
    resendButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    cancelButton: {
      padding: '8px 0',
      background: 'none',
      border: 'none',
      color: colors.textMuted,
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease',
      fontFamily: 'inherit',
    },
    cancelButtonHover: {
      opacity: 0.7,
    },
    bottomLinks: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: `1px solid ${colors.cardBorder}`,
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Verify your identity</h2>
        <p style={styles.subtitle}>
          We've sent a 6-digit code to <strong>{email}</strong>
        </p>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleVerify} style={styles.form}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
              setCode(val);
              if (val.length === 6) {
                setTimeout(() => {
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }, 100);
              }
            }}
            disabled={isSubmitting}
            style={styles.codeInput as React.CSSProperties}
            onFocus={(e) => Object.assign(e.target.style, styles.codeInputFocus)}
            onBlur={(e) => {
              Object.keys(styles.codeInputFocus).forEach((key) => {
                if (key !== 'borderColor' && key !== 'boxShadow') {
                  delete (e.target.style as any)[key];
                }
              });
            }}
            required
          />

          <div style={styles.timerContainer}>
            <span style={styles.timer}>Code expires in {formatTime(timeLeft)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            style={
              isSubmitting || code.length !== 6
                ? { ...styles.submitButton, ...styles.submitButtonDisabled }
                : styles.submitButton
            }
            onMouseEnter={(e) => {
              if (!isSubmitting && code.length === 6) {
                Object.assign(e.currentTarget.style, styles.submitButtonHover);
              }
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, styles.submitButton);
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div style={styles.bottomLinks}>
          <button
            onClick={handleResend}
            disabled={isResending || timeLeft === 0}
            style={
              isResending || timeLeft === 0
                ? { ...styles.resendButton, ...styles.resendButtonDisabled }
                : styles.resendButton
            }
            onMouseEnter={(e) => {
              if (!isResending && timeLeft > 0) {
                Object.assign(e.currentTarget.style, { opacity: 0.8 });
              }
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, styles.resendButton);
            }}
          >
            {isResending ? 'Sending...' : 'Resend code'}
          </button>

          <button
            onClick={onClose}
            style={styles.cancelButton}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cancelButtonHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.cancelButton)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
