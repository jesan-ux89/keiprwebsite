'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { bankingAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, AlertCircle, Plus, Link as LinkIcon, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

type TransactionStatus = 'possible_bill' | 'matched' | 'likely_not_bill' | 'auto_excluded' | 'user_excluded';

interface Transaction {
  id: string;
  merchant_name: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  confidence_score?: number;
  linked_bill_id?: string;
  linked_bill_name?: string;
  exclusion_reason?: string;
}

interface SummaryStats {
  total_transactions: number;
  possible_bills: number;
  matched: number;
  likely_not_bills: number;
  auto_excluded: number;
  user_excluded: number;
}

const STATUS_COLORS: Record<TransactionStatus, { bg: string; text: string; label: string }> = {
  possible_bill: { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', label: 'Possible Bill' },
  matched: { bg: 'rgba(52,211,153,0.15)', text: '#34D399', label: 'Matched' },
  likely_not_bill: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'Likely Not Bill' },
  auto_excluded: { bg: 'rgba(248,113,113,0.15)', text: '#F87171', label: 'Auto-Excluded' },
  user_excluded: { bg: 'rgba(200,200,200,0.15)', text: '#999999', label: 'User-Excluded' },
};

export default function AllTransactionsPage() {
  const { colors } = useTheme();
  const { isUltra, fmt, bills } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'all'>('all');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [actioning, setActioning] = useState<string | null>(null);
  const itemsPerPage = 50;

  useEffect(() => {
    if (isUltra) {
      fetchTransactions();
    }
  }, [isUltra]);

  useEffect(() => {
    // Apply filter
    if (selectedStatus === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.status === selectedStatus));
    }
    setPage(1);
  }, [selectedStatus, transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await bankingAPI.getAllTransactions();
      const txns = Array.isArray(res.data?.transactions) ? res.data.transactions : [];
      setTransactions(txns);
      setSummary(res.data?.summary || null);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsBill = async (transaction: Transaction) => {
    setActioning(transaction.id);
    try {
      await bankingAPI.transactionAction(transaction.id, { action: 'add_as_bill' });
      setTransactions(transactions.filter((t) => t.id !== transaction.id));
      alert('Bill added! You can edit it in your bills list.');
    } catch (err) {
      console.error('Failed to add bill:', err);
      alert('Failed to add bill');
    } finally {
      setActioning(null);
    }
  };

  const handleLinkToExisting = async (transaction: Transaction) => {
    if (bills.length === 0) {
      alert('No bills to link to. Create a bill first.');
      return;
    }

    const billId = window.prompt('Enter bill ID or select from your bills (feature: bill picker coming soon)');
    if (!billId) return;

    setActioning(transaction.id);
    try {
      await bankingAPI.transactionAction(transaction.id, { action: 'link_to_bill', bill_id: billId });
      const updated = transactions.map((t) =>
        t.id === transaction.id
          ? { ...t, status: 'matched' as TransactionStatus, linked_bill_id: billId }
          : t
      );
      setTransactions(updated);
      alert('Transaction linked to bill');
    } catch (err) {
      console.error('Failed to link transaction:', err);
      alert('Failed to link transaction');
    } finally {
      setActioning(null);
    }
  };

  const handleIgnoreOnce = async (transaction: Transaction) => {
    setActioning(transaction.id);
    try {
      await bankingAPI.transactionAction(transaction.id, { action: 'ignore_once' });
      setTransactions(transactions.filter((t) => t.id !== transaction.id));
    } catch (err) {
      console.error('Failed to ignore transaction:', err);
      alert('Failed to ignore transaction');
    } finally {
      setActioning(null);
    }
  };

  const handleAlwaysIgnore = async (transaction: Transaction) => {
    setActioning(transaction.id);
    try {
      await bankingAPI.transactionAction(transaction.id, { action: 'always_ignore' });
      const updated = transactions.map((t) =>
        t.id === transaction.id ? { ...t, status: 'user_excluded' as TransactionStatus } : t
      );
      setTransactions(updated);
    } catch (err) {
      console.error('Failed to ignore transaction:', err);
      alert('Failed to ignore transaction');
    } finally {
      setActioning(null);
    }
  };

  const handleUnlink = async (transaction: Transaction) => {
    if (!window.confirm('Unlink this transaction from its bill?')) return;

    setActioning(transaction.id);
    try {
      await bankingAPI.transactionAction(transaction.id, { action: 'unlink' });
      const updated = transactions.map((t) =>
        t.id === transaction.id
          ? { ...t, status: 'possible_bill' as TransactionStatus, linked_bill_id: undefined, linked_bill_name: undefined }
          : t
      );
      setTransactions(updated);
    } catch (err) {
      console.error('Failed to unlink transaction:', err);
      alert('Failed to unlink transaction');
    } finally {
      setActioning(null);
    }
  };

  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  if (!isUltra) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/app/banking" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">
              <ChevronLeft size={18} style={{ color: colors.text }} />
            </Button>
          </Link>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
              All Transactions
            </h1>
          </div>
        </div>
        <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={48} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ color: colors.text, margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            Ultra Plan Required
          </h2>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.95rem' }}>
            View all transactions and their banking analysis with Ultra plan
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/app/banking" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm">
            <ChevronLeft size={18} style={{ color: colors.text }} />
          </Button>
        </Link>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: colors.text, margin: 0 }}>
            All Transactions
          </h1>
          <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
            Review and manage all synced transactions
          </p>
        </div>
      </div>

      {/* Summary Bar */}
      {summary && !loading && (
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                TOTAL
              </p>
              <p style={{ color: colors.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {summary.total_transactions}
              </p>
            </div>
            <div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                POSSIBLE BILLS
              </p>
              <p style={{ color: colors.electric, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {summary.possible_bills}
              </p>
            </div>
            <div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                MATCHED
              </p>
              <p style={{ color: colors.green, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {summary.matched}
              </p>
            </div>
            <div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                LIKELY NOT BILLS
              </p>
              <p style={{ color: colors.amber, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {summary.likely_not_bills}
              </p>
            </div>
            <div>
              <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                EXCLUDED
              </p>
              <p style={{ color: colors.red, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                {summary.auto_excluded + summary.user_excluded}
              </p>
            </div>
          </div>
        </Card>
      )}

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

      {/* Category Tabs */}
      {!loading && transactions.length > 0 && (
        <Card style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={selectedStatus === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            All ({transactions.length})
          </Button>
          <Button
            variant={selectedStatus === 'possible_bill' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('possible_bill')}
          >
            Possible Bills ({summary?.possible_bills || 0})
          </Button>
          <Button
            variant={selectedStatus === 'matched' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('matched')}
          >
            Matched ({summary?.matched || 0})
          </Button>
          <Button
            variant={selectedStatus === 'likely_not_bill' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('likely_not_bill')}
          >
            Likely Not Bills ({summary?.likely_not_bills || 0})
          </Button>
          <Button
            variant={selectedStatus === 'auto_excluded' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('auto_excluded')}
          >
            Auto-Excluded ({summary?.auto_excluded || 0})
          </Button>
          <Button
            variant={selectedStatus === 'user_excluded' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedStatus('user_excluded')}
          >
            User-Excluded ({summary?.user_excluded || 0})
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: colors.textMuted }}>Loading transactions...</p>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: colors.background,
          }}
        >
          <Eye size={40} style={{ color: colors.textMuted, marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.5rem 0' }}>
            No transactions
          </h2>
          <p style={{ color: colors.textMuted, margin: 0 }}>
            {selectedStatus === 'all'
              ? 'Connect your bank account on the mobile app to sync transactions'
              : `No transactions in this category yet`}
          </p>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {paginatedTransactions.map((transaction) => {
              const statusConfig = STATUS_COLORS[transaction.status];
              const confidence = transaction.confidence_score
                ? Math.round(transaction.confidence_score * 100)
                : null;

              return (
                <Card key={transaction.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Transaction Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                          {transaction.merchant_name}
                        </h3>
                        <div
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.text,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '0.25rem',
                          }}
                        >
                          {statusConfig.label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
                        <span style={{ color: colors.textMuted }}>
                          {transaction.date && !isNaN(new Date(transaction.date).getTime())
                            ? new Date(transaction.date).toLocaleDateString()
                            : 'Unknown date'}
                        </span>
                        {confidence !== null && (
                          <span style={{ color: colors.textMuted }}>
                            Confidence: <strong>{confidence}%</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: colors.text, margin: 0 }}>
                        {fmt(transaction.amount ?? 0)}
                      </p>
                    </div>
                  </div>

                  {/* Context Info */}
                  {transaction.linked_bill_name && (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: colors.background,
                        borderRadius: '0.5rem',
                        borderLeft: `3px solid ${colors.green}`,
                      }}
                    >
                      <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>
                        LINKED BILL
                      </p>
                      <p style={{ color: colors.text, fontSize: '0.9rem', margin: 0 }}>
                        {transaction.linked_bill_name}
                      </p>
                    </div>
                  )}

                  {transaction.exclusion_reason && (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: colors.background,
                        borderRadius: '0.5rem',
                        borderLeft: `3px solid ${colors.red}`,
                      }}
                    >
                      <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>
                        EXCLUSION REASON
                      </p>
                      <p style={{ color: colors.text, fontSize: '0.9rem', margin: 0 }}>
                        {transaction.exclusion_reason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {transaction.status === 'possible_bill' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddAsBill(transaction)}
                          loading={actioning === transaction.id}
                          disabled={actioning !== null}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Plus size={14} />
                          Add as Bill
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleLinkToExisting(transaction)}
                          loading={actioning === transaction.id}
                          disabled={actioning !== null}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <LinkIcon size={14} />
                          Link to Existing
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleIgnoreOnce(transaction)}
                          loading={actioning === transaction.id}
                          disabled={actioning !== null}
                        >
                          Ignore Once
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAlwaysIgnore(transaction)}
                          loading={actioning === transaction.id}
                          disabled={actioning !== null}
                        >
                          Always Ignore
                        </Button>
                      </>
                    )}

                    {transaction.status === 'matched' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUnlink(transaction)}
                        loading={actioning === transaction.id}
                        disabled={actioning !== null}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={14} />
                        Unlink
                      </Button>
                    )}

                    {transaction.status === 'user_excluded' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleIgnoreOnce(transaction)}
                        loading={actioning === transaction.id}
                        disabled={actioning !== null}
                      >
                        Remove Exclusion
                      </Button>
                    )}

                    {(transaction.status === 'likely_not_bill' || transaction.status === 'auto_excluded') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddAsBill(transaction)}
                        loading={actioning === transaction.id}
                        disabled={actioning !== null}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={14} />
                        Add as Bill
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
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

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page - 2 + i;
                return p > 0 && p <= totalPages ? (
                  <Button
                    key={p}
                    variant={page === p ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ) : null;
              })}

              {totalPages > 5 && page < totalPages - 2 && (
                <span style={{ color: colors.textMuted }}>...</span>
              )}

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
