'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';

const MODEL_OPTIONS = [
  { value: 'gpt-router-recommended', label: 'GPT Router (recommended primary)', provider: 'OpenAI' },
  { value: 'gpt-5.5', label: 'GPT-5.5 (highest quality)', provider: 'OpenAI' },
  { value: 'gpt-5.4', label: 'GPT-5.4 (strong)', provider: 'OpenAI' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini (fast + low cost)', provider: 'OpenAI' },
  { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano (cheapest)', provider: 'OpenAI' },
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (higher quality)', provider: 'Anthropic' },
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanced fallback)', provider: 'Anthropic' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (cheap fallback)', provider: 'Anthropic' },
];

const FALLBACK_MODEL_OPTIONS = MODEL_OPTIONS.filter((option) => option.value !== 'gpt-router-recommended');

function shortModelName(model: string | null | undefined) {
  if (!model) return 'None';
  if (model === 'gpt-router-recommended') return 'GPT Router';
  if (model.startsWith('gpt-')) return model.toUpperCase();
  if (model.includes('sonnet')) return 'Sonnet';
  if (model.includes('haiku')) return 'Haiku';
  if (model.includes('opus')) return 'Opus';
  return model;
}

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
  const [pendingChange, setPendingChange] = useState<{ field: string; value: any; previousValue: any } | null>(null);
  const [autoRefresh] = useState(true);

  // Local state for control bar
  const [localSettings, setLocalSettings] = useState({
    ai_enabled: true,
    primary_model: 'gpt-router-recommended',
    fallback_model: 'claude-sonnet-4-6',
    max_cost_per_user_monthly: 5,
    max_cost_system_monthly: 500,
    data_retention_days: 90,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh || loading) return;
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, dashRes] = await Promise.all([
        aiAPI.adminGetSettings(),
        aiAPI.adminGetDashboard().catch(() => null),
      ]);

      if (!settingsRes?.data) throw new Error('Admin access required');

      setSettings(settingsRes.data);
      setDashboardData(dashRes?.data || null);
      setLocalSettings({
        ai_enabled: settingsRes.data.ai_enabled ?? true,
        primary_model: settingsRes.data.primary_model || 'gpt-router-recommended',
        fallback_model: settingsRes.data.fallback_model || 'claude-sonnet-4-6',
        max_cost_per_user_monthly: settingsRes.data.max_cost_per_user_monthly || 5,
        max_cost_system_monthly: settingsRes.data.max_cost_system_monthly || 500,
        data_retention_days: settingsRes.data.data_retention_days || 90,
      });
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Admin only');
        router.push('/app');
      } else if (err.response?.status === 503) {
        setError('AI Accountant feature flag is disabled in backend env.');
      } else {
        const backendMsg = err?.response?.data?.error || err?.response?.data?.detail || err?.message;
        const status = err?.response?.status;
        setError(
          `Failed to load admin settings${status ? ` (HTTP ${status})` : ''}${backendMsg ? `: ${backendMsg}` : ''}`,
        );
      }
      console.error('[admin/ai] loadData error:', err?.response?.status, err?.response?.data, err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      const res = await aiAPI.adminGetDashboard();
      setDashboardData(res?.data || null);
    } catch (err) {
      console.debug('Failed to refresh dashboard', err);
    }
  }, []);

  const handleSettingChange = async (field: string, value: any) => {
    if (field === 'ai_enabled' && !value) {
      setPendingChange({ field, value, previousValue: localSettings.ai_enabled });
      setRequiresConfirm('KILL');
      setConfirmInput('');
      return;
    }
    if (['primary_model', 'fallback_model'].includes(field)) {
      const prev = localSettings[field as keyof typeof localSettings];
      // Show new value in dropdown immediately (revert on cancel)
      setLocalSettings({ ...localSettings, [field]: value });
      setPendingChange({ field, value, previousValue: prev });
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
    setPendingChange(null);
    if (field === 'model_preset') {
      await updateSettingsPatch(value, 'confirm');
      return;
    }
    await updateSetting(field, value);
  };

  const applyModelPreset = (primaryModel: string, fallbackModel: string) => {
    const nextSettings = {
      primary_model: primaryModel,
      fallback_model: fallbackModel,
    };
    setLocalSettings({ ...localSettings, ...nextSettings });
    setPendingChange({ field: 'model_preset', value: nextSettings, previousValue: { ...localSettings } });
    setRequiresConfirm('confirm');
    setConfirmInput('');
  };

  const updateSettingsPatch = async (patch: Record<string, any>, confirmWord?: string) => {
    const payload = { ...patch, ...(confirmWord ? { confirm: confirmWord } : {}) };

    try {
      setUpdating(true);
      await aiAPI.adminUpdateSettings(payload);
      setLocalSettings((prev) => ({ ...prev, ...patch }));
      setError(null);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.detail || err?.response?.data?.error || err?.message;
      const status = err?.response?.status;
      setError(
        `Failed to update model preset${status ? ` (HTTP ${status})` : ''}${backendMsg ? `: ${backendMsg}` : ''}`,
      );
      console.error('[admin/ai] updateSettingsPatch error:', 'payload:', payload, 'status:', status, 'body:', err?.response?.data, err);
    } finally {
      setUpdating(false);
    }
  };

  const updateSetting = async (field: string, value: any, confirmWord?: string) => {
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

    // Backend requires confirm="KILL" for disabling AI globally and confirm="confirm"
    // for model changes. Auto-attach the right token based on field + value.
    if (confirmWord) {
      payload.confirm = confirmWord;
    } else if (field === 'ai_enabled' && value === false) {
      payload.confirm = 'KILL';
    } else if (field === 'primary_model' || field === 'fallback_model') {
      payload.confirm = 'confirm';
    }

    try {
      setUpdating(true);
      await aiAPI.adminUpdateSettings(payload);
      setLocalSettings({ ...localSettings, [field]: value });
      setError(null);
    } catch (err: any) {
      const backendMsg = err?.response?.data?.detail || err?.response?.data?.error || err?.message;
      const status = err?.response?.status;
      setError(
        `Failed to update ${field}${status ? ` (HTTP ${status})` : ''}${backendMsg ? `: ${backendMsg}` : ''}`,
      );
      console.error('[admin/ai] updateSetting error:', field, 'payload:', payload, 'status:', status, 'body:', err?.response?.data, err);
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
              backgroundColor: `${colors.amber}15`,
              border: `1px solid ${colors.amber}`,
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

  const costs_7d = dashboardData?.costs_7d || { total: 0, by_model: {}, by_provider: {} };
  const corrections_7d = dashboardData?.corrections_7d || 0;
  const override_rate_7d = dashboardData?.override_rate_7d || 0;
  const users_opted_in = dashboardData?.users_opted_in || { enabled: 0, total: 0 };
  const feature_breakdown = dashboardData?.feature_breakdown || [];
  const activity_log = dashboardData?.activity_log || [];
  const top_overridden = dashboardData?.top_overridden || [];
  const top_cost_users = dashboardData?.top_cost_users || [];
  const guardrail_alerts = dashboardData?.guardrail_alerts || { blocked_7d: [], hard_limit_aborts_30d: [] };

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
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '1.25rem',
              padding: '0.75rem',
              border: `1px solid ${colors.divider}`,
              borderRadius: '0.75rem',
              backgroundColor: colors.cardBg,
            }}
          >
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ color: colors.text, fontWeight: 600, fontSize: '0.9rem' }}>
                Recommended mode: GPT router primary, Anthropic fallback
              </div>
              <div style={{ color: colors.textFaint, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Costs still log by user, provider, model, tokens, and fallback usage.
              </div>
            </div>
            <Button
              onClick={() => applyModelPreset('gpt-router-recommended', 'claude-sonnet-4-6')}
              disabled={updating}
            >
              Use GPT Router
            </Button>
            <Button
              variant="secondary"
              onClick={() => applyModelPreset('claude-sonnet-4-6', 'claude-haiku-4-5-20251001')}
              disabled={updating}
            >
              Use Anthropic Manual
            </Button>
          </div>
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
                {FALLBACK_MODEL_OPTIONS.map((opt) => (
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
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Active Model</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>
              {shortModelName(localSettings.primary_model)}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textFaint }}>
              Fallback: {shortModelName(localSettings.fallback_model)}
            </div>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>7-day cost</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              ${costs_7d.total?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textFaint, marginTop: '0.5rem' }}>
              {costs_7d.run_count || 0} runs
            </div>
            {costs_7d.by_provider && Object.keys(costs_7d.by_provider).length > 0 && (
              <div style={{ fontSize: '0.7rem', color: colors.textFaint, marginTop: '0.35rem' }}>
                {Object.entries(costs_7d.by_provider)
                  .map(([provider, cost]: [string, any]) => `${provider}: $${Number(cost || 0).toFixed(2)}`)
                  .join(' / ')}
              </div>
            )}
          </Card>

          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>7-day corrections</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              {corrections_7d}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textFaint, marginTop: '0.5rem' }}>
              applied
            </div>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Override rate (7d)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              {(override_rate_7d * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textFaint, marginTop: '0.5rem' }}>
              of applied
            </div>
          </Card>

          <Card style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: colors.textFaint, marginBottom: '0.5rem' }}>Users opted-in</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
              {users_opted_in.enabled} / {users_opted_in.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: colors.textFaint, marginTop: '0.5rem' }}>
              Ultra users
            </div>
          </Card>
        </div>

        {/* Row 2: Feature Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {[
            { name: 'Paycheck Forecast', key: 'Paycheck Forecast' },
            { name: 'Classification Audit', key: 'Classification' },
            { name: 'Savings Chain', key: 'Savings Chain' },
          ].map((feat) => {
            const data = feature_breakdown.find((f: any) => f.feature === feat.key) || {
              feature: feat.key,
              total: 0,
              applied: 0,
              flagged: 0,
              blocked: 0,
              avg_confidence: 0,
              cost: 0,
            };
            return (
              <Card key={feat.key} style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>
                  {feat.name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                  <div>
                    <div style={{ color: colors.textFaint }}>Calls</div>
                    <div style={{ color: colors.text, fontWeight: 600 }}>{data.total}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textFaint }}>Applied</div>
                    <div style={{ color: '#059669', fontWeight: 600 }}>{data.applied}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textFaint }}>Flagged</div>
                    <div style={{ color: '#D97706', fontWeight: 600 }}>{data.flagged}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textFaint }}>Blocked</div>
                    <div style={{ color: '#DC2626', fontWeight: 600 }}>{data.blocked}</div>
                  </div>
                  <div>
                    <div style={{ color: colors.textFaint }}>Confidence</div>
                    <div style={{ color: colors.text, fontWeight: 600 }}>
                      {((data.avg_confidence ?? 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textFaint }}>Cost</div>
                    <div style={{ color: colors.text, fontWeight: 600 }}>${data.cost?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Row 3: Activity log */}
        <Card style={{ padding: '1rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
            Activity Log
          </h3>
          {activity_log.length === 0 ? (
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
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.divider}` }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Trigger</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Provider</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Model</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Started</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Cost</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: colors.textFaint, fontWeight: 600 }}>Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {activity_log.slice(0, 50).map((run: any) => (
                    <tr key={run.id} style={{ borderBottom: `1px solid ${colors.divider}` }}>
                      <td style={{ padding: '0.75rem', color: colors.text }}>
                        <Link
                          href={`/app/admin/ai/runs?id=${run.id}`}
                          style={{ color: colors.electric, textDecoration: 'none', cursor: 'pointer' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {run.email || 'Unknown'}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.textFaint, textTransform: 'capitalize' }}>
                        {run.trigger_type || 'auto'}
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.textFaint, textTransform: 'capitalize' }}>
                        {run.provider || (String(run.model || '').startsWith('gpt-') ? 'openai' : 'anthropic')}
                        {run.fallback_used ? ' fallback' : ''}
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.textFaint, fontSize: '0.75rem' }}>
                        {run.router_mode ? `${shortModelName(run.router_mode)} -> ${shortModelName(run.model)}` : shortModelName(run.model)}
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.textFaint, fontSize: '0.75rem' }}>
                        {new Date(run.started_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.text }}>
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td style={{ padding: '0.75rem', color: colors.text, fontWeight: 600 }}>
                        ${run.cost_usd?.toFixed(4) || '0.00'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor:
                              run.status === 'completed' ? '#D1FAE5' :
                              run.status === 'failed' ? '#FEE2E2' :
                              run.status === 'running' ? '#E0E7FF' : '#E5E7EB',
                            color:
                              run.status === 'completed' ? '#065F46' :
                              run.status === 'failed' ? '#991B1B' :
                              run.status === 'running' ? '#312E81' : '#374151',
                          }}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        {run.corrections_applied || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Row 4: Quality signals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <Card style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
              Top overridden corrections (30d)
            </h3>
            {top_overridden.length === 0 ? (
              <div style={{ color: colors.textFaint, fontSize: '0.85rem' }}>No overrides yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {top_overridden.slice(0, 10).map((item: any) => (
                  <div key={item.correction_type} style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ color: colors.text, fontWeight: 500 }}>{item.correction_type}</div>
                      <div style={{ color: '#DC2626', fontWeight: 600 }}>
                        {(item.revert_rate * 100).toFixed(0)}% override
                      </div>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: colors.cardBorder,
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: '#DC2626',
                          width: `${Math.min(item.revert_rate * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div style={{ color: colors.textFaint, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {item.revert_count} reverted of {item.total_applied_ever} applied
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
              Top cost users (30d)
            </h3>
            {top_cost_users.length === 0 ? (
              <div style={{ color: colors.textFaint, fontSize: '0.85rem' }}>No audit runs yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {top_cost_users.slice(0, 10).map((item: any) => (
                  <div key={item.email} style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ color: colors.text, fontWeight: 500 }}>{item.email}</div>
                      <div style={{ color: colors.electric, fontWeight: 600 }}>
                        ${item.cost_30d?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div style={{ color: colors.textFaint, fontSize: '0.75rem' }}>
                      {item.runs_30d} runs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Row 5: Guardrail alerts */}
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: colors.text }}>
            Guardrail Alerts
          </h3>
          {guardrail_alerts.blocked_7d.length === 0 && guardrail_alerts.hard_limit_aborts_30d.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: colors.textFaint,
                fontSize: '0.9rem',
              }}
            >
              No guardrail violations.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {guardrail_alerts.blocked_7d.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: colors.text }}>
                    Blocked corrections (7d)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {guardrail_alerts.blocked_7d.map((alert: any) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: colors.cardBg,
                          borderLeft: `3px solid #DC2626`,
                          borderRadius: '0.25rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ color: colors.text, fontWeight: 500, marginBottom: '0.25rem' }}>
                          {alert.target_description || 'Unknown target'}
                        </div>
                        <div style={{ color: colors.textFaint, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          Reason: {alert.block_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {guardrail_alerts.hard_limit_aborts_30d.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', fontWeight: 600, color: colors.text }}>
                    Hard-limit aborts (30d)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {guardrail_alerts.hard_limit_aborts_30d.map((alert: any) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: colors.cardBg,
                          borderLeft: `3px solid #D97706`,
                          borderRadius: '0.25rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ color: colors.text, fontWeight: 500, marginBottom: '0.25rem' }}>
                          {alert.email || 'Unknown user'}
                        </div>
                        <div style={{ color: colors.textFaint, fontSize: '0.8rem' }}>
                          Reason: {alert.abort_reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
            <Button variant="secondary" onClick={() => {
              // Revert dropdown to previous value if cancelled
              if (pendingChange && pendingChange.previousValue !== undefined) {
                if (pendingChange.field === 'model_preset') {
                  setLocalSettings(pendingChange.previousValue);
                } else {
                  setLocalSettings(prev => ({ ...prev, [pendingChange.field]: pendingChange.previousValue }));
                }
              }
              setRequiresConfirm(null);
              setPendingChange(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingChange) {
                  confirmUpdate(pendingChange.field, pendingChange.value);
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
