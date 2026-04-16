'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function AIHistoryPage() {
  const { colors } = useTheme();

  return (
    <AppLayout pageTitle="My AI history">
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

        {/* Empty state */}
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: colors.textFaint,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2
            style={{
              fontSize: '1.1rem',
              fontWeight: 500,
              color: colors.text,
              marginBottom: '0.5rem',
            }}
          >
            Your AI history will appear here
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            Once the AI assistant begins auditing your data, you'll see a detailed history of all corrections
            and changes it makes.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
