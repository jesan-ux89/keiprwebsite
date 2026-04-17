'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserRow {
  id: string;
  email: string;
  plan: string;
  created_at: string;
  ai_enabled: boolean;
  bill_count: number;
  bank_connections: number;
}

interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { colors, isDark } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'admins'>('users');

  // User management state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [userOffset, setUserOffset] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteResult, setDeleteResult] = useState('');

  // Admin users state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (isAdmin === false) router.push('/app');
  }, [isAdmin, router]);

  // Load users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.listUsers(userSearch, userOffset);
      setUsers(res.data?.users || []);
      setUserTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userOffset]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setUserOffset(0);
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load admins
  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await adminAPI.listAdmins();
      setAdmins(res.data?.admins || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admins') loadAdmins();
  }, [activeTab, loadAdmins]);

  // Delete user
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    setDeleteResult('');
    try {
      const res = await adminAPI.deleteUser(deleteTarget.id, deleteConfirmEmail);
      setDeleteResult(res.data?.message || 'Account deleted');
      setTimeout(() => {
        setDeleteTarget(null);
        setDeleteConfirmEmail('');
        setDeleteResult('');
        loadUsers();
      }, 2000);
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Add admin
  const handleAddAdmin = async () => {
    if (!newAdminEmail.includes('@')) return;
    setAdminError('');
    setAdminSuccess('');
    try {
      const res = await adminAPI.addAdmin(newAdminEmail);
      setAdminSuccess(res.data?.message || 'Admin added');
      setNewAdminEmail('');
      loadAdmins();
    } catch (err: any) {
      setAdminError(err.response?.data?.error || 'Failed to add admin');
    }
  };

  // Remove admin
  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    try {
      await adminAPI.removeAdmin(admin.id);
      loadAdmins();
    } catch (err: any) {
      setAdminError(err.response?.data?.error || 'Failed to remove admin');
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const planBadge = (plan: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      ultra: { bg: 'rgba(147, 51, 234, 0.15)', text: '#9333EA' },
      pro: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
      free: { bg: isDark ? 'rgba(160,160,160,0.15)' : 'rgba(100,100,100,0.12)', text: colors.textMuted },
    };
    const style = map[plan] || map.free;
    return (
      <span style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        backgroundColor: style.bg,
        color: style.text,
      }}>
        {plan || 'free'}
      </span>
    );
  };

  if (!isAdmin) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>
          Admin Dashboard
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage users and admin access
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: '0.5rem', padding: '0.25rem' }}>
        {(['users', 'admins'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: activeTab === tab ? (isDark ? 'rgba(255,255,255,0.12)' : '#fff') : 'transparent',
              color: activeTab === tab ? colors.text : colors.textMuted,
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'users' ? 'User Management' : 'Admin Users'}
          </button>
        ))}
      </div>

      {/* ════════════════ USER MANAGEMENT TAB ════════════════ */}
      {activeTab === 'users' && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by email..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Results count */}
          <p style={{ fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.75rem' }}>
            {userTotal} user{userTotal !== 1 ? 's' : ''} found
            {userSearch && ` matching "${userSearch}"`}
          </p>

          {/* User list */}
          {usersLoading ? (
            <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.625rem',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </span>
                      {planBadge(user.plan)}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: colors.textMuted }}>
                      <span>{user.bill_count} bills</span>
                      <span>{user.bank_connections} bank{user.bank_connections !== 1 ? 's' : ''}</span>
                      <span>Joined {formatDate(user.created_at)}</span>
                      <span>{user.ai_enabled ? 'AI on' : ''}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setDeleteTarget(user); setDeleteConfirmEmail(''); setDeleteError(''); setDeleteResult(''); }}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`,
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}

              {users.length === 0 && (
                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>
                  No users found
                </p>
              )}
            </div>
          )}

          {/* Pagination */}
          {userTotal > 50 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                disabled={userOffset === 0}
                onClick={() => setUserOffset(Math.max(0, userOffset - 50))}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.cardBg,
                  color: userOffset === 0 ? colors.textFaint : colors.text,
                  fontSize: '0.8rem',
                  cursor: userOffset === 0 ? 'default' : 'pointer',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', color: colors.textMuted, padding: '0.4rem 0.5rem' }}>
                {userOffset + 1}–{Math.min(userOffset + 50, userTotal)} of {userTotal}
              </span>
              <button
                disabled={userOffset + 50 >= userTotal}
                onClick={() => setUserOffset(userOffset + 50)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: colors.cardBg,
                  color: userOffset + 50 >= userTotal ? colors.textFaint : colors.text,
                  fontSize: '0.8rem',
                  cursor: userOffset + 50 >= userTotal ? 'default' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ ADMIN USERS TAB ════════════════ */}
      {activeTab === 'admins' && (
        <div>
          {/* Add admin */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}>
            <input
              type="email"
              placeholder="Email address to grant admin access..."
              value={newAdminEmail}
              onChange={e => { setNewAdminEmail(e.target.value); setAdminError(''); setAdminSuccess(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAddAdmin()}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${colors.cardBorder}`,
                backgroundColor: colors.cardBg,
                color: colors.text,
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAddAdmin}
              disabled={!newAdminEmail.includes('@')}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: colors.electric,
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: newAdminEmail.includes('@') ? 'pointer' : 'default',
                opacity: newAdminEmail.includes('@') ? 1 : 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              Add Admin
            </button>
          </div>

          {adminError && (
            <p style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{adminError}</p>
          )}
          {adminSuccess && (
            <p style={{ color: '#22C55E', fontSize: '0.8rem', marginBottom: '1rem' }}>{adminSuccess}</p>
          )}

          {/* Admin list */}
          {adminsLoading ? (
            <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>Loading...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {admins.filter(a => a.is_active).map(admin => (
                <div
                  key={admin.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.625rem',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>
                      {admin.email}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted, marginLeft: '0.75rem' }}>
                      Added {formatDate(admin.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${colors.cardBorder}`,
                      backgroundColor: 'transparent',
                      color: colors.textMuted,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {admins.filter(a => a.is_active).length === 0 && (
                <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>
                  No admin users configured
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ DELETE CONFIRMATION MODAL ════════════════ */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => !deleteLoading && setDeleteTarget(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: colors.cardBg,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.cardBorder}`,
              padding: '1.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Warning header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)'}`,
              marginBottom: '1.25rem',
            }}>
              <p style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                ⚠ WARNING — Permanent Account Deletion
              </p>
              <p style={{ color: isDark ? 'rgba(239,68,68,0.8)' : '#B91C1C', fontSize: '0.8rem', margin: '0.5rem 0 0 0', lineHeight: 1.5 }}>
                This will permanently delete all data for this account including bills, payments, transactions, bank connections, and Firebase auth. Plaid items will be disconnected. This action cannot be undone.
              </p>
            </div>

            {/* User info */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ color: colors.text, fontSize: '0.9rem', margin: 0, fontWeight: 600 }}>
                {deleteTarget.email}
              </p>
              <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                {deleteTarget.plan?.toUpperCase() || 'FREE'} · {deleteTarget.bill_count} bills · {deleteTarget.bank_connections} bank connection{deleteTarget.bank_connections !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Email confirmation input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: colors.textMuted, marginBottom: '0.35rem', fontWeight: 500 }}>
                Type the email address to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmEmail}
                onChange={e => { setDeleteConfirmEmail(e.target.value); setDeleteError(''); }}
                placeholder={deleteTarget.email}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${deleteConfirmEmail.toLowerCase() === deleteTarget.email.toLowerCase() ? '#EF4444' : colors.cardBorder}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  color: colors.text,
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {deleteError && (
              <p style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{deleteError}</p>
            )}
            {deleteResult && (
              <p style={{ color: '#22C55E', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{deleteResult}</p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${colors.cardBorder}`,
                  backgroundColor: 'transparent',
                  color: colors.text,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading || deleteConfirmEmail.toLowerCase() !== deleteTarget.email.toLowerCase()}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: deleteConfirmEmail.toLowerCase() === deleteTarget.email.toLowerCase() ? '#EF4444' : (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)'),
                  color: deleteConfirmEmail.toLowerCase() === deleteTarget.email.toLowerCase() ? '#fff' : (isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)'),
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: deleteConfirmEmail.toLowerCase() === deleteTarget.email.toLowerCase() && !deleteLoading ? 'pointer' : 'default',
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
