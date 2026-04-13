'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';

interface ExclusionRule {
  id: string;
  merchant_pattern: string;
  created_at: string;
}

export default function ExclusionsPage() {
  const { colors } = useTheme();

  const [rules, setRules] = useState<ExclusionRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPattern, setNewPattern] = useState('');
  const [addingRule, setAddingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getExclusionRules();
      setRules(Array.isArray(res.data?.rules) ? res.data.rules : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch exclusion rules:', err);
      setError('Failed to load exclusion rules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newPattern.trim()) {
      alert('Please enter a merchant name or pattern');
      return;
    }

    setAddingRule(true);
    try {
      await bankingAPI.addExclusionRule({ merchant_pattern: newPattern });
      setNewPattern('');
      await fetchRules();
    } catch (err) {
      console.error('Failed to add rule:', err);
      alert('Failed to add exclusion rule');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    setDeletingRuleId(id);
    try {
      await bankingAPI.deleteExclusionRule(id);
      setRules(rules.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
      alert('Failed to delete exclusion rule');
    } finally {
      setDeletingRuleId(null);
    }
  };

  return (
    <AppLayout pageTitle="Exclusion Rules">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header back button */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app/banking" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={18} style={{ color: colors.text }} />
            </Button>
          </Link>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.95rem' }}>
            Manage merchants and patterns to ignore from suggestions
          </p>
        </div>

      {/* Error State */}
      {error && (
        <Card
          style={{
            backgroundColor: `${colors.red}15`,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} style={{ color: colors.red, flexShrink: 0 }} />
          <p style={{ color: colors.red, margin: 0, fontSize: '0.95rem' }}>
            {error}
          </p>
        </Card>
      )}

      {/* Add Rule Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
          Add New Rule
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Input
            placeholder="Enter merchant name or pattern (e.g., 'Starbucks', 'Amazon*')"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddRule();
            }}
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleAddRule}
            loading={addingRule}
            disabled={addingRule || !newPattern.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Plus size={18} />
          </Button>
        </div>

        <p style={{ color: colors.textMuted, fontSize: '0.825rem', margin: '0.75rem 0 0 0' }}>
          Patterns support wildcards (*) for partial matching
        </p>
      </Card>

      {/* Loading State */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading exclusion rules...</p>
        </Card>
      ) : rules.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: colors.background,
          }}
        >
          <AlertCircle size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            No exclusion rules yet
          </h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            Create rules to ignore specific merchants from bill suggestions
          </p>
        </Card>
      ) : (
        <Card>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
            Active Rules
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: colors.background,
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.divider}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: 0 }}>
                    {rule.merchant_pattern}
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
                    Added {rule.created_at && !isNaN(new Date(rule.created_at).getTime()) ? new Date(rule.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                  loading={deletingRuleId === rule.id}
                  disabled={deletingRuleId !== null}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '1.5rem 0 0 0', paddingTop: '1rem', borderTop: `1px solid ${colors.divider}` }}>
            Transactions from merchants matching these patterns will be excluded from bill suggestions and auto-matching.
          </p>
        </Card>
      )}
      </div>
    </AppLayout>
  );
}
