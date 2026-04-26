'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CorrectionDetailModal from '@/components/ai/CorrectionDetailModal';

export default function AdminAIRunDetailPage() {
  return (
    <Suspense fallback={<AppLayout pageTitle="Audit Run"><div style={{ padding: '2rem' }}>Loading…</div></AppLayout>}>
      <AdminAIRunDetailPageInner />
    </Suspense>
  );
}

function AdminAIRunDetailPageInner() {
  const { colors } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('id');

  const [run, setRun] = useState<any>(null);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(null);

  useEffect(() => {
    if (runId) {
      loadRunDetails();
    }
  }, [runId]);

  const loadRunDetails = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.adminGetRun(runId!);
      if (res?.data) {
        // Backend spreads run fields at top level with corrections as sibling
        const { corrections: corr, ...runData } = res.data;
        setRun(runData);
        setCorrections(corr || []);
      }
    } catch (err: any) {
      setError('Failed to load run details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="AI Audit Run">
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.text }}>
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (error || !run) {
    return (
      <AppLayout pageTitle="AI Audit Run">
        <div style={{ maxWidth: '900px', padding: '2rem' }}>
          <button
            onClick={() => router.back()}
            style={{
              marginBottom: '2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.electric,
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          {error && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '0.5rem',
                color: '#991B1B',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="AI Audit Run">
      <div style={{ maxWidth: '900px', padding: '2rem' }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: '2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.electric,
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        {/* Run metadata */}
        <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Trigger
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '1rem', textTransform: 'capitalize' }}>
                {run.trigger_type}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Status
              </p>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
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
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {run.status}
              </span>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Started At
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem' }}>
                {new Date(run.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Duration
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem' }}>
                {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Cost
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem' }}>
                ${run.cost_usd?.toFixed(4) || '0.00'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Model
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem' }}>
                {run.model || 'Unknown'}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Provider
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem', textTransform: 'capitalize' }}>
                {run.provider || (String(run.model || '').startsWith('gpt-') ? 'openai' : 'anthropic')}
                {run.fallback_used ? ' (fallback)' : ''}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: colors.textFaint, fontSize: '0.85rem', fontWeight: 600 }}>
                Router
              </p>
              <p style={{ margin: 0, color: colors.text, fontSize: '0.9rem' }}>
                {run.router_mode ? `${run.router_tier || 'routed'} / ${run.router_reason || run.router_mode}` : 'Manual model'}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '1rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${colors.divider}`,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem' }}>Applied</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#059669', fontSize: '1.5rem', fontWeight: 600 }}>
                {run.corrections_applied}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem' }}>Flagged</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#D97706', fontSize: '1.5rem', fontWeight: 600 }}>
                {run.corrections_flagged}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem' }}>Blocked</p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#DC2626', fontSize: '1.5rem', fontWeight: 600 }}>
                {run.corrections_blocked}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.85rem' }}>Total</p>
              <p style={{ margin: '0.5rem 0 0 0', color: colors.electric, fontSize: '1.5rem', fontWeight: 600 }}>
                {run.corrections_proposed}
              </p>
            </div>
          </div>
        </Card>

        {/* Corrections list */}
        <h2 style={{ color: colors.text, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
          Corrections ({corrections.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {corrections.map((correction) => (
            <Card
              key={correction.id}
              style={{
                padding: '1rem',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: colors.electric + '20',
                        color: colors.electric,
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
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
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {correction.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem 0', color: colors.text, fontWeight: 500 }}>
                    {correction.target_description || `${correction.target_table}`}
                  </p>
                  {correction.reasoning && (
                    <p style={{ margin: '0.25rem 0 0 0', color: colors.textFaint, fontSize: '0.85rem' }}>
                      {correction.reasoning}
                    </p>
                  )}
                </div>
                {correction.confidence != null && (
                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <p style={{ margin: 0, color: colors.textFaint, fontSize: '0.8rem' }}>Confidence</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: colors.electric, fontWeight: 600 }}>
                      {((correction.confidence ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedCorrection && (
        <CorrectionDetailModal
          correctionId={selectedCorrection}
          open={!!selectedCorrection}
          onClose={() => setSelectedCorrection(null)}
          isAdmin={true}
        />
      )}
    </AppLayout>
  );
}
