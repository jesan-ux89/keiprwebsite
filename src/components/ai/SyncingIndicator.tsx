'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';

interface SyncingIndicatorProps {
  enabled?: boolean;
  onComplete?: () => void;
}

export default function SyncingIndicator({ enabled = true, onComplete }: SyncingIndicatorProps) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [updates, setUpdates] = useState(0);
  const [hideAfterDelay, setHideAfterDelay] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const checkStatus = async () => {
      try {
        const res = await aiAPI.getHistory(1, 0);
        if (res?.data?.runs && res.data.runs.length > 0) {
          const run = res.data.runs[0];
          if (run.status === 'running') {
            setStatus('running');
            setUpdates(0);
          } else if (run.status === 'completed') {
            const applied = run.corrections_applied || 0;
            if (applied > 0) {
              setStatus('completed');
              setUpdates(applied);
              // Auto-hide after 5 seconds
              setTimeout(() => setHideAfterDelay(true), 5000);
              if (onComplete) onComplete();
            } else {
              setHideAfterDelay(true);
            }
          }
        }
      } catch (err) {
        // Silently fail — status endpoint may be down
        console.debug('Failed to check AI sync status', err);
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 5 seconds while status is unknown or running
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    // Auto-stop polling after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [enabled, onComplete]);

  if (!enabled || hideAfterDelay || status === 'idle') return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: '#9C5EFA15',
        border: `1px solid #9C5EFA30`,
        borderRadius: '0.375rem',
        fontSize: '0.85rem',
        color: '#9C5EFA',
        fontWeight: 500,
        animation: status === 'running' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        style: {
          animation: status === 'running' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        } as React.CSSProperties,
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {status === 'running' && (
        <>
          <span>✨</span>
          <span>Refining your ledger…</span>
        </>
      )}

      {status === 'completed' && updates > 0 && (
        <>
          <span>✅</span>
          <span>{updates} update{updates !== 1 ? 's' : ''} applied</span>
        </>
      )}
    </div>
  );
}
