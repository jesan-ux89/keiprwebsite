'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, AlertCircle, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  transaction_name: string;
  transaction_amount: number;
  bill_name: string;
  bill_id?: string;
  bill_amount: number;
  matched_at: string;
  transaction_date: string;
}

export default function HistoryPage() {
  const { colors } = useTheme();
  const { bills } = useApp();

  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<string>('');
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    // Apply filter
    if (selectedBill) {
      setFilteredMatches(matches.filter((m) => m.bill_id === selectedBill));
    } else {
      setFilteredMatches(matches);
    }
    setPage(1);
  }, [selectedBill, matches]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getMatchHistory();
      setMatches(Array.isArray(res.data?.matches) ? res.data.matches : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch match history:', err);
      setError('Failed to load match history');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (id: string) => {
    if (!window.confirm('Are you sure you want to unlink this match?')) return;

    setUnlinking(id);
    try {
      await bankingAPI.unlinkMatch(id);
      setMatches(matches.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to unlink match:', err);
      alert('Failed to unlink match');
    } finally {
      setUnlinking(null);
    }
  };

  const paginatedMatches = filteredMatches.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={18} style={{ color: colors.text }} />
          </Button>
        </Link>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            Match History
          </h1>
          <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            View all confirmed transaction-to-bill matches
          </p>
        </div>
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

      {/* Filter Section */}
      {!loading && matches.length > 0 && (
        <Card style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={18} style={{ color: colors.textMuted }} />
          <select
            value={selectedBill}
            onChange={(e) => setSelectedBill(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: colors.background,
              border: `1px solid ${colors.divider}`,
              borderRadius: '0.5rem',
              color: colors.text,
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <option value="">All Bills</option>
            {bills.map((bill) => (
              <option key={bill.id} value={bill.id}>
                {bill.name}
              </option>
            ))}
          </select>
          <span style={{ color: colors.textMuted, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
          </span>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading match history...</p>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: colors.background,
          }}
        >
          <AlertCircle size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            No matches yet
          </h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            {selectedBill
              ? 'No matches for this bill'
              : 'Once you confirm transaction matches, they will appear here.'}
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {paginatedMatches.map((match) => (
              <Card key={match.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 0.5rem 0' }}>
                          Transaction
                        </h3>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: '0 0 0.25rem 0' }}>
                          {match.transaction_name}
                        </p>
                        <p style={{ color: colors.textMuted, fontSize: '0.825rem', margin: 0 }}>
                          {new Date(match.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                          ${(match.transaction_amount ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: '1rem',
                        borderTop: `1px solid ${colors.divider}`,
                        display: 'flex',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.textMuted, margin: '0 0 0.5rem 0' }}>
                          Bill
                        </h3>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: colors.text, margin: '0 0 0.25rem 0' }}>
                          {match.bill_name}
                        </p>
                        <p style={{ color: colors.textMuted, fontSize: '0.825rem', margin: 0 }}>
                          Matched {new Date(match.matched_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                          ${(match.bill_amount ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUnlink(match.id)}
                    loading={unlinking === match.id}
                    disabled={unlinking !== null}
                    style={{ marginLeft: '1rem', whiteSpace: 'nowrap' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={page === p ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
