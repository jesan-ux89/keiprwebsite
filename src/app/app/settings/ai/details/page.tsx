'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';

export default function AIDetailsPage() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await aiAPI.getSettings();
      if (res?.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout pageTitle="Privacy & data details">
      <div style={{ maxWidth: '700px', padding: '2rem' }}>
        {/* Back link */}
        <Link
          href="/app/settings/ai"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            color: colors.electric,
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={18} />
          Back to AI Assistant
        </Link>

        {/* Content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* What it does */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              What the AI Assistant does
            </h2>
            <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0 }}>
              Keipr's AI Assistant reads Keipr's automated categorizations and classifications of your
              transactions and bills. It identifies inconsistencies, duplicate bills, and transactions that
              may be assigned to the wrong paycheck. It then applies corrections to your data — you see the
              clean result without approval workflows.
            </p>
          </section>

          {/* What it does NOT do */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              What it does NOT do
            </h2>
            <ul
              style={{
                color: colors.textFaint,
                lineHeight: 1.6,
                margin: 0,
                paddingLeft: '1.5rem',
              }}
            >
              <li>Provide financial, tax, investment, or legal advice</li>
              <li>Recommend financial products (credit cards, loans, investments, accounts)</li>
              <li>Make decisions that affect your access to financial services</li>
              <li>Move money or initiate payments</li>
              <li>Share your data with third parties beyond Anthropic</li>
              <li>Train AI models on your data</li>
              <li>Create a profile about you for marketing or advertising</li>
            </ul>
          </section>

          {/* Data sent */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              What data is sent
            </h2>
            <div style={{ backgroundColor: colors.cardBg, padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0, fontSize: '0.9rem' }}>
                <strong>Sent:</strong> Bill names, amounts, due dates, transaction amounts and dates,
                categories, pay frequency, and internal IDs (opaque UUIDs).
              </p>
            </div>
            <div style={{ backgroundColor: colors.cardBg, padding: '1rem', borderRadius: '0.5rem' }}>
              <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0, fontSize: '0.9rem' }}>
                <strong>Never sent:</strong> Your name, email, phone, address, bank account numbers, card
                numbers, government IDs, credentials, or login information. Employer names that might
                identify you are replaced with a placeholder.
              </p>
            </div>
          </section>

          {/* Processing */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              Who processes your data
            </h2>
            <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0 }}>
              Anthropic processes your data for inference only. Anthropic does not train models on your
              data, does not retain your request after processing, and operates under a zero-retention
              policy. Keipr retains corrections and audit history for 90 days by default, which you can
              adjust in settings.
            </p>
          </section>

          {/* How to turn it off */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              How to turn it off
            </h2>
            <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0 }}>
              Go to Settings → AI Assistant and flip the toggle off. Your data will no longer be sent to
              Anthropic, and within 30 days, your AI history will be deleted.
            </p>
          </section>

          {/* How to delete data */}
          <section>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '1rem',
              }}
            >
              How to delete your AI data
            </h2>
            <p style={{ color: colors.textFaint, lineHeight: 1.6, margin: 0 }}>
              When you delete your Keipr account, all AI-related data (audit runs, corrections, history)
              is permanently deleted. You can also request data deletion anytime through your account
              settings.
            </p>
          </section>

          {/* Consent version */}
          {settings && (
            <div
              style={{
                paddingTop: '2rem',
                borderTop: `1px solid ${colors.divider}`,
                fontSize: '0.8rem',
                color: colors.textFaint,
              }}
            >
              Consent version: {settings.consent_version || 'Not set'}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
