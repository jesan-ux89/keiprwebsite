'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronLeft, Download, ChevronDown, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CorrectionDetailModal from '@/components/ai/CorrectionDetailModal';

interface Run {
  id: string;
  trigger_type: string;
  started_at: string;
  duration_ms?: number;
  cost_usd?: number;
  status: string;
  corrections_applied: number;
  corrections_flagged: number;
  corrections_blocked: number;
}

interface Correction {
  id: string;
  correction_type: string;
  status: string;
  confidence?: number;
  target_description?: string;
  reasoning?: string;
}

export default function AIHistoryPage() {
  const { colors } = useTheme();
  const [runs, setRuns] = useState<Run[]>([]);
  const [corrections, setCorrections] = useState<Record<string, Correction[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async (offset = 0) => {
    try {
      setLoading(true);
      const res = await aiAPI.getHistory(50, offset);
      if (res?.data) {
        setRuns(res.data.runs || []);
      }
    } catch (err: any) {
      if (err.response?.status !== 503) {
        setError('Failed to load AI history');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRunCorrections = async (runId: string) => {
    if (corrections[runId]) {
      setExpandedRun(expandedRun === runId ? null : runId);
      return;
    }

    try {
      const res = await aiAPI.adminGetRun(runId);
      if (res?.data?.corrections) {
        setCorrections({
          ...corrections,
          [runId]: res.data.corrections,
        });
        setExpandedRun(runId);
      }
    } catch (err: any) {
      setError('Failed to load run corrections');
      console.error(err);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await aiAPI.exportData();
      if (res?.data) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `keipr-ai-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError('Failed to export data');
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading && runs.length === 0) {
    return (
      <AppLayout pageTitle="My AI history">
        <div style={{ maxWidth: '900px', padding: '2rem' }}>
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
            Loading history...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="My AI history">
      <div style={{ maxWidth: '900px', padding: '2rem' }}>
        {/* Back link & header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link
            href="/app/settings/ai"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: colors.electric,
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <ChevronLeft size={18} />
            Back to AI Assistant
          </Link>
          <Button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Download my AI data'}
          </Button>
        </div>

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

        {runs.length === 0 ? (
          /* Empty state */
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
        ) : (
          /* Runs list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {runs.map((run) => (
              <div key={run.id}>
                {/* Run header */}
                <Card
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    backgroundColor: expandedRun === run.id ? colors.card : colors.cardBg,
                    borderColor: expandedRun === run.id ? colors.electric : colors.divider,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => loadRunCorrections(run.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ChevronDown
                      size={20}
                      style={{
                        transform: expandedRun === run.id ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s ease',
                        color: colors.textFaint,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: colors.text }}>
                          {new Date(run.started_at).toLocaleDateString()} at{' '}
                          {new Date(run.started_at).toLocaleTimeString()}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: colors.electric + '20',
                            color: colors.electric,
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {run.trigger_type}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            backgroundColor:
                              run.status === 'completed'
                                ? '#D1FAE5'
                                : run.status === 'failed'
                                  ? '#FEE2E2'
                                  : '#E5E7EB',
                            color:
                              run.status === 'completed'
                                ? '#065F46'
                                : run.status === 'failed'
                                  ? '#991B1B'
                                  : '#374151',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: colors.textFaint }}>
                        <span>Applied: {run.corrections_applied}</span>
                        {run.corrections_flagged > 0 && <span>Flagged: {run.corrections_flagged}</span>}
                        {run.corrections_blocked > 0 && <span>Blocked: {run.corrections_blocked}</span>}
                        {run.duration_ms && <span>Duration: {(run.duration_ms / 1000).toFixed(1)}s</span>}
                        {run.cost_usd && <span>Cost: ${run.cost_usd.toFixed(4)}</span>}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Corrections list (expanded) */}
                {expandedRun === run.id && corrections[run.id] && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: colors.cardBg,
                      border: `1px solid ${colors.divider}`,
                      borderTop: 'none',
                      borderBottomLeftRadius: '0.5rem',
                      borderBottomRightRadius: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {corrections[run.id].map((correction) => (
                      <Card
                        key={correction.id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: colors.card,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => setSelectedCorrection(correction.id)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = colors.electric;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = colors.divider;
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  backgroundColor: colors.electric + '20',
                                  color: colors.electric,
                                  borderRadius: '0.25rem',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                }}
                              >
                                {correction.correction_type}
                              </span>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
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
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                }}
                              >
                                {correction.status}
                              </span>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.9rem',
                                color: colors.text,
                              }}
                            >
                              {correction.target_description || 'Correction'}
                            </p>
                            {correction.reasoning && (
                              <p
                                style={{
                                  margin: '0.25rem 0 0 0',
                                  fontSize: '0.8rem',
                                  color: colors.textFaint,
                                  fontStyle: 'italic',
                                }}
                              >
                                {correction.reasoning}
                              </p>
                            )}
                          </div>
                          {correction.confidence !== null && (
                            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                              <div style={{ color: colors.textFaint, marginBottom: '0.25rem' }}>
                                Confidence
                              </div>
                              <div style={{ color: colors.electric, fontWeight: 600 }}>
                                {(correction.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load more placeholder */}
        <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '2rem', color: colors.textFaint }}>
          {runs.length > 0 && 'Scroll for more'}
        </div>
      </div>

      {/* Detail modal */}
      {selectedCorrection && (
        <CorrectionDetailModal
          correctionId={selectedCorrection}
          open={!!selectedCorrection}
          onClose={() => setSelectedCorrection(null)}
        />
      )}
    </AppLayout>
  );
}
