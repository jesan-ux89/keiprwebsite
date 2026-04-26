'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LandingStyles from '@/components/landing/LandingStyles';
import LandingNav from '@/components/landing/LandingNav';

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, loading } = useAuth();

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

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, fullName);
      router.push('/onboarding/pay-schedule');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push('/onboarding/pay-schedule');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || loading;

  return (
    <div className="landingRoot">
      <LandingStyles />
      <LandingNav />

      <main className="loginPage">
        <style>{`
          .loginPage {
            color: #fff8ef;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .loginShell {
            min-height: calc(100vh - 132px);
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(430px, 520px);
            gap: 52px;
            align-items: center;
            width: min(1180px, calc(100% - 40px));
            margin: 0 auto;
            padding: 36px 0 56px;
          }

          .story { max-width: 650px; }
          .story h1 {
            margin: 0;
            max-width: 640px;
            font-size: clamp(28px, 3vw, 42px);
            line-height: 1.08;
            letter-spacing: -0.04em;
            font-weight: 900;
          }
          .story h1 em { color: #35c3f5; font-style: normal; }
          .storyCopy {
            margin: 16px 0 28px;
            max-width: 580px;
            color: #b4aba0;
            font-size: 17px;
            line-height: 1.55;
          }

          .preview {
            max-width: 620px;
            border-radius: 30px;
            padding: 22px;
            background:
              linear-gradient(135deg, rgba(53, 195, 245, 0.1), transparent 44%),
              #17130f;
            color: #fff8ef;
            box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
            border: 1px solid rgba(255, 248, 239, 0.11);
          }
          .previewTop {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 22px;
          }
          .previewTitle {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 900;
          }
          .miniLogo {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            background: rgba(53, 195, 245, 0.14);
            display: grid;
            place-items: center;
            color: #9be7ff;
            font-weight: 950;
          }
          .updated { color: #8f867c; font-size: 14px; font-weight: 750; }

          .perksGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .perkCard {
            border-radius: 18px;
            padding: 16px;
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,248,239,0.11);
          }
          .perkLabel {
            font-size: 11px;
            font-weight: 950;
            color: #8f867c;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            margin: 0 0 8px;
          }
          .perkTitle {
            font-size: 16px;
            font-weight: 850;
            color: #fff4e7;
            margin: 0 0 4px;
            letter-spacing: -0.02em;
          }
          .perkDetail {
            font-size: 13px;
            color: #b4aba0;
            line-height: 1.45;
            margin: 0;
          }
          .perkAccent { color: #34d399; }
          .perkAccentBlue { color: #44c7f4; }
          .perkAccentGold { color: #ffd684; }

          .loginCard {
            position: relative;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
              #1f1b16;
            border: 1px solid rgba(255,248,239,0.11);
            border-radius: 32px;
            padding: 34px;
            box-shadow: 0 32px 90px rgba(0,0,0,0.38);
            overflow: hidden;
          }
          .loginCard::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 32px;
            pointer-events: none;
            background:
              radial-gradient(circle at 12% 0%, rgba(53,195,245,0.12), transparent 44%),
              radial-gradient(circle at 90% 110%, rgba(13,148,136,0.11), transparent 45%);
          }
          .loginCard > * { position: relative; z-index: 1; }
          .loginHead {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 26px;
          }
          .loginHead h2 {
            margin: 0 0 8px;
            font-size: 30px;
            line-height: 1.05;
            letter-spacing: -0.04em;
          }
          .loginHead p { margin: 0; color: #b4aba0; line-height: 1.45; }
          .freePill {
            flex: 0 0 auto;
            border-radius: 999px;
            padding: 9px 12px;
            background: rgba(53,195,245,0.12);
            color: #9be7ff;
            border: 1px solid rgba(53,195,245,0.32);
            font-weight: 900;
            font-size: 12px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .googleButton {
            width: 100%;
            height: 54px;
            border: 1px solid rgba(255,248,239,0.11);
            background: rgba(255,255,255,0.08);
            border-radius: 16px;
            color: #fff8ef;
            font: inherit;
            font-weight: 850;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            cursor: pointer;
            transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
          }
          .googleButton:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: rgba(53,195,245,0.45);
            background: rgba(53,195,245,0.08);
          }
          .googleButton:disabled,
          .submitButton:disabled { cursor: not-allowed; opacity: 0.58; }

          .divider {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 12px;
            align-items: center;
            margin: 24px 0;
            color: #8f867c;
            font-size: 13px;
            font-weight: 750;
          }
          .divider::before, .divider::after {
            content: "";
            height: 1px;
            background: rgba(255,248,239,0.11);
          }

          .formGroup { margin-bottom: 16px; }
          .formGroup label {
            display: block;
            margin-bottom: 7px;
            color: #e4dbce;
            font-size: 14px;
            font-weight: 850;
          }
          .input {
            width: 100%;
            height: 54px;
            border: 1px solid rgba(255,248,239,0.11);
            border-radius: 16px;
            background: rgba(255,255,255,0.065);
            color: #fff8ef;
            padding: 0 15px;
            font: inherit;
            font-size: 15px;
            outline: none;
            transition: border 160ms ease, box-shadow 160ms ease, background 160ms ease;
          }
          .input::placeholder { color: #80766b; }
          .input:focus {
            border-color: rgba(53,195,245,0.7);
            background: rgba(255,255,255,0.09);
            box-shadow: 0 0 0 4px rgba(53,195,245,0.12);
          }
          .helperText {
            margin: 6px 0 0;
            color: #8f867c;
            font-size: 12.5px;
            font-weight: 600;
          }

          .submitButton {
            width: 100%;
            height: 56px;
            border: 0;
            border-radius: 17px;
            background: #35c3f5;
            color: #06151d;
            font: inherit;
            font-size: 16px;
            font-weight: 950;
            cursor: pointer;
            box-shadow: 0 18px 38px rgba(53,195,245,0.2);
            transition: transform 160ms ease, box-shadow 160ms ease;
          }
          .submitButton:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 22px 44px rgba(53,195,245,0.24);
          }

          .errorMessage {
            margin: 0 0 18px;
            padding: 12px 14px;
            border-radius: 14px;
            background: rgba(255,107,107,0.1);
            border: 1px solid rgba(255,107,107,0.22);
            color: #ffaaa5;
            font-size: 14px;
            line-height: 1.4;
          }

          .legalCopy {
            margin: 18px 0 0;
            color: #8f867c;
            font-size: 12.5px;
            line-height: 1.5;
            text-align: center;
          }
          .legalCopy a { color: #6bd8ff; font-weight: 750; text-decoration: none; }

          .createAccount {
            text-align: center;
            color: #b4aba0;
            font-size: 14px;
            margin: 22px 0 0;
          }
          .createAccount a { color: #6bd8ff; font-weight: 850; text-decoration: none; }

          @media (max-width: 980px) {
            .loginShell {
              grid-template-columns: 1fr;
              gap: 32px;
              padding: 24px 0 44px;
              min-height: 0;
            }
            .story { max-width: none; }
          }
          @media (max-width: 640px) {
            .loginShell { width: min(100% - 28px, 1180px); }
            .preview { display: none; }
            .storyCopy { font-size: 16px; }
            .loginCard { padding: 24px; border-radius: 24px; }
            .loginCard::before { border-radius: 24px; }
            .loginHead { display: block; }
            .freePill { display: inline-flex; margin-top: 14px; }
            .perksGrid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="loginShell">
          <section className="story" aria-label="Why join Keipr">
            <h1>Start your <em>paycheck-first</em> budget in minutes.</h1>
            <p className="storyCopy">
              No credit card. No bank connection required. Just a clear picture of what each
              paycheck can actually cover.
            </p>

            <div className="preview" aria-label="What you get with Keipr">
              <div className="previewTop">
                <div className="previewTitle">
                  <span className="miniLogo">k</span>
                  Keipr starter
                </div>
                <div className="updated">Free forever</div>
              </div>
              <div className="perksGrid">
                <div className="perkCard">
                  <p className="perkLabel">Step 1</p>
                  <p className="perkTitle">Set your pay schedule</p>
                  <p className="perkDetail">Biweekly, weekly, twice monthly, or monthly &mdash; we handle the rest.</p>
                </div>
                <div className="perkCard">
                  <p className="perkLabel">Step 2</p>
                  <p className="perkTitle">Add your bills</p>
                  <p className="perkDetail">Each one auto-assigns to the paycheck that pays it.</p>
                </div>
                <div className="perkCard">
                  <p className="perkLabel">Step 3</p>
                  <p className="perkTitle perkAccent">Split big bills</p>
                  <p className="perkDetail">Mortgage or rent across two paychecks &mdash; no single payday takes the hit.</p>
                </div>
                <div className="perkCard">
                  <p className="perkLabel">Result</p>
                  <p className="perkTitle perkAccentBlue">One safe-to-spend number</p>
                  <p className="perkDetail">Updated as bills land, splits stage, and deposits arrive.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="loginCard" aria-label="Sign up form">
            <div className="loginHead">
              <div>
                <h2>Create your account</h2>
                <p>Free forever. Upgrade anytime if you want forward planning or bank automation.</p>
              </div>
              <div className="freePill">Free</div>
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button
              className="googleButton"
              type="button"
              onClick={handleGoogleSignUp}
              disabled={busy}
            >
              <GoogleIcon />
              {busy ? 'Creating account...' : 'Sign up with Google'}
            </button>

            <div className="divider">or use email</div>

            <form onSubmit={handleEmailSignUp}>
              <div className="formGroup">
                <label htmlFor="fullname">Full name</label>
                <input
                  id="fullname"
                  className="input"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                  required
                />
                <p className="helperText">Minimum 6 characters</p>
              </div>

              <div className="formGroup">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  className="input"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button className="submitButton" type="submit" disabled={busy}>
                {busy ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="legalCopy">
              By creating an account, you agree to our{' '}
              <Link href="/terms">Terms of Service</Link> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <p className="createAccount">
              Already have an account? <Link href="/auth/login">Sign in</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  );
}
