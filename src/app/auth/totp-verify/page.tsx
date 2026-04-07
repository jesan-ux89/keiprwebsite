'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { authAPI } from '@/lib/api';

export default function TOTPVerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading...</div>}>
      <TOTPVerifyContent />
    </Suspense>
  );
}

function TOTPVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (failedAttempts >= 5) {
      setError('Too many failed attempts. Please sign in again.');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.totpVerify(email, code);
      if (res.data.success) {
        router.push('/app');
      }
    } catch (err: any) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setError('Too many failed attempts. Please sign in again.');
      } else {
        setError(err?.response?.data?.error || `Invalid code. (${5 - newAttempts} attempts remaining)`);
      }
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleRecoveryVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = recoveryCode.trim();
    if (!trimmed || trimmed.length < 6) {
      setError('Please enter a valid recovery code.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.totpVerifyRecovery(email, trimmed);
      if (res.data.success) {
        router.push('/app');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid recovery code.');
      setRecoveryCode('');
    } finally {
      setLoading(false);
    }
  }

  // Countdown timer for email OTP
  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setInterval(() => setEmailCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);

  function formatCountdown() {
    const m = Math.floor(emailCountdown / 60);
    const s = emailCountdown % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function handleSendEmailCode() {
    setSendingEmail(true);
    setError('');
    try {
      await authAPI.sendMfaCode(email);
      setEmailCodeSent(true);
      setEmailCountdown(600);
      setInfoMessage(`Code sent to ${email}`);
    } catch {
      setError('Could not send email code. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleEmailOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (emailCode.length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    if (emailCountdown <= 0) {
      setError('Your code has expired. Please request a new one.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyMfaCode(email, emailCode);
      if (res.data.valid) {
        router.push('/app');
      } else {
        setError('Invalid code. Please try again.');
        setEmailCode('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not verify code.');
      setEmailCode('');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.inputBg,
    color: colors.text,
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: '8px',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: colors.midnight,
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    fontFamily: 'inherit',
  };

  // Email OTP fallback mode
  if (showEmailOtp) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
            Email verification
          </h1>
          <p style={{ fontSize: '14px', color: colors.textMuted, lineHeight: '1.5' }}>
            {emailCodeSent
              ? <>We sent a 6-digit code to <span style={{ color: colors.electric, fontWeight: '500' }}>{email}</span></>
              : "We'll send a verification code to your email."}
          </p>
        </div>

        {infoMessage && (
          <div style={{ backgroundColor: `${colors.electric}15`, borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: colors.electric }}>
            {infoMessage}
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: `${colors.red}15`, borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: colors.red }}>
            {error}
          </div>
        )}

        {!emailCodeSent ? (
          <button
            onClick={handleSendEmailCode}
            disabled={sendingEmail}
            style={{ ...btnStyle, opacity: sendingEmail ? 0.6 : 1 }}
          >
            {sendingEmail ? 'Sending...' : 'Send email code'}
          </button>
        ) : (
          <form onSubmit={handleEmailOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="text"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                style={inputStyle}
              />
              <p style={{ fontSize: '12px', color: emailCountdown < 60 ? colors.red : colors.textMuted, textAlign: 'center', marginTop: '8px' }}>
                {emailCountdown > 0 ? `Code expires in ${formatCountdown()}` : 'Code expired'}
              </p>
            </div>
            <button type="submit" disabled={loading || emailCode.length !== 6} style={{ ...btnStyle, opacity: (loading || emailCode.length !== 6) ? 0.6 : 1 }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { handleSendEmailCode(); setEmailCode(''); }}
                disabled={sendingEmail}
                style={{ background: 'none', border: 'none', color: colors.electric, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => { setShowEmailOtp(false); setError(''); setInfoMessage(''); setEmailCode(''); }}
            style={{ background: 'none', border: 'none', color: colors.electric, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Use authenticator app instead
          </button>
        </div>
      </div>
    );
  }

  // Recovery code mode
  if (showRecovery) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
            Use a recovery code
          </h1>
          <p style={{ fontSize: '14px', color: colors.textMuted, lineHeight: '1.5' }}>
            Enter one of the recovery codes you saved when you set up your authenticator app.
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: `${colors.red}15`, borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: colors.red }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRecoveryVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXX"
            maxLength={12}
            autoFocus
            style={{ ...inputStyle, fontSize: '18px', letterSpacing: '3px' }}
          />
          <button type="submit" disabled={loading || !recoveryCode.trim()} style={btnStyle}>
            {loading ? 'Verifying...' : 'Verify recovery code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => { setShowRecovery(false); setError(''); setRecoveryCode(''); }}
            style={{ background: 'none', border: 'none', color: colors.electric, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Use authenticator app instead
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>Lost your recovery codes too?</p>
          <a
            href="mailto:contact@keipr.app?subject=Account recovery"
            style={{ fontSize: '13px', color: colors.electric, fontWeight: '500', textDecoration: 'none' }}
          >
            Contact contact@keipr.app
          </a>
        </div>
      </div>
    );
  }

  // Default: TOTP code mode
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: colors.text, marginBottom: '8px' }}>
          Authenticator verification
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, lineHeight: '1.5' }}>
          Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: `${colors.red}15`, borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: colors.red }}>
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
          style={inputStyle}
        />
        <button type="submit" disabled={loading || code.length !== 6 || failedAttempts >= 5} style={btnStyle}>
          {loading ? 'Verifying...' : failedAttempts >= 5 ? 'Too many attempts' : 'Verify'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          onClick={() => { setShowEmailOtp(true); setError(''); }}
          style={{ background: 'none', border: 'none', color: colors.electric, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Use email code instead
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <button
          onClick={() => { setShowRecovery(true); setError(''); }}
          style={{ background: 'none', border: 'none', color: colors.electric, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Lost your authenticator? Use a recovery code
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <button
          onClick={() => router.push('/auth/login')}
          style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}
