'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

function SetupChoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, isDark } = useTheme();

  const schedule = searchParams.get('schedule') || '';
  const amount = searchParams.get('amount') || '';
  const nickname = searchParams.get('nickname') || '';
  const nextPayday = searchParams.get('nextPayday') || '';

  const queryParams = `schedule=${schedule}&amount=${amount}&nickname=${nickname}&nextPayday=${nextPayday}`;

  const handleManualEntry = () => {
    router.push(`/onboarding/first-bill?${queryParams}`);
  };

  const handleBankImport = () => {
    router.push(`/onboarding/bank-import?${queryParams}`);
  };

  const handleBack = () => {
    router.push(`/onboarding/income?schedule=${schedule}`);
  };

  // Shared palette
  const electric = isDark ? '#38BDF8' : '#0C4A6E';
  const green = isDark ? '#34D399' : '#0A7B6C';
  const purple = isDark ? '#9C5EFA' : '#7846C8';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', maxWidth: 500, width: '100%', margin: '0 auto 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <a
            style={{ color: electric, textDecoration: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onClick={handleBack}
          >
            ← Back
          </a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: electric, opacity: 0.8 }}>Choose your plan</span>
          <span style={{ fontSize: 11, color: colors.textMuted }}>3 / 5</span>
        </div>
        <div style={{
          height: 3,
          backgroundColor: colors.progressTrack || colors.cardBorder,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: '50%', backgroundColor: electric, borderRadius: 2 }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 500, width: '100%', margin: '0 auto' }}>
        {/* USP Heading */}
        <h1 style={{
          fontSize: 24, fontWeight: 700, color: colors.text,
          lineHeight: 1.3, marginBottom: 6, marginTop: 0,
        }}>
          See what's due every paycheck — not just every month.
        </h1>
        <p style={{
          fontSize: 13, color: colors.textMuted, lineHeight: 1.5, marginBottom: 24, marginTop: 0,
        }}>
          No matter how you get paid — weekly, biweekly, or monthly — see exactly what's due each check.
        </p>

        {/* Manual Section Label */}
        <div style={{
          fontSize: 9, fontWeight: 700, color: colors.textMuted,
          letterSpacing: 1.2, marginBottom: 10,
        }}>
          ✏️  I'LL ENTER MY EXPENSES MYSELF
        </div>

        {/* Manual Row: Free + Pro side by side */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {/* Free Card */}
          <div
            onClick={handleManualEntry}
            style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(232,229,220,0.04)' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(232,229,220,0.1)' : '#e0ddd6'}`,
              borderRadius: 12, padding: 14, cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 2 }}>Free</div>
            <div style={{ fontSize: 11, color: green, fontWeight: 600, marginBottom: 10 }}>$0 forever</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
              1 income<br />1 paycheck split<br />1 month planning
            </div>
            <div style={{
              backgroundColor: isDark ? 'rgba(232,229,220,0.06)' : '#F0EDE6',
              borderRadius: 8, padding: '9px 0', textAlign: 'center', marginTop: 12,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>Start free</span>
            </div>
          </div>

          {/* Pro Card */}
          <div
            onClick={handleManualEntry}
            style={{
              flex: 1,
              backgroundColor: isDark ? 'rgba(10,123,108,0.06)' : 'rgba(10,123,108,0.04)',
              border: `1px solid rgba(10,123,108,0.25)`,
              borderRadius: 12, padding: 14, cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: green, marginBottom: 2 }}>Pro</div>
            <div style={{ fontSize: 11, color: green, fontWeight: 600, marginBottom: 10 }}>$7.99/mo</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.6 }}>
              Unlimited splits<br />Unlimited income<br />6-month plan · Export
            </div>
            <div style={{
              backgroundColor: isDark ? 'rgba(10,123,108,0.12)' : 'rgba(10,123,108,0.1)',
              borderRadius: 8, padding: '9px 0', textAlign: 'center', marginTop: 12,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: green }}>Choose Pro</span>
            </div>
          </div>
        </div>

        {/* Automated Section Label */}
        <div style={{
          fontSize: 9, fontWeight: 700,
          color: isDark ? 'rgba(56,189,248,0.5)' : 'rgba(12,74,110,0.4)',
          letterSpacing: 1.2, marginBottom: 10,
        }}>
          🤖  AUTOMATED — WE FIND & TRACK YOUR EXPENSES
        </div>

        {/* Ultra Hero Card */}
        <div
          onClick={handleBankImport}
          style={{
            backgroundColor: isDark
              ? 'rgba(56,189,248,0.06)'
              : 'rgba(12,74,110,0.04)',
            border: `1.5px solid ${isDark ? 'rgba(56,189,248,0.3)' : 'rgba(12,74,110,0.25)'}`,
            borderRadius: 16, padding: 18, cursor: 'pointer', position: 'relative',
            transition: 'transform 0.15s ease',
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(12,74,110,0.08)',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {/* RECOMMENDED badge */}
          <div style={{
            position: 'absolute', top: -9, right: 16,
            background: isDark
              ? 'linear-gradient(90deg, #38BDF8, #9C5EFA)'
              : 'linear-gradient(90deg, #0C4A6E, #7846C8)',
            color: '#fff', fontSize: 8, fontWeight: 700,
            padding: '3px 10px', borderRadius: 10, letterSpacing: 0.3,
          }}>
            RECOMMENDED
          </div>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, marginTop: 2 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: isDark ? 'rgba(56,189,248,0.12)' : 'rgba(12,74,110,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              flexShrink: 0,
            }}>
              🏦
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: electric }}>Ultra</span>
                <span style={{ fontSize: 11, color: electric, fontWeight: 600 }}>$11.99/mo</span>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 500,
                color: isDark ? 'rgba(56,189,248,0.8)' : 'rgba(12,74,110,0.7)',
                marginTop: 1,
              }}>
                Your budget runs itself.
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 12,
            color: isDark ? 'rgba(56,189,248,0.7)' : 'rgba(12,74,110,0.6)',
            lineHeight: 1.5, marginBottom: 14, marginTop: 0,
          }}>
            Everything in Pro. Connect your bank — expenses found automatically, payments verified, live balances & spending insights.
          </p>

          {/* AI Accountant callout */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            backgroundColor: isDark ? 'rgba(156,94,250,0.08)' : 'rgba(120,70,200,0.06)',
            border: `1px solid ${isDark ? 'rgba(156,94,250,0.2)' : 'rgba(120,70,200,0.18)'}`,
            borderRadius: 10, padding: '11px 12px', marginBottom: 14,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              backgroundColor: isDark ? 'rgba(156,94,250,0.12)' : 'rgba(120,70,200,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              ✨
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: purple, marginBottom: 2 }}>AI Accountant</div>
              <div style={{ fontSize: 10.5, color: colors.textMuted, lineHeight: 1.4 }}>
                Automatically categorizes your expenses, spots duplicates, and optimizes your paycheck splits.
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{
            backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(12,74,110,0.1)',
            borderRadius: 10, padding: '12px 0', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: electric }}>Start free trial →</div>
            <div style={{
              fontSize: 10,
              color: isDark ? 'rgba(56,189,248,0.5)' : 'rgba(12,74,110,0.4)',
              marginTop: 3,
            }}>
              7 days free · cancel anytime
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 11, color: colors.textMuted, textAlign: 'center',
          marginTop: 18, lineHeight: 1.5, padding: '0 20px',
        }}>
          Bank import uses 256-bit encryption via Plaid.<br />We never see your login credentials.
        </div>
      </div>
    </div>
  );
}

export default function SetupChoicePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', backgroundColor: '#1A1814' }} />
      }
    >
      <SetupChoiceContent />
    </Suspense>
  );
}
