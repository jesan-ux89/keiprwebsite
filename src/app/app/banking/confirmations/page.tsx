'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';

interface Confirmation {
  id: string;
  transaction_name: string;
  transaction_amount: number;
  bill_name: string;
  bill_amount: number;
  confidence_score: number;
  transaction_date: string;
}

export default function ConfirmationsPage() {
  const { colors } = useTheme();

  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getConfirmations();
      setConfirmations(Array.isArray(res.data?.confirmations) ? res.data.confirmations : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch confirmations:', err);
      setError('Failed to load pending confirmations');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setActioning(id);
    try {
      await bankingAPI.confirmMatch(id);
      setConfirmations(confirmations.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to confirm match:', err);
      alert('Failed to confirm match');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setActioning(id);
    try {
      await bankingAPI.rejectMatch(id);
      setConfirmations(confirmations.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to reject match:', err);
      alert('Failed to reject match');
    } finally {
      setActioning(null);
    }
  };

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return colors.green;
    if (score >= 0.6) return colors.amber;
    return colors.red;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={18} style={{ color: colors.text }} />
          </Button>
        </Link>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            Pending Confirmations
          </h1>
          <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            Review and confirm transaction-to-bill matches
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card
          style={{
            backgroundColor: colors.red,
            opacity: 0.1,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} style={{ color: colors.red, flexShrink: 0 }} />
          <p style={{ color: colors.red, margin: 0, fontSize: '0.95rem' }}>
            {error}
          </p>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading confirmations...</p>
        </Card>
      ) : confirmations.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: colors.background,
          }}
        >
          <Check size={40} style={{ color: colors.green, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            All caught up!
          </h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            No pending confirmations. All matches have been reviewed.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {confirmations.map((confirmation) => (
            <Card key={confirmation.id}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 0.5rem 0' }}>
                  Transaction
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                      {confirmation.transaction_name}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                      {new Date(confirmation.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                    ${confirmation.transaction_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ paddingBottom: '1rem', marginBottom: '1rem', borderBottom: `1px solid ${colors.divider}` }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 0.5rem 0' }}>
                  Matched Bill
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    {confirmation.bill_name}
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                    ${confirmation.bill_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Confidence:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: colors.background,
                    borderRadius: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: confidenceColor(confirmation.confidence_score),
                    }}
                  />
                  <span style={{ color: confidenceColor(confirmation.confidence_score), fontWeight: 600, fontSize: '0.875rem' }}>
                    {Math.round(confirmation.confidence_score * 100)}%
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleReject(confirmation.id)}
                  loading={actioning === confirmation.id}
                  disabled={actioning !== null}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <X size={18} />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleConfirm(confirmation.id)}
                  loading={actioning === confirmation.id}
                  disabled={actioning !== null}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Check size={18} />
                  Confirm
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
