'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ChevronLeft, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Suggestion {
  id: string;
  merchant_name: string;
  amount: number;
  frequency: string;
  confidence_score: number;
}

export default function SuggestionsPage() {
  const { colors } = useTheme();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [dismissModalOpen, setDismissModalOpen] = useState(false);
  const [dismissType, setDismissType] = useState<'once' | 'merchant'>('once');
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getSuggestions();
      setSuggestions(Array.isArray(res.data?.suggestions) ? res.data.suggestions : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsBill = async (suggestion: Suggestion) => {
    setActioning(true);
    try {
      await bankingAPI.addSuggestion(suggestion.id);
      setSuggestions(suggestions.filter((s) => s.id !== suggestion.id));
      alert('Bill added! Redirecting to edit...');
      // In a real app, you'd navigate to the bill editor with prefill data
    } catch (err) {
      console.error('Failed to add suggestion:', err);
      alert('Failed to add bill');
    } finally {
      setActioning(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedSuggestion) return;

    setActioning(true);
    try {
      await bankingAPI.dismissSuggestion(selectedSuggestion.id, dismissType);
      setSuggestions(suggestions.filter((s) => s.id !== selectedSuggestion.id));
      setSelectedSuggestion(null);
      setDismissModalOpen(false);
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
      alert('Failed to dismiss suggestion');
    } finally {
      setActioning(false);
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
            Bill Suggestions
          </h1>
          <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            Review suggested bills from your transactions
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
          <p style={{ color: colors.textMuted }}>Loading suggestions...</p>
        </Card>
      ) : suggestions.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: colors.background,
          }}
        >
          <AlertCircle size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            No suggestions yet
          </h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            Once you connect your bank and we analyze your transactions, new bill suggestions will appear here.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
                  {suggestion.merchant_name}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>
                      Typical Amount
                    </p>
                    <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
                      ${suggestion.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>
                      Frequency
                    </p>
                    <p style={{ color: colors.text, fontWeight: 600, margin: 0 }}>
                      {suggestion.frequency}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>
                      Confidence
                    </p>
                    <p style={{ color: confidenceColor(suggestion.confidence_score), fontWeight: 600, margin: 0 }}>
                      {Math.round(suggestion.confidence_score * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddAsBill(suggestion)}
                  loading={actioning}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} />
                  Add Bill
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedSuggestion(suggestion);
                    setDismissModalOpen(true);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dismiss Modal */}
      <Modal
        isOpen={dismissModalOpen}
        onClose={() => {
          setDismissModalOpen(false);
          setSelectedSuggestion(null);
        }}
        title="Dismiss Suggestion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: colors.text, margin: 0 }}>
            How would you like to dismiss this suggestion?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: colors.background,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: dismissType === 'once' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
              }}
            >
              <input
                type="radio"
                name="dismissType"
                value="once"
                checked={dismissType === 'once'}
                onChange={(e) => setDismissType('once')}
                style={{ marginRight: '0.75rem', cursor: 'pointer' }}
              />
              <div>
                <p style={{ color: colors.text, fontWeight: 500, margin: 0 }}>Dismiss this suggestion</p>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Hide just this suggestion
                </p>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: colors.background,
                borderRadius: '0.5rem',
                cursor: 'pointer',
                border: dismissType === 'merchant' ? `2px solid ${colors.electric}` : `1px solid ${colors.divider}`,
              }}
            >
              <input
                type="radio"
                name="dismissType"
                value="merchant"
                checked={dismissType === 'merchant'}
                onChange={(e) => setDismissType('merchant')}
                style={{ marginRight: '0.75rem', cursor: 'pointer' }}
              />
              <div>
                <p style={{ color: colors.text, fontWeight: 500, margin: 0 }}>Ignore {selectedSuggestion?.merchant_name}</p>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Never suggest transactions from this merchant
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setDismissModalOpen(false);
                setSelectedSuggestion(null);
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDismiss}
              loading={actioning}
              style={{ flex: 1 }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
