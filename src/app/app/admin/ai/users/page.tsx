'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { aiAPI } from '@/lib/api';
import { Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function AdminAIUsersPage() {
  const { colors } = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFlagsModal, setShowFlagsModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      await aiAPI.adminGetSettings();
      loadUsers();
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/app');
      } else {
        setError('Failed to load users');
      }
      setLoading(false);
    }
  };

  const loadUsers = async (query = '') => {
    try {
      setLoading(true);
      const res = await aiAPI.adminGetUsers(query, 0);
      setUsers(res?.data?.users || []);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length > 0) {
      loadUsers(value);
    } else {
      loadUsers();
    }
  };

  const disableUserAI = async (userId: string) => {
    try {
      setActionInProgress(true);
      await aiAPI.adminDisableUserAi(userId, 'Admin action');
      await loadUsers(search);
    } catch (err) {
      setError('Failed to disable user AI');
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <AppLayout pageTitle="AI Users">
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
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

        {/* Search */}
        <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Search size={18} style={{ color: colors.textFaint }} />
            <Input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        </Card>

        {/* Users table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: colors.text }}>
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: colors.textFaint }}>
              No users found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${colors.divider}`,
                      backgroundColor: colors.cardBg,
                    }}
                  >
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      Plan
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      AI Enabled
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      Consent Version
                    </th>
                    <th
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: idx < users.length - 1 ? `1px solid ${colors.divider}` : 'none',
                      }}
                    >
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: colors.text }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: colors.textFaint }}>
                        {user.plan || 'free'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: colors.text }}>
                        {user.ai_enabled ? '✓' : ''}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: colors.textFaint }}>
                        {user.consent_version || '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowFlagsModal(true);
                            }}
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                          >
                            Flags
                          </Button>
                          {user.ai_enabled && (
                            <Button
                              onClick={() => disableUserAI(user.id)}
                              disabled={actionInProgress}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#EF4444',
                              }}
                            >
                              Disable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Flags Modal */}
      <Modal isOpen={showFlagsModal} onClose={() => setShowFlagsModal(false)}>
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text, fontSize: '1rem' }}>
            Per-feature flags for {selectedUser?.email}
          </h3>
          <p style={{ color: colors.textFaint, fontSize: '0.9rem', marginBottom: '1rem' }}>
            Phase 0: No per-feature flags configured yet.
          </p>
          <Button variant="secondary" onClick={() => setShowFlagsModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
