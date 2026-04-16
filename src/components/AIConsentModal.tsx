'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { aiAPI } from '@/lib/api';

interface AIConsentModalProps {
  onClose: () => void;
  onConsent: () => void;
}

export default function AIConsentModal({ onClose, onConsent }: AIConsentModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    try {
      setLoading(true);
      await aiAPI.acceptConsent(1); // Phase 0: version 1
      onConsent();
    } catch (err) {
      setError('Failed to accept consent');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div style={{ maxWidth: '480px' }}>
        <h2
          style={{
            margin: '0 0 1rem 0',
            fontSize: '1.15rem',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          Try the AI Assistant?
        </h2>

        <p style={{ color: colors.textFaint, lineHeight: 1.6, marginBottom: '1rem' }}>
          Keipr's AI can audit automated decisions like which paycheck a bill belongs to and flag unusual
          categorizations.
        </p>

        <div
          style={{
            backgroundColor: colors.cardBg,
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 500, color: colors.text }}>
            What this means for your data:
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: colors.textFaint,
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            <li>
              Bill names, amounts, and categories are sent to Anthropic (our AI provider) for processing
              only — not training.
            </li>
            <li>Your name, email, account numbers, and bank login are never sent.</li>
            <li>Anthropic deletes the request after processing (zero-retention endpoint).</li>
            <li>You can turn this off anytime in Settings.</li>
          </ul>
        </div>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '0.5rem',
              color: '#991B1B',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <Link
          href="/app/settings/ai/details"
          style={{
            display: 'inline-block',
            marginBottom: '1rem',
            color: colors.electric,
            fontSize: '0.9rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Read the full privacy details
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Not now
          </Button>
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? 'Accepting...' : 'Turn on AI'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
