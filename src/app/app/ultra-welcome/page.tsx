'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import {
  BarChart3,
  Landmark,
  CreditCard,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';

export default function UltraWelcomePage() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const features = [
    {
      icon: BarChart3,
      title: 'Bills is now Budget',
      description: 'Same bills, plus spending progress bars so you can see how much you\'ve spent vs. your budget',
      emoji: '📊',
    },
    {
      icon: Landmark,
      title: 'New Accounts tab',
      description: 'Manage your connected bank accounts in one place. Add, remove, or sync whenever you need to',
      emoji: '🏦',
    },
    {
      icon: CreditCard,
      title: 'New Spending tab',
      description: 'See all your transactions directly from the bank. Filter, categorize, and stay in control',
      emoji: '💳',
    },
    {
      icon: CheckCircle2,
      title: 'Smart Tracker',
      description: 'Bills matched to bank transactions are auto-verified. Look for the 🏦 badge',
      emoji: '✓',
    },
    {
      icon: Calendar,
      title: 'Plan moves into Budget',
      description: 'Forward planning is now part of your Budget tab — everything in one place',
      emoji: '📅',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        {/* Celebration Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(56,189,248,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '3rem',
            }}
          >
            <Zap size={48} style={{ color: colors.electric }} />
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 0.5rem 0',
            }}
          >
            Welcome to Ultra!
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: colors.textMuted,
              margin: '0 0 2rem 0',
              lineHeight: 1.5,
            }}
          >
            Your budgeting experience has evolved. Discover what's new.
          </p>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: colors.card,
                  borderRadius: '0.75rem',
                  border: `0.5px solid ${colors.cardBorder}`,
                  display: 'flex',
                  gap: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.75rem',
                    backgroundColor: isDark
                      ? 'rgba(56,189,248,0.12)'
                      : 'rgba(56,189,248,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    flexShrink: 0,
                  }}
                >
                  {feature.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: colors.text,
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    {feature.title.split(' ').map((word, i) => {
                      // Highlight key words
                      if (['Budget', 'Accounts', 'Spending', 'Tracker', 'Plan'].includes(word)) {
                        return (
                          <span key={i} style={{ color: colors.electric, fontWeight: 700 }}>
                            {word}{' '}
                          </span>
                        );
                      }
                      return word + ' ';
                    })}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: colors.textSub,
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.push('/app')}
          style={{
            width: '100%',
            fontSize: '1rem',
            fontWeight: 600,
            padding: '0.875rem 1.5rem',
          }}
        >
          Let's Get Started →
        </Button>
      </div>
    </div>
  );
}
