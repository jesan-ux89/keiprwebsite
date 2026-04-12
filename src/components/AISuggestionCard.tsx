'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export interface AISuggestion {
  id: string;
  type: 'category_fix' | 'budget_creation' | 'category_consolidation';
  payload: {
    merchantName?: string;
    currentCategory?: string;
    suggestedCategory?: string;
    reasoning?: string;
    affectedTransactions?: number;
    category?: string;
    suggestedAmount?: number;
    categories?: string[];
    confidence?: number;
    suggestionType?: string;
  };
  status: 'pending' | 'applied' | 'dismissed';
  createdAt: string;
}

interface Props {
  suggestions: AISuggestion[];
  onAction: (id: string, action: 'apply' | 'dismiss') => void;
}

export default function AISuggestionCard({ suggestions, onAction }: Props) {
  const { colors } = useTheme();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  if (pendingSuggestions.length === 0) {
    return null;
  }

  function getDescription(suggestion: AISuggestion): string {
    const { type, payload } = suggestion;
    switch (type) {
      case 'category_fix':
        return `Move ${payload.merchantName} from ${payload.currentCategory} to ${payload.suggestedCategory}`;
      case 'budget_creation':
        return `Create a ${payload.category} budget of $${Math.round((payload.suggestedAmount || 0) / 100)}/paycheck`;
      case 'category_consolidation':
        return `Merge ${payload.categories?.join(', ')} into ${payload.suggestedCategory}`;
      default:
        return 'AI Suggestion';
    }
  }

  function getTypeLabel(type: string): string {
    switch (type) {
      case 'category_fix':
        return 'Category Fix';
      case 'budget_creation':
        return 'New Budget';
      case 'category_consolidation':
        return 'Simplify Categories';
      default:
        return 'Suggestion';
    }
  }

  async function handleAction(suggestion: AISuggestion, action: 'apply' | 'dismiss') {
    setLoadingId(suggestion.id);
    try {
      await onAction(suggestion.id, action);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{
      marginBottom: '1.5rem',
      borderRadius: '0.75rem',
      backgroundColor: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: `1px solid ${colors.cardBorder}`,
      }}>
        <span style={{ fontSize: '1.125rem' }}>✨</span>
        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.text }}>AI Suggestions</span>
      </div>

      <div style={{ maxHeight: '25rem', overflowY: 'auto' }}>
        {pendingSuggestions.map(suggestion => (
          <div key={suggestion.id} style={{
            borderBottom: `1px solid ${colors.cardBorder}`,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}>
            <div style={{
              width: '4px',
              minHeight: '4rem',
              backgroundColor: '#38BDF8',
              borderRadius: '2px',
              flexShrink: 0,
            }} />

            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#38BDF8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {getTypeLabel(suggestion.type)}
              </span>

              <p style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.text,
                margin: '0.375rem 0',
                lineHeight: 1.4,
              }}>
                {getDescription(suggestion)}
              </p>

              {suggestion.payload.reasoning && (
                <p style={{
                  fontSize: '0.8125rem',
                  color: colors.textMuted,
                  fontStyle: 'italic',
                  margin: '0 0 0.625rem 0',
                  lineHeight: 1.4,
                }}>
                  {suggestion.payload.reasoning}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAction(suggestion, 'apply')}
                  disabled={loadingId !== null}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#0C4A6E',
                    color: '#fff',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                    opacity: loadingId === suggestion.id ? 0.7 : 1,
                  }}
                >
                  {loadingId === suggestion.id ? '...' : 'Apply'}
                </button>

                <button
                  onClick={() => handleAction(suggestion, 'dismiss')}
                  disabled={loadingId !== null}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: colors.cardBorder,
                    color: colors.textMuted,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                    opacity: loadingId === suggestion.id ? 0.7 : 1,
                  }}
                >
                  {loadingId === suggestion.id ? '...' : 'Dismiss'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
