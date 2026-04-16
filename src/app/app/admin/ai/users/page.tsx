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

  const loadUsers = async (query = '', offset = 0) => {
    try {
      setLoading(true);
      const res = await aiAPI.adminGetUsers(query, offset);
      setUsers(res?.data?.users || []);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [disablingUserId, setDisablingUserId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleShowFlagsModal = (user: any) => {
    setSelectedUser(user);
    setShowFlagsModal(true);
  };

  const handleDisableClick = (user: any) => {
    setDisablingUserId(user.id);
    setDisableReason('');
    setShowDisableModal(true);
  };

  const handleConfirmDisable = async () => {
    if (!disablingUserId) return;
    try {
      setActionInProgress(true);
      await aiAPI.adminDisableUserAi(disablingUserId, disableReason || 'Admin action');
      await loadUsers(search);
      setShowDisableModal(false);
      setDisablingUserId(null);
      setDisableReason('');
    } catch (err) {
      setError('Failed to disable user AI');
      console.error(err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    // Debounce the search
    const timer = setTimeout(() => {
      if (value.length > 0) {
        loadUsers(value);
      } else {
        loadUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
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
                      Last Run
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
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: colors.textFaint }}>
                        {user.last_run_at ? new Date(user.last_run_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Button
                            variant="secondary"
                            onClick={() => handleShowFlagsModal(user)}
                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                          >
                            Flags
                          </Button>
                          {user.ai_enabled && (
                            <Button
                              onClick={() => handleDisableClick(user)}
                              disabled={actionInProgress}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#EF4444',
                                color: '#fff',
                                border: 'none',
                                cursor: actionInProgress ? 'default' : 'pointer',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                defaultChecked={!selectedUser?.ai_accountant_paycheck_assignment_disabled}
                onChange={(e) => {
                  // Handle flag update
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: colors.text, fontSize: '0.9rem' }}>Paycheck forecasting</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                defaultChecked={!selectedUser?.ai_accountant_classification_audit_disabled}
                onChange={(e) => {
                  // Handle flag update
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: colors.text, fontSize: '0.9rem' }}>Classification audit</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                defaultChecked={!selectedUser?.ai_accountant_savings_chain_disabled}
                onChange={(e) => {
                  // Handle flag update
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ color: colors.text, fontSize: '0.9rem' }}>Savings chain detection</span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowFlagsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disable AI Modal */}
      <Modal isOpen={showDisableModal} onClose={() => setShowDisableModal(false)}>
        <div style={{ maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: colors.text, fontSize: '1rem' }}>
            Disable AI for {selectedUser?.email}?
          </h3>
          <p style={{ color: colors.textFaint, fontSize: '0.9rem', marginBottom: '1rem' }}>
            This user will no longer receive AI audit corrections.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: colors.text }}>
              Reason (optional)
            </label>
            <textarea
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
              placeholder="Why are you disabling AI for this user?"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${colors.divider}`,
                borderRadius: '0.375rem',
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                minHeight: '60px',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowDisableModal(false)} disabled={actionInProgress}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDisable}
              disabled={actionInProgress}
              style={{
                backgroundColor: '#EF4444',
                color: '#fff',
              }}
            >
              {actionInProgress ? 'Disabling…' : 'Disable AI'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
