'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function AdminAIDashboardPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [requiresConfirm, setRequiresConfirm] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState('');

  // Local state for control bar
  const [localSettings, setLocalSettings] = useState({
    ai_enabled: true,
    primary_model: 'claude-opus-4-6',
    fallback_model: null,
    max_cost_per_user_monthly: 5,
    max_cost_system_monthly: 500,
    data_retention_days: 90,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const adminSettings = await aiAPI.adminGetSettings();
      if (!adminSettings?.data) throw new Error('Admin access required');

      setSettings(adminSettings.data);
      setLocalSettings({
        ai_enabled: adminSettings.data.ai_enabled ?? true,
        primary_model: adminSettings.data.primary_model || 'claude-opus-4-6',
        fallback_model: adminSettings.data.fallback_model,
        max_cost_per_user_monthly: adminSettings.data.max_cost_per_user_monthly || 5,
        max_cost_system_monthly: adminSettings.data.max_cost_system_monthly || 500,
        data_retention_days: adminSettings.data.data_retention_days || 90,
      });
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Admin only');
        router.push('/app');
      } else if (err.response?.status === 503) {
        setError('AI Accountant feature flag is disabled in backend env.');
      } else {
        setError('Failed to load admin settings');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (field: string, value: any) => {
    if (field === 'ai_enabled' && !value) {
      // Turning off requires confirmation
      setRequiresConfirm('KILL');
      setConfirmInput('');
      return;
    }
    if (['primary_model', 'fallback_model'].includes(field)) {
      setRequiresConfirm('confirm');
      setConfirmInput('');
      return;
    }

    await updateSetting(field, value);
  };

  const confirmUpdate = async (field: string, value: any) => {
    if (requiresConfirm === 'KILL' && confirmInput !== 'KILL') {
      setError('Invalid confirmation');
      return;
    }
    if (requiresConfirm === 'confirm' && confirmInput !== 'confirm') {
      setError('Invalid confirmation');
      return;
    }

    setRequiresConfirm(null);
    setConfirmInput('');
    await updateSetting(field, value);
  };

  const updateSetting = async (field: string, value: any) => {
    try {
      setUpdating(true);
      const fieldMap: any = {
        ai_enabled: 'ai_enabled',
        primary_model: 'primary_model',
        fallback_model: 'fallback_model',
        max_cost_per_user_monthly: 'max_cost_per_user_monthly',
        max_cost_system_monthly: 'max_cost_system_monthly',
        data_retention_days: 'data_retention_days',
      };

      const payload: any = {};
      payload[fieldMap[field]] = value;

      await aiAPI.adminUpdateSettings(payload);
      setLocalSettings({ ...localSettings, [field]: value });
      setError(null);
    } catch (err: any) {
      setError(`Failed to update ${field}`);
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle="AI Dashboard">
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.text }}>
          Loading...
        </div>
      </AppLayout>
    );
  }

  if (error && error.includes('feature flag')) {
    return (
      <AppLayout pageTitle="AI Dashboard">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            flexDirection: 'column',
            textAlign: 'center',
            color: colors.text,
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Feature flag disabled</h2>
          <p style={{ color: colors.textFaint, maxWidth: '400px' }}>
            AI Accountant feature flag is disabled in backend env. Set the environment variable to enable.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!settings) {
    return (
      <AppLayout pageTitle="AI Dashboard">
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: `${colors.warning}15`,
              border: `1px solid ${colors.warning}`,
              borderRadius: '0.5rem',
              color: colors.text,
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Error loading dashboard</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: colors.textFaint }}>
                {error}
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const MODEL_OPTIONS = [
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (higher quality)' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanced)' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (cheapest)' },
  ];

  return (
    <AppLayout pageTitle="AI Dashboard">
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {error && !error.includes('feature flag') && (
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

        {/* Row 0: System Controls */}
        <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: colors.text }}>
            System Controls
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Global AI toggle */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                Global AI Switch
              </label>
              <div
                onClick={() => handleSettingChange('ai_enabled', !localSettings.ai_enabled)}
                style={{
                  width: '50px',
                  height: '28px',
                  borderRadius: '14px',
                  backgroundColor: localSettings.ai_enabled ? colors.electric : colors.cardBorder,
                  cursor: updating ? 'default' : 'pointer',
                  opacity: updating ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: localSettings.ai_enabled ? '26px' : '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: '#fff',
                    transition: 'left 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Primary model */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                Primary Model
              </label>
              <select
                value={localSettings.primary_model}
                onChange={(e) => handleSettingChange('primary_model', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${colors.divider}`,
                  borderRadius: '0.375rem',
                  backgroundColor: colors.cardBg,
                  color: colors.text,
                  fontSize: '0.9rem',
                }}
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fallback model */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                Fallback Model
              </label>
              <select
                value={localSettings.fallback_model || ''}
                onChange={(e) => handleSettingChange('fallback_model', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${colors.divider}`,
                  borderRadius: '0.375rem',
                  backgroundColor: colors.cardBg,
                  color: colors.text,
                  fontSize: '0.9rem',
                }}
              >
                <option value="">None</option>
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Per-user cap */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                Monthly per-user cap (USD)
              </label>
              <Input
                type="number"
                value={localSettings.max_cost_per_user_monthly}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    max_cost_per_user_monthly: parseFloat(e.target.value),
                  })
                }
                onBlur={() =>
                  updateSetting('max_cost_per_user_monthly', localSettings.max_cost_per_user_monthly)
                }
                step="0.1"
                min="0"
              />
            </div>

            {/* System cap */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                System monthly cap (USD)
              </label>
              <Input
                type="number"
                value={localSettings.max_cost_system_monthly}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    max_cost_system_monthly: parseFloat(e.target.value),
                  })
                }
                onBlur={() => updateSetting('max_cost_system_monthly', localSettings.max_cost_system_monthly)}
                step="1"
                min="0"
              />
            </div>

            {/* Data retention */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
                Data retention (days)
              </label>
              <Input
                type="number"
                value={localSettings.data_retention_days}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    data_retention_days: parseInt(e.target.value),
                  })
                }
                onBlur={() => updateSetting('data_retention_days', localSettings.data_retention_days)}
                min="1"
              />
            </div>
          </div>
        </Card>

        {/* Row 1: Status Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Active Model</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              {localSettings.primary_model.split('-')[1]}
            </div>
          </Card>
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>7-day cost</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>$0.00</div>
          </Card>
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>7-day corrections</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>0</div>
          </Card>
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Override rate (7d)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>—</div>
          </Card>
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Users opted-in</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>0 / —</div>
          </Card>
        </div>

        {/* Row 2: Feature Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {['Paycheck forecast', 'Classification audit', 'Savings chain detection'].map((feature) => (
            <Card key={feature} style={{ padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 500, color: colors.text }}>
                {feature}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textFaint }}>
                Not yet enabled (Phase 0)
              </p>
            </Card>
          ))}
        </div>

        {/* Row 3: Activity log */}
        <Card style={{ padding: '1rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
            Activity Log
          </h3>
          <div
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: colors.textFaint,
              fontSize: '0.9rem',
            }}
          >
            No audit runs yet.
          </div>
        </Card>

        {/* Row 5: Guardrail alerts */}
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
            Guardrail Alerts
          </h3>
          <div
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              color: colors.textFaint,
              fontSize: '0.9rem',
            }}
          >
            No alerts.
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={requiresConfirm !== null} onClose={() => setRequiresConfirm(null)}>
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text, fontSize: '1rem' }}>
            Confirm {requiresConfirm === 'KILL' ? 'disable AI' : 'model change'}
          </h3>
          <p style={{ color: colors.textFaint, marginBottom: '1rem', fontSize: '0.9rem' }}>
            Type <code style={{ backgroundColor: colors.cardBg, padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
              {requiresConfirm}
            </code>{' '}
            to confirm:
          </p>
          <Input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={requiresConfirm || ''}
          />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="secondary" onClick={() => setRequiresConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (requiresConfirm === 'KILL') {
                  confirmUpdate('ai_enabled', false);
                } else {
                  // For model changes, just use the current value
                  confirmUpdate('primary_model', localSettings.primary_model);
                }
              }}
              disabled={!confirmInput}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
