'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface StagingChainAnchorModalProps {
  chainId: string;
  chainName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function StagingChainAnchorModal({
  chainId,
  chainName,
  onClose,
  onComplete,
}: StagingChainAnchorModalProps) {
  const { colors } = useTheme();
  const [position, setPosition] = useState<string>('between_fulfillments');
  const [manualAmount, setManualAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload =
        position === 'manual'
          ? {
              position: 'manual',
              staged_amount: parseFloat(manualAmount),
            }
          : {
              position,
            };

      await aiAPI.anchorStagingChain(chainId, payload);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set initial balance');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div style={{ maxWidth: '500px' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.text, fontSize: '1.1rem', fontWeight: 600 }}>
          Set Initial Balance for {chainName}
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', color: colors.textFaint, lineHeight: 1.5 }}>
          Where are you in the savings cycle?
        </p>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '0.375rem',
              color: '#991B1B',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Option 1: Between fulfillments */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            marginBottom: '0.75rem',
            backgroundColor: colors.cardBg,
            border: position === 'between_fulfillments' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="position"
            value="between_fulfillments"
            checked={position === 'between_fulfillments'}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginTop: '0.25rem', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: colors.text }}>
              I'm between fulfillments
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textFaint }}>
              The current balance will mostly fund the next payment
            </p>
          </div>
        </label>

        {/* Option 2: Just paid */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            marginBottom: '0.75rem',
            backgroundColor: colors.cardBg,
            border: position === 'just_paid' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="position"
            value="just_paid"
            checked={position === 'just_paid'}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginTop: '0.25rem', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: colors.text }}>
              I just paid
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textFaint }}>
              The current balance is for something else, not this savings goal
            </p>
          </div>
        </label>

        {/* Option 3: One ahead */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            marginBottom: '0.75rem',
            backgroundColor: colors.cardBg,
            border: position === 'one_ahead' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="position"
            value="one_ahead"
            checked={position === 'one_ahead'}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginTop: '0.25rem', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 500, color: colors.text }}>
              I'm one contribution ahead
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textFaint }}>
              I've already saved more than the minimum needed for the next payment
            </p>
          </div>
        </label>

        {/* Option 4: Manual amount */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: colors.cardBg,
            border: position === 'manual' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
            borderRadius: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="radio"
            name="position"
            value="manual"
            checked={position === 'manual'}
            onChange={(e) => setPosition(e.target.value)}
            style={{ marginTop: '0.25rem', cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: colors.text }}>
              Set amount staged manually
            </p>
            <input
              type="number"
              placeholder="Amount staged for this goal"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              disabled={position !== 'manual'}
              step="0.01"
              min="0"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.375rem',
                backgroundColor: colors.card,
                color: colors.text,
                fontSize: '0.9rem',
              }}
            />
          </div>
        </label>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (position === 'manual' && !manualAmount)}
          >
            {submitting ? 'Setting...' : 'Continue'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
