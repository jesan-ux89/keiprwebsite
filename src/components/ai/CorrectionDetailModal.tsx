'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface CorrectionDetailModalProps {
  correctionId: string;
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onUndo?: () => void;
}

export default function CorrectionDetailModal({
  correctionId,
  open,
  onClose,
  isAdmin = false,
  onUndo,
}: CorrectionDetailModalProps) {
  const { colors } = useTheme();
  const [correction, setCorrection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    if (open && correctionId) {
      loadCorrection();
    }
  }, [open, correctionId]);

  const loadCorrection = async () => {
    try {
      setLoading(true);
      let res;
      if (isAdmin) {
        res = await aiAPI.adminGetDashboard(); // TODO: need dedicated endpoint
        // For now, fallback to getCorrection
        res = await aiAPI.getCorrection(correctionId);
      } else {
        res = await aiAPI.getCorrection(correctionId);
      }
      if (res?.data) {
        setCorrection(res.data);
      }
    } catch (err: any) {
      setError('Failed to load correction details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    try {
      setUndoing(true);
      if (isAdmin) {
        await aiAPI.adminUndoCorrection(correctionId);
      } else {
        // User-side undo via removal
        // This would be handled differently on user side
      }
      setError(null);
      if (onUndo) onUndo();
      onClose();
    } catch (err: any) {
      setError('Failed to undo correction');
      console.error(err);
    } finally {
      setUndoing(false);
    }
  };

  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div
        style={{
          maxWidth: '700px',
          maxHeight: '80vh',
          overflow: 'auto',
          backgroundColor: colors.card,
          borderRadius: '0.5rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem',
            borderBottom: `1px solid ${colors.divider}`,
          }}
        >
          <h2 style={{ margin: 0, color: colors.text, fontSize: '1.2rem', fontWeight: 600 }}>
            Correction Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} color={colors.textFaint} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: colors.textFaint, padding: '2rem' }}>
              Loading...
            </div>
          )}

          {error && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#FEE2E2',
                border: `1px solid #FECACA`,
                borderRadius: '0.375rem',
                color: '#991B1B',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {correction && (
            <>
              {/* Type & Status */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: colors.electric + '20',
                      color: colors.electric,
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {correction.correction_type}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor:
                        correction.status === 'applied'
                          ? '#D1FAE5'
                          : correction.status === 'flagged'
                            ? '#FEF3C7'
                            : '#E5E7EB',
                      color:
                        correction.status === 'applied'
                          ? '#065F46'
                          : correction.status === 'flagged'
                            ? '#92400E'
                            : '#374151',
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    {correction.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.9rem' }}>
                  {correction.target_description || `Target: ${correction.target_table} (${correction.target_id})`}
                </p>
              </div>

              {/* Confidence */}
              {correction.confidence != null && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: colors.textFaint, marginBottom: '0.5rem' }}>
                    Confidence
                  </label>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: colors.cardBorder,
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min((correction.confidence ?? 0) * 100, 100)}%`,
                        backgroundColor: colors.electric,
                      }}
                    />
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: colors.textFaint }}>
                    {((correction.confidence ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              {/* Reasoning */}
              {correction.reasoning && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: colors.textFaint, marginBottom: '0.5rem' }}>
                    Reasoning
                  </label>
                  <p
                    style={{
                      margin: 0,
                      padding: '0.75rem',
                      backgroundColor: colors.cardBg,
                      borderLeft: `3px solid ${colors.electric}`,
                      fontSize: '0.9rem',
                      color: colors.text,
                      fontStyle: 'italic',
                    }}
                  >
                    {correction.reasoning}
                  </p>
                </div>
              )}

              {/* Before/After JSON Diff */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: colors.textFaint, marginBottom: '0.5rem' }}>
                  Changes
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  {/* Before */}
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: colors.textFaint }}>
                      Before
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        backgroundColor: '#FEE2E2',
                        color: '#7C2D12',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        maxHeight: '200px',
                      }}
                    >
                      {JSON.stringify(correction.before_state, null, 2)}
                    </pre>
                  </div>

                  {/* After */}
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: colors.textFaint }}>
                      After
                    </p>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace',
                        borderRadius: '0.375rem',
                        overflow: 'auto',
                        maxHeight: '200px',
                      }}
                    >
                      {JSON.stringify(correction.after_state, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${colors.divider}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  {correction.created_at && (
                    <div>
                      <p style={{ margin: 0, color: colors.textFaint }}>Created</p>
                      <p style={{ margin: '0.25rem 0 0 0', color: colors.text }}>
                        {new Date(correction.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {isAdmin && correction.reverted_at && (
                    <div>
                      <p style={{ margin: 0, color: colors.textFaint }}>Reverted</p>
                      <p style={{ margin: '0.25rem 0 0 0', color: colors.text }}>
                        {new Date(correction.reverted_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isAdmin && correction.status === 'applied' && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    onClick={handleUndo}
                    disabled={undoing}
                    style={{
                      backgroundColor: '#EF4444',
                    }}
                  >
                    {undoing ? 'Undoing...' : 'Undo'}
                  </Button>
                </div>
              )}

              {!isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button onClick={onClose}>Close</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
