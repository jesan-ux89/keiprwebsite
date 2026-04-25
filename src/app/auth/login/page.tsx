'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function checkTotpAndNavigate(userEmail: string) {
    try {
      const res = await authAPI.me();
      const userData = res.data?.user || res.data;
      if (userData?.totp_enabled) {
        router.push(`/auth/totp-verify?email=${encodeURIComponent(userEmail)}`);
        return;
      }
    } catch {
      // If the TOTP check fails, continue to the app and let the API guard handle access.
    }
    router.push('/app');
  }

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      await checkTotpAndNavigate(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      const { auth: firebaseAuth } = await import('@/lib/firebase');
      const userEmail = firebaseAuth.currentUser?.email || '';
      await checkTotpAndNavigate(userEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || loading;

  return (
    <main className="loginPage">
      <style>{`
        .loginPage {
          min-height: 100vh;
          color: #fff8ef;
          background:
            radial-gradient(circle at 18% 12%, rgba(53, 195, 245, 0.18), transparent 32rem),
            radial-gradient(circle at 78% 86%, rgba(13, 148, 136, 0.16), transparent 30rem),
            linear-gradient(135deg, #0f0d0b 0%, #17120f 54%, #11100d 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .loginShell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(430px, 520px);
          gap: 52px;
          align-items: center;
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
          padding: 44px 0;
        }

        .brand {
          display: inline-block;
          margin-bottom: 48px;
          font-size: clamp(60px, 8vw, 104px);
          line-height: 0.9;
          font-weight: 950;
          letter-spacing: -0.075em;
          color: #fff8ef;
          text-decoration: none;
        }

        .wordmark {
          display: inline-block;
          position: relative;
          padding-bottom: 0.16em;
        }

        .wordmark::after {
          content: "";
          position: absolute;
          left: 0.95em;
          right: 0.06em;
          bottom: 0;
          height: 0.045em;
          min-height: 4px;
          border-radius: 999px;
          background: #35c3f5;
          box-shadow: 0 0 24px rgba(53, 195, 245, 0.25);
        }

        .wordmarkK {
          color: #35c3f5;
          letter-spacing: -0.12em;
        }

        .story {
          max-width: 650px;
        }

        .story h1 {
          margin: 0;
          max-width: 680px;
          font-size: clamp(48px, 6vw, 76px);
          line-height: 0.98;
          letter-spacing: -0.065em;
        }

        .storyCopy {
          margin: 20px 0 28px;
          max-width: 580px;
          color: #b4aba0;
          font-size: 20px;
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

        .updated {
          color: #8f867c;
          font-size: 14px;
          font-weight: 750;
        }

        .previewGrid {
          display: grid;
          grid-template-columns: 1fr 0.9fr;
          gap: 16px;
        }

        .availableCard {
          min-height: 214px;
          border-radius: 24px;
          padding: 24px;
          background:
            linear-gradient(135deg, rgba(53, 195, 245, 0.19), transparent 52%),
            rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 248, 239, 0.11);
        }

        .label {
          color: #8f867c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .bigMoney {
          margin: 10px 0 18px;
          color: #44c7f4;
          font-size: 58px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .smallLine {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
          border-top: 1px solid rgba(255, 248, 239, 0.11);
          color: #b4aba0;
          font-weight: 750;
        }

        .smallLine strong {
          color: #fff8ef;
        }

        .tracker {
          display: grid;
          gap: 10px;
        }

        .trackerRow {
          display: grid;
          grid-template-columns: 34px 1fr auto;
          gap: 10px;
          align-items: center;
          border-radius: 18px;
          padding: 13px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 248, 239, 0.11);
        }

        .check {
          width: 34px;
          height: 34px;
          border-radius: 99px;
          display: grid;
          place-items: center;
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
          font-weight: 950;
        }

        .trackerRow b {
          display: block;
          color: #fff8ef;
          line-height: 1.2;
        }

        .trackerRow small {
          display: block;
          color: #8f867c;
          margin-top: 3px;
        }

        .loginCard {
          position: relative;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
            #1f1b16;
          border: 1px solid rgba(255, 248, 239, 0.11);
          border-radius: 32px;
          padding: 34px;
          box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38);
          overflow: hidden;
        }

        .loginCard::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 32px;
          pointer-events: none;
          background:
            radial-gradient(circle at 12% 0%, rgba(53, 195, 245, 0.12), transparent 44%),
            radial-gradient(circle at 90% 110%, rgba(13, 148, 136, 0.11), transparent 45%);
        }

        .loginCard > * {
          position: relative;
          z-index: 1;
        }

        .loginHead {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 26px;
        }

        .loginHead h2 {
          margin: 0 0 8px;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .loginHead p {
          margin: 0;
          color: #b4aba0;
          line-height: 1.45;
        }

        .securePill {
          flex: 0 0 auto;
          border-radius: 999px;
          padding: 9px 12px;
          background: rgba(52, 211, 153, 0.1);
          color: #8df2c4;
          border: 1px solid rgba(52, 211, 153, 0.18);
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .googleButton {
          width: 100%;
          height: 54px;
          border: 1px solid rgba(255, 248, 239, 0.11);
          background: rgba(255, 255, 255, 0.08);
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
          border-color: rgba(53, 195, 245, 0.45);
          background: rgba(53, 195, 245, 0.08);
        }

        .googleButton:disabled,
        .submitButton:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

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

        .divider::before,
        .divider::after {
          content: "";
          height: 1px;
          background: rgba(255, 248, 239, 0.11);
        }

        .formGroup {
          margin-bottom: 16px;
        }

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
          border: 1px solid rgba(255, 248, 239, 0.11);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.065);
          color: #fff8ef;
          padding: 0 15px;
          font: inherit;
          font-size: 15px;
          outline: none;
          transition: border 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        .input::placeholder {
          color: #80766b;
        }

        .input:focus {
          border-color: rgba(53, 195, 245, 0.7);
          background: rgba(255, 255, 255, 0.09);
          box-shadow: 0 0 0 4px rgba(53, 195, 245, 0.12);
        }

        .formMeta {
          display: flex;
          justify-content: flex-end;
          margin: -2px 0 18px;
          font-size: 14px;
        }

        .formMeta a,
        .createAccount a {
          color: #6bd8ff;
          font-weight: 850;
          text-decoration: none;
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
          box-shadow: 0 18px 38px rgba(53, 195, 245, 0.2);
          transition: transform 160ms ease, box-shadow 160ms ease;
        }

        .submitButton:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 22px 44px rgba(53, 195, 245, 0.24);
        }

        .errorMessage {
          margin: 0 0 18px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.22);
          color: #ffaaa5;
          font-size: 14px;
          line-height: 1.4;
        }

        .security {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin: 24px 0 22px;
        }

        .securityItem {
          min-height: 66px;
          border-radius: 15px;
          padding: 11px 10px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 248, 239, 0.11);
          color: #b4aba0;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 750;
        }

        .securityItem b {
          display: block;
          margin-bottom: 3px;
          color: #fff8ef;
          font-size: 13px;
        }

        .createAccount {
          text-align: center;
          color: #b4aba0;
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 980px) {
          .loginShell {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 24px 0 44px;
          }

          .brand {
            margin-bottom: 28px;
          }

          .story {
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .loginShell {
            width: min(100% - 28px, 1180px);
          }

          .preview {
            display: none;
          }

          .storyCopy {
            font-size: 18px;
          }

          .loginCard {
            padding: 24px;
            border-radius: 24px;
          }

          .loginCard::before {
            border-radius: 24px;
          }

          .loginHead {
            display: block;
          }

          .securePill {
            display: inline-flex;
            margin-top: 14px;
          }

          .security {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="loginShell">
        <section className="story" aria-label="Keipr sign in overview">
          <Link className="brand" href="/" aria-label="Keipr home">
            <span className="wordmark">
              <span className="wordmarkK">K</span>
              <span>eipr</span>
            </span>
          </Link>

          <h1>Pick up right where your paycheck left off.</h1>
          <p className="storyCopy">
            Sign in to see what is safe to spend, which bills are already verified,
            and what still needs attention before payday.
          </p>

          <div className="preview" aria-label="Keipr dashboard preview">
            <div className="previewTop">
              <div className="previewTitle">
                <span className="miniLogo">k</span>
                Ultra Dashboard
              </div>
              <div className="updated">Updated just now</div>
            </div>
            <div className="previewGrid">
              <div className="availableCard">
                <div className="label">Available to spend</div>
                <div className="bigMoney">$1,164.92</div>
                <div className="smallLine">
                  <span>Checking balance</span>
                  <strong>$1,164.92</strong>
                </div>
                <div className="smallLine">
                  <span>This check</span>
                  <strong>$66.82</strong>
                </div>
              </div>
              <div className="tracker">
                <div className="trackerRow">
                  <div className="check">OK</div>
                  <div>
                    <b>Loancare</b>
                    <small>Split verified</small>
                  </div>
                  <strong>$1,624</strong>
                </div>
                <div className="trackerRow">
                  <div className="check">OK</div>
                  <div>
                    <b>Netflix</b>
                    <small>Bank matched</small>
                  </div>
                  <strong>$28</strong>
                </div>
                <div className="trackerRow">
                  <div className="check">OK</div>
                  <div>
                    <b>OpenAI</b>
                    <small>Due this check</small>
                  </div>
                  <strong>$21</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="loginCard" aria-label="Sign in form">
          <div className="loginHead">
            <div>
              <h2>Welcome back</h2>
              <p>Sign in to access your budget, tracker, and connected accounts.</p>
            </div>
            <div className="securePill">Secure</div>
          </div>

          {error && <div className="errorMessage">{error}</div>}

          <button
            className="googleButton"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            <GoogleIcon />
            {busy ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="divider">or use email</div>

          <form onSubmit={handleEmailSignIn}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="formMeta">
              <Link href="/auth/forgot-password">Forgot password?</Link>
            </div>

            <button className="submitButton" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in to Keipr'}
            </button>
          </form>

          <div className="security">
            <div className="securityItem">
              <b>Plaid</b>
              Bank login is handled securely through Plaid.
            </div>
            <div className="securityItem">
              <b>2FA</b>
              Supports additional verification when enabled.
            </div>
            <div className="securityItem">
              <b>Private</b>
              Your financial data stays tied to your account.
            </div>
          </div>

          <p className="createAccount">
            New to Keipr? <Link href="/auth/signup">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
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
