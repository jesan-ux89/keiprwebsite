'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';

// Module-level dismissed ID — survives component unmount/remount (navigation)
let globalDismissedRunId: string | null = null;

// Load from sessionStorage on module init (persists within tab session)
if (typeof window !== 'undefined') {
  globalDismissedRunId = sessionStorage.getItem('keipr_dismissed_ai_run');
}

interface SyncingIndicatorProps {
  enabled?: boolean;
  onComplete?: () => void;
  onViewBudget?: () => void;
}

export default function SyncingIndicator({ enabled = true, onComplete, onViewBudget }: SyncingIndicatorProps) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [updates, setUpdates] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const lastSeenRunIdRef = useRef<string | null>(null);

  // Dismiss helper — persists so banner never comes back for this run
  const dismissRun = useCallback(() => {
    const runId = lastSeenRunIdRef.current;
    globalDismissedRunId = runId;
    if (runId && typeof window !== 'undefined') {
      sessionStorage.setItem('keipr_dismissed_ai_run', runId);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const checkStatus = async () => {
      try {
        const res = await aiAPI.getHistory(1, 0);
        const runs = res?.data?.runs || res || [];
        const runList = Array.isArray(runs) ? runs : [];
        if (runList.length === 0) return;

        const run = runList[0];

        // Skip dismissed runs
        if (run.id === globalDismissedRunId) return;

        if (run.status === 'running' || run.status === 'pending') {
          if (mounted) {
            setStatus('running');
            setIsVisible(true);
            lastSeenRunIdRef.current = run.id;
          }
        } else if (run.status === 'completed' && run.id !== lastSeenRunIdRef.current) {
          const applied = run.corrections_applied || 0;
          lastSeenRunIdRef.current = run.id;
          if (applied > 0 && mounted) {
            setStatus('completed');
            setUpdates(applied);
            setIsVisible(true);
            if (onComplete) onComplete();

            // Auto-hide after 30 seconds and persist dismissal
            setTimeout(() => {
              if (mounted) dismissRun();
            }, 30000);
          }
        } else if (run.status === 'completed' && run.id === lastSeenRunIdRef.current && status === 'running') {
          // Same run just finished
          const applied = run.corrections_applied || 0;
          if (mounted) {
            setStatus('completed');
            setUpdates(applied);
            if (onComplete) onComplete();
            setTimeout(() => {
              if (mounted) dismissRun();
            }, 30000);
          }
        }
      } catch (err) {
        // Silently fail — status endpoint may be down
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 5000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 300000);

    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [enabled, status, dismissRun]);

  const handleClick = () => {
    dismissRun();
    if (onViewBudget) onViewBudget();
  };

  if (!enabled || !isVisible || status === 'idle') return null;

  return (
    <div
      onClick={status === 'completed' && updates > 0 ? handleClick : undefined}
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
        cursor: status === 'completed' && updates > 0 ? 'pointer' : 'default',
        animation: status === 'running' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
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
          <span>✨</span>
          <span>Budget updated with {updates} change{updates !== 1 ? 's' : ''}.{' '}
            <span style={{ fontWeight: 600, textDecoration: 'underline' }}>View budget</span>
          </span>
        </>
      )}
    </div>
  );
}
