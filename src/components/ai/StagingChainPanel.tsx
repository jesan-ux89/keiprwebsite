'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import StagingChainAnchorModal from './StagingChainAnchorModal';

interface StagingChainPanelProps {
  billId: string;
  billName: string;
}

export default function StagingChainPanel({ billId, billName }: StagingChainPanelProps) {
  const { colors } = useTheme();
  const [chain, setChain] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadChain();
    }
  }, [isExpanded, billId]);

  const loadChain = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getStagingChains();
      if (res?.data?.chains) {
        const matchingChain = res.data.chains.find(
          (c: any) => c.source_bill_id === billId || c.contribution_bill_id === billId
        );
        setChain(matchingChain || null);
      }
    } catch (err: any) {
      setError('Failed to load chain details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDissolve = async () => {
    if (!chain) return;
    try {
      setDissolving(true);
      await aiAPI.dissolveStagingChain(chain.id);
      setChain(null);
      setShowDissolveConfirm(false);
      setIsExpanded(false);
    } catch (err: any) {
      setError('Failed to dissolve chain');
      console.error(err);
    } finally {
      setDissolving(false);
    }
  };

  if (!chain && !isExpanded) return null;

  return (
    <>
      {/* Collapsible header */}
      <div
        style={{
          padding: '0.75rem',
          backgroundColor: '#9C5EFA08',
          border: `1px solid #9C5EFA20`,
          borderRadius: '0.375rem',
          marginTop: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#9C5EFA12';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#9C5EFA08';
        }}
      >
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span style={{ fontWeight: 500, color: colors.text }}>Savings Chain Details</span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: colors.cardBg,
            border: `1px solid #9C5EFA20`,
            borderTop: 'none',
            borderRadius: '0 0 0.375rem 0.375rem',
          }}
        >
          {loading && <div style={{ color: colors.textFaint }}>Loading chain details...</div>}

          {error && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                borderRadius: '0.375rem',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {chain && !loading && (
            <>
              {/* Chain summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <div>
                  <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem', fontWeight: 500 }}>
                    Contribution Per Paycheck
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: colors.text, fontWeight: 600 }}>
                    ${chain.contribution_amount?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem', fontWeight: 500 }}>
                    Contributions Per Cycle
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: colors.text, fontWeight: 600 }}>
                    {chain.contributions_per_cycle}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem', fontWeight: 500 }}>
                    Expected Total
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: colors.text, fontWeight: 600 }}>
                    ${chain.expected_total?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem', fontWeight: 500 }}>
                    Confidence
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', color: colors.text, fontWeight: 600 }}>
                    {(chain.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Initial anchor status */}
              {chain.needs_initial_anchor && (
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    color: '#92400E',
                    fontSize: '0.9rem',
                  }}
                >
                  <p style={{ margin: 0, marginBottom: '0.75rem', fontWeight: 500 }}>
                    Initial Setup Needed
                  </p>
                  <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                    To track this savings chain accurately, tell us where you are in the cycle.
                  </p>
                  <Button
                    onClick={() => setShowAnchorModal(true)}
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem',
                    }}
                  >
                    Set Initial Balance
                  </Button>
                </div>
              )}

              {/* Cycle position (if anchored) */}
              {!chain.needs_initial_anchor && chain.initial_cycle_position !== null && (
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#D1FAE5',
                    border: '1px solid #86EFAC',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem',
                    color: '#065F46',
                    fontSize: '0.9rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    {chain.initial_cycle_position} of {chain.contributions_per_cycle} contributions this cycle
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowDissolveConfirm(true)}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.5rem 1rem',
                    borderColor: '#EF4444',
                    color: '#EF4444',
                  }}
                >
                  Dissolve Chain
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Anchor setup modal */}
      {showAnchorModal && chain && (
        <StagingChainAnchorModal
          chainId={chain.id}
          chainName={billName}
          onClose={() => setShowAnchorModal(false)}
          onComplete={() => {
            setShowAnchorModal(false);
            loadChain();
          }}
        />
      )}

      {/* Dissolve confirmation modal */}
      <Modal isOpen={showDissolveConfirm} onClose={() => setShowDissolveConfirm(false)}>
        <div style={{ maxWidth: '450px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text }}>Break this savings chain?</h3>
          <p style={{ margin: 0, color: colors.textFaint, lineHeight: 1.5, marginBottom: '1.5rem' }}>
            The staging bill will be archived and {billName} will be treated as a regular bill again.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowDissolveConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDissolve}
              disabled={dissolving}
              style={{
                backgroundColor: '#EF4444',
              }}
            >
              {dissolving ? 'Dissolving...' : 'Dissolve'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
