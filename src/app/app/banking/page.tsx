'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Landmark,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  InboxIcon,
  CheckCircle2,
  History,
  Ban,
  Plus,
} from 'lucide-react';

interface BankAccount {
  id: string;
  institution_name: string;
  account_name: string;
  account_mask: string;
  is_synced: boolean;
  last_sync: string;
}

interface BankingStatus {
  connected: boolean;
  accounts: number;
  lastSync: string;
}

export default function BankingPage() {
  const { colors } = useTheme();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [status, setStatus] = useState<BankingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchStatus();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getAccounts();
      setAccounts(Array.isArray(res.data?.accounts) ? res.data.accounts : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await bankingAPI.getStatus();
      setStatus(res.data?.status || null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const handleToggleSync = async (id: string, isSynced: boolean) => {
    try {
      await bankingAPI.toggleAccountSync(id, !isSynced);
      setAccounts(
        accounts.map((acc) =>
          acc.id === id ? { ...acc, is_synced: !isSynced } : acc
        )
      );
    } catch (err) {
      console.error('Failed to toggle sync:', err);
      alert('Failed to toggle sync');
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await bankingAPI.triggerSync();
      await fetchStatus();
      alert('Sync triggered! Check back soon for updates.');
    } catch (err) {
      console.error('Failed to trigger sync:', err);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlink = async (id: string) => {
    if (!window.confirm('Are you sure you want to unlink this account?')) return;

    try {
      await bankingAPI.unlinkAccount(id);
      setAccounts(accounts.filter((acc) => acc.id !== id));
    } catch (err) {
      console.error('Failed to unlink account:', err);
      alert('Failed to unlink account');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          Connected Banking
        </h1>
        <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
          Manage your bank connections and transaction suggestions
        </p>
      </div>

      {/* Overview Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1rem 0' }}>
            Overview
          </h2>

          {status && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  Connected Accounts
                </p>
                <p style={{ color: colors.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {status.accounts}
                </p>
              </div>
              <div style={{ padding: '1rem', backgroundColor: colors.background, borderRadius: '0.5rem' }}>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                  Last Sync
                </p>
                <p style={{ color: colors.text, fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                  {status.lastSync && !isNaN(new Date(status.lastSync).getTime()) ? new Date(status.lastSync).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleManualSync}
            loading={syncing}
            disabled={accounts.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            Manual Sync
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={true}
            title="Plaid Link for web is coming soon. Use mobile app for now."
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={18} />
            Connect Bank
          </Button>
        </div>

        <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '1rem 0 0 0' }}>
          Note: Connected banking is best experienced on the mobile app
        </p>
      </Card>

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

      {/* Accounts Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: '0 0 1.5rem 0' }}>
          Accounts
        </h2>

        {loading ? (
          <p style={{ color: colors.textMuted, margin: 0 }}>Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: colors.background,
              borderRadius: '0.75rem',
            }}
          >
            <Landmark size={32} style={{ color: colors.textMuted, marginBottom: '0.75rem' }} />
            <p style={{ color: colors.textMuted, margin: 0 }}>
              No connected accounts yet
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  padding: '1rem',
                  backgroundColor: colors.background,
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.divider}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: colors.text, fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                      {account.institution_name}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>
                      {account.account_name} • {account.account_mask}
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: 0 }}>
                      Last synced: {account.last_sync && !isNaN(new Date(account.last_sync).getTime()) ? new Date(account.last_sync).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={account.is_synced}
                        onChange={(e) =>
                          handleToggleSync(account.id, account.is_synced)
                        }
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ color: colors.text, fontSize: '0.875rem' }}>
                        {account.is_synced ? 'Syncing' : 'Paused'}
                      </span>
                    </label>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUnlink(account.id)}
                    >
                      Unlink
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <Link href="/app/banking/suggestions" style={{ textDecoration: 'none' }}>
          <Card
            onClick={() => {}}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '120px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <InboxIcon size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    Suggestions
                  </h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  Review bill suggestions from your transactions
                </p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>

        <Link href="/app/banking/confirmations" style={{ textDecoration: 'none' }}>
          <Card
            onClick={() => {}}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '120px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    Confirmations
                  </h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  Review matches needing your confirmation
                </p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>

        <Link href="/app/banking/history" style={{ textDecoration: 'none' }}>
          <Card
            onClick={() => {}}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '120px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <History size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    Match History
                  </h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  View all confirmed transaction matches
                </p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>

        <Link href="/app/banking/exclusions" style={{ textDecoration: 'none' }}>
          <Card
            onClick={() => {}}
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '120px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Ban size={20} style={{ color: colors.electric }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                    Exclusion Rules
                  </h3>
                </div>
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
                  Manage ignored merchants and patterns
                </p>
              </div>
              <ChevronRight size={20} style={{ color: colors.textMuted }} />
            </div>
          </Card>
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
