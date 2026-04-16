'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronLeft, Trash2, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Override {
  id: string;
  target_table: string;
  target_id: string;
  override_type: string;
  override_value?: Record<string, unknown>;
  scope: 'current_cycle' | 'permanent';
  applies_to_cycle?: string;
  created_at: string;
  target_description?: string;
}

export default function AIOverridesPage() {
  const { colors } = useTheme();
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadOverrides();
  }, []);

  const loadOverrides = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getOverrides();
      if (res?.data) {
        setOverrides(res.data.overrides || []);
      }
    } catch (err: any) {
      if (err.response?.status !== 503) {
        setError('Failed to load overrides');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverride = async (id: string) => {
    try {
      setRemoving(id);
      await aiAPI.removeOverride(id);
      setOverrides(overrides.filter((o) => o.id !== id));
      setConfirmDelete(null);
    } catch (err: any) {
      setError('Failed to remove override');
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  const groupedOverrides: Record<string, Override[]> = {};
  overrides.forEach((o) => {
    const key = o.override_type;
    if (!groupedOverrides[key]) {
      groupedOverrides[key] = [];
    }
    groupedOverrides[key].push(o);
  });

  const getScopeLabel = (override: Override): string => {
    if (override.scope === 'current_cycle') {
      return `Expires ${override.applies_to_cycle}`;
    }
    return 'Permanent';
  };

  const getOverrideDescription = (override: Override): string => {
    const baseDescription = override.target_description || `${override.target_table} ${override.target_id}`;
    const details = override.override_value ? JSON.stringify(override.override_value) : '';
    return baseDescription;
  };

  if (loading) {
    return (
      <AppLayout pageTitle="My AI overrides">
        <div style={{ maxWidth: '700px', padding: '2rem' }}>
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
          <div style={{ color: colors.textFaint, textAlign: 'center', padding: '2rem' }}>
            Loading...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="My AI overrides">
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

        {error && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '0.5rem',
              color: '#991B1B',
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{error}</span>
          </div>
        )}

        {overrides.length === 0 ? (
          /* Empty state */
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: colors.textFaint,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 500,
                color: colors.text,
                marginBottom: '0.5rem',
              }}
            >
              No overrides yet
            </h2>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              When the AI Assistant makes a suggestion that you disagree with, you can override it. Those overrides
              will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Group by type */}
            {Object.entries(groupedOverrides).map(([type, typeOverrides]) => (
              <div key={type} style={{ marginBottom: '2rem' }}>
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: colors.text,
                    marginBottom: '0.75rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {type.replace(/_/g, ' ')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {typeOverrides.map((override) => (
                    <Card
                      key={override.id}
                      style={{
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: colors.text }}>
                            {getOverrideDescription(override)}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              backgroundColor:
                                override.scope === 'current_cycle' ? '#FEF3C7' : '#D1FAE5',
                              color: override.scope === 'current_cycle' ? '#92400E' : '#065F46',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          >
                            {override.scope === 'current_cycle'
                              ? 'This cycle'
                              : 'Permanent'}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: colors.textFaint,
                          }}
                        >
                          Pinned {new Date(override.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => setConfirmDelete(override.id)}
                        disabled={removing === override.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: removing === override.id ? 'default' : 'pointer',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          color: removing === override.id ? colors.textFaint : '#EF4444',
                          opacity: removing === override.id ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                        }}
                        title="Remove override"
                      >
                        <Trash2 size={18} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Feature toggles note */}
            <div
              style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.75rem 0',
                  fontWeight: 600,
                  color: colors.text,
                }}
              >
                AI Features
              </p>
              <p
                style={{
                  margin: 0,
                  color: colors.textFaint,
                  fontSize: '0.85rem',
                }}
              >
                Use your main AI Assistant settings to disable AI features globally or re-enable them after
                turning off.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Confirm delete modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div style={{ maxWidth: '450px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text }}>Remove this override?</h3>
          <p style={{ margin: '0 0 1.5rem 0', color: colors.textFaint, lineHeight: 1.5 }}>
            The AI Assistant will be able to touch this target again on the next audit.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmDelete && handleRemoveOverride(confirmDelete)}
              disabled={removing === confirmDelete}
              style={{
                backgroundColor: '#EF4444',
              }}
            >
              {removing === confirmDelete ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
