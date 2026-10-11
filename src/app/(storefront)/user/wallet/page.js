'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  Wallet, Coins, Sparkles, ArrowUpRight, ArrowDownLeft, 
  Plus, Gift, ShieldCheck, Crown, ChevronRight, Search, 
  Loader2, CheckCircle2, TrendingUp, RefreshCw, X, ShoppingBag
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';

export default function UserWalletPage() {
  const { user } = useStoreAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modal States
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [isTopupProcessing, setIsTopupProcessing] = useState(false);

  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [coinsToRedeem, setCoinsToRedeem] = useState(100);
  const [isRedeemProcessing, setIsRedeemProcessing] = useState(false);

  async function fetchWallet() {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWallet();
  }, [user]);

  // Handle Add Funds
  async function handleTopupSubmit(e) {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (!amount || amount < 100) {
      showToast.error('Please enter a valid amount (min ₹100)');
      return;
    }

    try {
      setIsTopupProcessing(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'topup', amount })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(data.message || 'Wallet recharged successfully!');
        setWallet(data.wallet);
        setTopupModalOpen(false);
      } else {
        showToast.error(data.message || 'Top-up failed');
      }
    } catch {
      showToast.error('Network error during recharge');
    } finally {
      setIsTopupProcessing(false);
    }
  }

  // Handle Redeem Coins
  async function handleRedeemSubmit(e) {
    e.preventDefault();
    const coins = Number(coinsToRedeem);
    if (!coins || coins < 100) {
      showToast.error('Minimum 100 coins required to redeem');
      return;
    }

    try {
      setIsRedeemProcessing(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'redeem_coins', coinsToRedeem: coins })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(data.message || 'Coins converted to store credits!');
        setWallet(data.wallet);
        setRedeemModalOpen(false);
      } else {
        showToast.error(data.message || 'Coin redemption failed');
      }
    } catch {
      showToast.error('Network error during redemption');
    } finally {
      setIsRedeemProcessing(false);
    }
  }

  // Transactions list filtering
  const rawTransactions = wallet?.transactions || [];

  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'credits' && !['credit', 'topup', 'reward'].includes(tx.type)) return false;
      if (activeTab === 'debits' && tx.type !== 'debit') return false;
      if (activeTab === 'cashback' && !['cashback', 'reward'].includes(tx.type)) return false;
      if (activeTab === 'refunds' && tx.type !== 'refund') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = (tx.description || '').toLowerCase().includes(q);
        const matchType = (tx.type || '').toLowerCase().includes(q);
        return matchDesc || matchType;
      }
      return true;
    });
  }, [rawTransactions, activeTab, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, pageSize]);

  // Pagination calculations
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = filteredTransactions.slice(startIndex, endIndex);

  // Tab counts
  const countCredits = rawTransactions.filter(t => ['credit', 'topup', 'reward'].includes(t.type)).length;
  const countDebits = rawTransactions.filter(t => t.type === 'debit').length;
  const countCashback = rawTransactions.filter(t => ['cashback', 'reward'].includes(t.type)).length;
  const countRefunds = rawTransactions.filter(t => t.type === 'refund').length;

  const balance = wallet?.balance || 0;
  const coins = wallet?.coins || 0;
  const tier = wallet?.tier || 'Silver';

  return (
    <UserDashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* ── HEADER BANNER ────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
          borderRadius: '18px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Wallet size={20} color="#cbd5e1" />
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Wallet &amp; Loyalty Rewards
              </h1>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              Instant store credits, loyalty reward coins, and transparent transaction ledger
            </p>
          </div>

          {/* Single-line header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '42px',
              padding: '0 1rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box'
            }}>
              <Coins size={15} color="#fbbf24" />
              <span>₹{balance.toLocaleString('en-IN')} Available</span>
            </div>

            <button
              onClick={() => setTopupModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                height: '42px',
                padding: '0 1.15rem',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
            >
              <Plus size={15} strokeWidth={2.5} /> Add Funds
            </button>

            <button
              onClick={() => setRedeemModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                height: '42px',
                padding: '0 1.15rem',
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              <Sparkles size={15} color="#fbbf24" /> Redeem Coins
            </button>
          </div>
        </div>

        {/* ── 3 HERO SUMMARY CARDS ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          {/* Card 1: Store Balance */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Wallet Cash Balance
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                  ₹{balance.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={20} color="#0f172a" />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#10b981" /> 100% Usable at Checkout
              </span>
              <button
                onClick={() => setTopupModalOpen(true)}
                style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                + Recharge
              </button>
            </div>
          </div>

          {/* Card 2: Loyalty Rewards Coins */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Loyalty Coins Balance
                </span>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {coins.toLocaleString('en-IN')} <span style={{ fontSize: '0.95rem', color: '#fbbf24' }}>🪙</span>
                </div>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={20} color="#d97706" />
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Value: <strong>₹{Math.floor((coins / 100) * 25)}</strong> Store Credit
              </span>
              <button
                onClick={() => setRedeemModalOpen(true)}
                style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Redeem Coins →
              </button>
            </div>
          </div>

          {/* Card 3: Membership Tier */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 4px 15px -2px rgba(15, 23, 42, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Privilege Club Tier
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crown size={20} color="#fbbf24" /> {tier} Member
                </div>
              </div>
              <span style={{
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                padding: '3px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                5% Cashback
              </span>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Next: <strong>Gold VIP</strong>
              </span>
              <span style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 600 }}>
                Free Priority Shipping
              </span>
            </div>
          </div>

        </div>

        {/* ── TRANSACTION LEDGER SECTION ──────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Filter Bar & Search */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: '#fafbfc'
          }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Activity (${rawTransactions.length})` },
                { id: 'credits', label: `Credits & Topups (${countCredits})` },
                { id: 'debits', label: `Spent (${countDebits})` },
                { id: 'cashback', label: `Cashback & Rewards (${countCashback})` },
                { id: 'refunds', label: `Refunds (${countRefunds})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: activeTab === tab.id ? 700 : 600,
                    border: activeTab === tab.id ? '1px solid #0f172a' : '1px solid transparent',
                    background: activeTab === tab.id ? '#0f172a' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '240px', maxWidth: '100%' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 0.75rem 0 2rem',
                  fontSize: '0.8rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* Ledger Table Rows */}
          {loading ? (
            <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading wallet transaction records...</p>
            </div>
          ) : paginatedList.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Wallet size={24} color="#94a3b8" />
              </div>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                No wallet transactions found
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
                {searchQuery ? 'No transactions match your search keyword.' : 'Recharge your wallet or place orders to earn loyalty rewards.'}
              </p>
              <button
                onClick={() => setTopupModalOpen(true)}
                style={{
                  height: '38px',
                  padding: '0 1.25rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Add Store Credit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {paginatedList.map((tx) => {
                const isCredit = ['credit', 'topup', 'reward', 'refund', 'cashback'].includes(tx.type);
                return (
                  <div
                    key={tx._id}
                    style={{
                      padding: '1.1rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: '240px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: isCredit ? '#ecfdf5' : '#fef2f2',
                        border: isCredit ? '1px solid #a7f3d0' : '1px solid #fecaca',
                        color: isCredit ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 650, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{tx.description}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: isCredit ? '#f0fdf4' : '#fff1f2',
                            color: isCredit ? '#15803d' : '#be123c',
                            textTransform: 'uppercase'
                          }}>
                            {tx.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {tx.amount > 0 && (
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isCredit ? '#059669' : '#0f172a' }}>
                          {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                      )}
                      {tx.coinsDelta !== 0 && (
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: tx.coinsDelta > 0 ? '#d97706' : '#64748b' }}>
                          {tx.coinsDelta > 0 ? `+${tx.coinsDelta}` : tx.coinsDelta} Coins 🪙
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PAGINATION CONTROLS ───────────────────────────────── */}
          {totalItems > 0 && (
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{totalItems}</strong> records</span>
                <div style={{ width: '130px' }}>
                  <CustomSelect
                    value={pageSize}
                    onChange={val => setPageSize(Number(val))}
                    size="sm"
                    options={[
                      { value: 5, label: '5 per page' },
                      { value: 10, label: '10 per page' },
                      { value: 20, label: '20 per page' }
                    ]}
                  />
                </div>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      height: '32px',
                      padding: '0 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: currentPage === page ? '1px solid #0f172a' : '1px solid #e2e8f0',
                        background: currentPage === page ? '#0f172a' : '#ffffff',
                        color: currentPage === page ? '#ffffff' : '#0f172a',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      height: '32px',
                      padding: '0 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ── TOPUP MODAL ───────────────────────────────────────────── */}
      {topupModalOpen && (
        <div className="fnp-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="fnp-wallet-modal" style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '420px',
            maxWidth: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={18} color="#0f172a" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Add Store Credit
                </h3>
              </div>
              <button
                onClick={() => setTopupModalOpen(false)}
                className="fnp-modal-close-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTopupSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                  Select Recharge Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[200, 500, 1000, 2000].map(amt => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setTopupAmount(amt)}
                      className={`fnp-wallet-amt-btn ${topupAmount === amt ? 'selected' : ''}`}
                      style={{
                        padding: '0.6rem 0',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: topupAmount === amt ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                        background: topupAmount === amt ? '#0f172a' : '#f8fafc',
                        color: topupAmount === amt ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={topupAmount}
                    onChange={e => setTopupAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 1rem 0 2rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div className="fnp-wallet-bonus-box" style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                color: '#64748b'
              }}>
                🎁 Bonus: You will receive <strong>+{Math.floor(Number(topupAmount || 0) * 0.1)} Loyalty Reward Coins</strong> with this recharge.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setTopupModalOpen(false)}
                  className="dashboard-secondary-btn"
                  style={{ flex: 1, height: '42px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTopupProcessing}
                  className="dashboard-primary-btn"
                  style={{ flex: 1.5, height: '42px', borderRadius: '10px' }}
                >
                  {isTopupProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Recharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REDEEM COINS MODAL ────────────────────────────────────── */}
      {redeemModalOpen && (
        <div className="fnp-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="fnp-wallet-modal" style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '420px',
            maxWidth: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={18} color="#d97706" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Redeem Loyalty Coins
                </h3>
              </div>
              <button
                onClick={() => setRedeemModalOpen(false)}
                className="fnp-modal-close-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRedeemSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <span>Available Coins: <strong>{coins} 🪙</strong></span>
                  <span>Conversion: 100 🪙 = ₹25</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[100, 200, 500].map(c => (
                    <button
                      type="button"
                      key={c}
                      disabled={coins < c}
                      onClick={() => setCoinsToRedeem(c)}
                      style={{
                        padding: '0.6rem 0',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: coinsToRedeem === c ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                        background: coinsToRedeem === c ? '#fffbeb' : '#f8fafc',
                        color: coinsToRedeem === c ? '#b45309' : coins < c ? '#cbd5e1' : '#0f172a',
                        cursor: coins < c ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {c} Coins (₹{Math.floor((c / 100) * 25)})
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="100"
                  max={coins}
                  step="50"
                  value={coinsToRedeem}
                  onChange={e => setCoinsToRedeem(e.target.value)}
                  placeholder="Enter coin quantity"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                background: '#ecfdf5',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>
                  Store Credit to Receive:
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>
                  +₹{Math.floor((Number(coinsToRedeem || 0) / 100) * 25)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setRedeemModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRedeemProcessing || coins < 100}
                  style={{
                    flex: 1.5,
                    height: '42px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: (isRedeemProcessing || coins < 100) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isRedeemProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Convert to Cash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </UserDashboardLayout>
  );
}
