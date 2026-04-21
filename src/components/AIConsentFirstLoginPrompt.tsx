'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiAPI } from '@/lib/api';
import AIConsentModal from './AIConsentModal';

/**
 * AIConsentFirstLoginPrompt
 * ─────────────────────────────────────────────────────────────────
 * Shows ONCE on /app dashboard mount for existing users who predate
 * the in-onboarding consent screen. If `never_prompted` comes back
 * true from GET /me/ai-settings, we render the consent modal. Any
 * action (accept, dismiss, read details) stamps `ai_prompted_at`
 * via POST /me/ai-prompted so the prompt never shows again.
 *
 * Feature-flag safe: on 503 from /me/ai-settings, silently no-op.
 * Mirrors mobile AIConsentFirstLoginPrompt.tsx.
 */
export default function AIConsentFirstLoginPrompt() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await aiAPI.getSettings();
        if (cancelled) return;
        const data = res?.data;
        if (!data) return;
        if (data.never_prompted === true) {
          setVersion(data.consent_current_version || null);
          setVisible(true);
        }
      } catch {
        // 503 (feature off) or other error — silent no-op
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  async function handleDismiss() {
    try { await aiAPI.markPrompted(); } catch {}
    setVisible(false);
  }

  async function handleConsent() {
    // AIConsentModal already called POST /ai-consent internally.
    // We just need to flip the enabled flag and stamp prompted.
    try {
      await aiAPI.setEnabled(true, 'dashboard_first_login');
    } catch {
      try { await aiAPI.markPrompted(); } catch {}
    }
    setVisible(false);
  }

  return (
    <AIConsentModal
      onClose={handleDismiss}
      onConsent={handleConsent}
      version={version || undefined}
    />
  );
}
