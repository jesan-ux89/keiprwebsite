'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { ChevronRight, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import AIConsentModal from '@/components/AIConsentModal';

export default function AISettingsPage() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getSettings();
      if (res?.data) {
        setSettings(res.data);
      }
    } catch (err: any) {
      if (err.response?.status === 503) {
        // Feature flag off - hide AI UI
        setSettings(null);
      } else {
        setError('Failed to load AI settings');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      // Turning off - show confirm dialog
      setShowDisableConfirm(true);
    } else {
      // Turning on - check if consent needed
      if (!settings?.consent_accepted_at || settings?.consent_version !== settings?.consent_current_version) {
        setShowConsent(true);
      } else {
        await enableAI();
      }
    }
  };

  const confirmDisable = async () => {
    setShowDisableConfirm(false);
    await disableAI();
  };

  const disableAI = async () => {
    try {
      setToggling(true);
      await aiAPI.setEnabled(false, disableReason);
      setDisableReason('');
      await loadSettings();
    } catch (err) {
      setError('Failed to disable AI');
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const enableAI = async () => {
    try {
      setToggling(true);
      await aiAPI.setEnabled(true);
      await loadSettings();
    } catch (err) {
      setError('Failed to enable AI');
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="AI Assistant">
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.text }}>
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout pageTitle="AI Assistant">
        <div style={{ padding: '2rem', maxWidth: '600px' }}>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: `${colors.amber}15`,
              border: `1px solid ${colors.amber}`,
              borderRadius: '0.5rem',
              color: colors.text,
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <strong>AI Assistant unavailable</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                The AI Assistant feature is not currently available. Please try again later.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="AI Assistant">
      <div style={{ maxWidth: '700px', padding: '2rem' }}>
        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '0.5rem',
              color: '#991B1B',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Master Toggle */}
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              Use AI Assistant
            </h2>
            <div
              onClick={() => handleToggle(!settings.enabled)}
              style={{
                width: '50px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: settings.enabled ? colors.electric : colors.cardBorder,
                cursor: toggling ? 'default' : 'pointer',
                opacity: toggling ? 0.6 : 1,
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: settings.enabled ? '26px' : '2px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  transition: 'left 0.3s ease',
                }}
              />
            </div>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              color: colors.textFaint,
              lineHeight: 1.5,
            }}
          >
            When on, Keipr uses an AI model to audit automated decisions like which paycheck a bill
            belongs to.{' '}
            <a
              href="/app/settings/ai/details"
              style={{ color: colors.electric, textDecoration: 'none', fontWeight: 500 }}
            >
              Learn more
            </a>
            .
          </p>
        </Card>

        {/* Card Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link
            href="/app/settings/ai/details"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: colors.card,
              border: `1px solid ${colors.divider}`,
              borderRadius: '0.5rem',
              textDecoration: 'none',
              color: colors.text,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover || colors.card;
              (e.currentTarget as HTMLElement).style.borderColor = colors.electric;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.card;
              (e.currentTarget as HTMLElement).style.borderColor = colors.divider;
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Privacy & data details</div>
            </div>
            <ChevronRight size={18} style={{ color: colors.textFaint }} />
          </Link>

          {/* AI History and Overrides removed from user-facing UI.
              Corrections happen silently; flagged items surface as action
              cards in the Budget screen. */}
        </div>

        {/* Footer text */}
        <p
          style={{
            marginTop: '2rem',
            fontSize: '0.85rem',
            color: colors.textFaint,
            textAlign: 'center',
          }}
        >
          AI Assistant is in beta.
        </p>
      </div>

      {/* Disable Confirmation Dialog */}
      <Modal isOpen={showDisableConfirm} onClose={() => setShowDisableConfirm(false)}>
        <div style={{ maxWidth: '450px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text, fontSize: '1.1rem' }}>
            Turn off AI Assistant?
          </h3>
          <p style={{ margin: '0 0 1rem 0', color: colors.textFaint, lineHeight: 1.5 }}>
            Your data will no longer be sent to Anthropic. Within 30 days, your AI history will be deleted.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: colors.text }}>
              Mind telling us why? (optional)
            </label>
            <textarea
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Your feedback helps us improve..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.5rem',
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowDisableConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDisable}
              disabled={toggling}
              style={{
                backgroundColor: '#EF4444',
              }}
            >
              {toggling ? 'Disabling...' : 'Turn Off'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Consent Modal */}
      {showConsent && (
        <AIConsentModal
          onClose={() => setShowConsent(false)}
          onConsent={() => {
            setShowConsent(false);
            enableAI();
          }}
        />
      )}
    </AppLayout>
  );
}
