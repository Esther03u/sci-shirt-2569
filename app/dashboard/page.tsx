'use client';
// app/dashboard/page.tsx — Admin Dashboard (Phosphor Icons Duotone)

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChartBar, Users, Package, CheckCircle, Clock,
  MagnifyingGlass, ArrowsClockwise, XCircle, SignOut, Gear,
  Warning, TShirt, TrendUp, CaretDown, CaretUp, Megaphone,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type DashTab = 'overview' | 'orders' | 'distributors' | 'settings';
type Filter = 'all' | 'distributed' | 'pending';

interface Order {
  rowIndex: number;
  name: string;
  phone: string;
  size: string;
  quantity: number;
  distribution: {
    id: string;
    distributed_at: string;
    distributors: { name: string };
  } | null;
}

interface Stats { total: number; distributed: number; remaining: number; }
interface DistStat { name: string; count: number; lastAt: string; }

const SIZES = ['XS','S','M','L','XL','XXL','3XL'];
const SIZE_COLORS: Record<string, string> = {
  XS: 'var(--color-size-xs)', S: 'var(--color-size-s)', M: 'var(--color-size-m)',
  L: 'var(--color-size-l)', XL: 'var(--color-size-xl)', XXL: 'var(--color-size-xxl)', '3XL': 'var(--color-size-3xl)',
};

const TABS: { key: DashTab; label: (stats: Stats, distStats: DistStat[]) => string; icon: React.ElementType }[] = [
  { key: 'overview',     label: () => 'ภาพรวม',              icon: ChartBar },
  { key: 'orders',       label: (stats) => `รายการ (${stats.total})`, icon: Package },
  { key: 'distributors', label: (stats, distStats) => `ผู้แจก (${distStats.length})`, icon: Users },
  { key: 'settings',     label: () => 'ตั้งค่า',              icon: Gear },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, distributed: 0, remaining: 0 });
  const [distStats, setDistStats] = useState<DistStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<DashTab>('overview');
  const [regCode, setRegCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [showAllDist, setShowAllDist] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementOk, setAnnouncementOk] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 403) { router.push('/distribute'); return; }
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setStats(data.stats ?? { total: 0, distributed: 0, remaining: 0 });
      setDistStats(data.distributorStats ?? []);
      
      const annRes = await fetch('/api/announcement');
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncementText(annData.announcement || '');
      }
    } catch { setError('โหลดข้อมูลล้มเหลว'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      loadData();
    });
    const interval = setInterval(() => loadData(true), 30_000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setTab('orders');
        setTimeout(() => document.getElementById('search-orders')?.focus(), 50);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        const tabKeys: DashTab[] = ['overview', 'orders', 'distributors', 'settings'];
        setTab(current => {
          const idx = tabKeys.indexOf(current);
          if (e.key === 'ArrowRight') return tabKeys[(idx + 1) % tabKeys.length];
          return tabKeys[(idx - 1 + tabKeys.length) % tabKeys.length];
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadData, supabase]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchFilter =
        filter === 'all' ? true :
        filter === 'distributed' ? !!o.distribution :
        !o.distribution;
      const q = search.toLowerCase();
      const matchSearch = !q || o.name.toLowerCase().includes(q) || o.phone.includes(q);
      return matchFilter && matchSearch;
    });
  }, [orders, filter, search]);

  const { sizeBreakdown, maxSizeCount } = useMemo(() => {
    const sizeMap: Record<string, { total: number; distributed: number }> = {};
    orders.forEach(o => {
      const s = (o.size || 'ไม่ระบุ').split(/[/,\s]/)[0].toUpperCase().trim();
      if (!sizeMap[s]) sizeMap[s] = { total: 0, distributed: 0 };
      sizeMap[s].total += o.quantity || 1;
      if (o.distribution) sizeMap[s].distributed += o.quantity || 1;
    });
    const breakdown = Object.entries(sizeMap).sort(([a], [b]) => {
      const ai = SIZES.indexOf(a); const bi = SIZES.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });
    const maxCount = Math.max(...breakdown.map(([, v]) => v.total), 1);
    return { sizeBreakdown: breakdown, maxSizeCount: maxCount };
  }, [orders]);

  async function handleCancel(distributionId: string) {
    setCancelling(true);
    try {
      const res = await fetch('/api/distribute', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionId }),
      });
      if (res.ok) { await loadData(true); setCancelId(null); }
      else { setError('ยกเลิกล้มเหลว'); }
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setCancelling(false); }
  }

  async function handleSaveRegCode() {
    if (!regCode.trim()) return;
    setSavingCode(true); setSaveOk(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'registration_code', value: regCode }),
      });
      if (res.ok) { setSaveOk(true); setTimeout(() => setSaveOk(false), 3000); setRegCode(''); }
      else setError('บันทึกล้มเหลว');
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setSavingCode(false); }
  }

  async function handleSaveAnnouncement() {
    setSavingAnnouncement(true); setAnnouncementOk(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'announcement_text', value: announcementText }),
      });
      if (res.ok) { setAnnouncementOk(true); setTimeout(() => setAnnouncementOk(false), 3000); }
      else setError('บันทึกล้มเหลว');
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setSavingAnnouncement(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const pct = stats.total > 0 ? Math.round((stats.distributed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="bg-ambient" aria-hidden="true" />
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', position: 'relative' }}>
          <span className="spinner" style={{ width: 36, height: 36 }} />
          <p style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="bg-ambient" aria-hidden="true" />

      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-primary)',
            flexShrink: 0,
          }}>
            <ChartBar size={17} color="#fff" weight="duotone" />
          </div>
          <h1 className="navbar-brand" style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div className="navbar-actions">
          <button
            onClick={() => loadData(true)}
            className="btn btn-ghost btn-sm"
            disabled={refreshing}
            aria-label="รีเฟรช"
            title="รีเฟรชข้อมูล (auto ทุก 30 วิ)"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <ArrowsClockwise
              size={18}
              weight="duotone"
              style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}
            />
          </button>
          <a href="/distribute" className="btn btn-outline btn-sm" style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
            <TShirt size={14} weight="duotone" /> แจกเสื้อ
          </a>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" aria-label="ออกจากระบบ" style={{ minWidth: 44, minHeight: 44 }}>
            <SignOut size={18} weight="duotone" />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 'var(--space-5) var(--space-4)', position: 'relative' }}>
        <div className="container">

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
              <Warning size={16} weight="duotone" style={{ flexShrink: 0 }} />
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="ปิดแจ้งเตือน">
                <XCircle size={14} weight="duotone" />
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div 
            role="tablist"
            style={{
              display: 'flex', gap: 'var(--space-1)',
              borderBottom: '1px solid var(--glass-border)',
              marginBottom: 'var(--space-6)', overflowX: 'auto',
            }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                aria-controls={`tabpanel-${key}`}
                id={`tab-${key}`}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: tab === key ? 700 : 500,
                  fontSize: 'var(--text-sm)',
                  color: tab === key ? 'var(--color-primary-hover)' : 'var(--color-text-muted)',
                  borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={15} weight={tab === key ? 'duotone' : 'regular'} />
                {label(stats, distStats)}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`tabpanel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {/* ══════════ TAB: OVERVIEW ══════════ */}
            {tab === 'overview' && (
              <>
                <h2 className="sr-only">ภาพรวม</h2>
                {/* Stats Grid */}
                <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                  {[
                    { label: 'สั่งทั้งหมด',  value: stats.total,       icon: Package,     color: 'var(--color-primary)' },
                    { label: 'แจกแล้ว',      value: stats.distributed,  icon: CheckCircle, color: 'var(--color-success)' },
                    { label: 'ยังไม่แจก',    value: stats.remaining,    icon: Clock,       color: 'var(--color-warning)' },
                    { label: 'ผู้แจก',       value: distStats.length,   icon: Users,       color: 'var(--color-accent)' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="stat-card-label">{label}</span>
                        <div style={{
                          padding: 'var(--space-2)',
                          background: `color-mix(in srgb, ${color} 20%, transparent)`,
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                        }}>
                          <Icon size={16} weight="duotone" style={{ color, display: 'block' }} />
                        </div>
                      </div>
                      <span className="stat-card-value" style={{ color }}>{value}</span>
                      {stats.total > 0 && label !== 'ผู้แจก' && (
                        <span className="stat-card-sub">{Math.round((value / stats.total) * 100)}% ของทั้งหมด</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {stats.total > 0 && (
                  <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-foreground)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <TrendUp size={16} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                        ความคืบหน้าการแจก
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-success-text)', fontSize: 'var(--text-xl)' }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                      <div style={{
                        height: '100%', width: '100%',
                        transform: `translateX(${pct - 100}%)`,
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
                        borderRadius: 'var(--radius-full)',
                        transition: 'transform var(--transition-slow)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      <span>แจกแล้ว {stats.distributed} ตัว</span>
                      <span>เหลือ {stats.remaining} ตัว</span>
                    </div>
                  </div>
                )}

                {/* Size Breakdown */}
                {sizeBreakdown.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                      <ChartBar size={18} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                      แยกตามไซส์
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {sizeBreakdown.map(([size, { total, distributed }]) => {
                        const color = SIZE_COLORS[size] ?? 'var(--color-primary)';
                        const distPct = total > 0 ? (distributed / total) * 100 : 0;
                        return (
                          <div key={size}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span style={{
                                  display: 'inline-block', width: 32, textAlign: 'center',
                                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-sm)', color,
                                  background: `color-mix(in srgb, ${color} 18%, transparent)`, borderRadius: 'var(--radius-sm)', padding: '2px 0',
                                  border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                                }}>{size}</span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                  แจก {distributed}/{total} ตัว
                                </span>
                              </div>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color }}>{Math.round(distPct)}%</span>
                            </div>
                            <div style={{ height: 7, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${(total / maxSizeCount) * 100}%`,
                                background: `color-mix(in srgb, ${color} 25%, transparent)`, borderRadius: 'var(--radius-full)', position: 'relative',
                              }}>
                                <div style={{
                                  position: 'absolute', inset: 0, width: '100%',
                                  transform: `translateX(${distPct - 100}%)`,
                                  background: color, borderRadius: 'var(--radius-full)',
                                  transition: 'transform var(--transition-slow)',
                                }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════════ TAB: ORDERS ══════════ */}
            {tab === 'orders' && (
              <>
                <h2 className="sr-only">รายการคำสั่งซื้อ</h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {(['all', 'distributed', 'pending'] as Filter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                        style={{ minHeight: 44 }}
                      >
                        {f === 'all' ? `ทั้งหมด (${stats.total})` :
                         f === 'distributed' ? `รับแล้ว (${stats.distributed})` :
                         `รอ (${stats.remaining})`}
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                    <label htmlFor="search-orders" className="sr-only">ค้นหาชื่อหรือเบอร์โทร</label>
                    <input
                      id="search-orders"
                      type="search" className="input" placeholder="ค้นชื่อ / เบอร์ (Cmd+K)"
                      value={search} onChange={e => setSearch(e.target.value)}
                      aria-label="ค้นหาชื่อหรือเบอร์โทร"
                      style={{ paddingLeft: 'var(--space-9)', height: 44 }}
                    />
                    <MagnifyingGlass size={18} weight="duotone" style={{
                      position: 'absolute', left: 'var(--space-3)', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--color-text-light)', pointerEvents: 'none',
                    }} />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                    ไม่มีข้อมูล
                  </div>
                ) : (
                  <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>
                        <tr>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>#</th>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>ชื่อ-สกุล</th>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>เบอร์โทร</th>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>ไซส์</th>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>สถานะ</th>
                          <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(order => (
                          <tr key={order.rowIndex} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-light)', fontWeight: 600 }}>
                              {order.rowIndex}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                              {order.name}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                              {order.phone}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                              <span className="badge badge-primary">{order.size || '-'}</span>
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                              {order.distribution ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span className="badge badge-success" style={{ width: 'fit-content' }}>
                                    <CheckCircle size={12} weight="fill" /> รับแล้ว
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                    โดย {order.distribution.distributors?.name ?? '-'} <br/>
                                    {new Date(order.distribution.distributed_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="badge badge-pending">
                                  <Clock size={12} weight="duotone" /> รอแจก
                                </span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                              {order.distribution && (
                                cancelId === order.distribution.id ? (
                                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <button onClick={() => handleCancel(order.distribution!.id)} className="btn btn-danger btn-sm" disabled={cancelling} style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-xs)' }}>
                                      {cancelling ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'ยืนยัน'}
                                    </button>
                                    <button onClick={() => setCancelId(null)} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-xs)' }}>ยกเลิก</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setCancelId(order.distribution!.id)} className="btn btn-ghost btn-sm" title="ยกเลิกการแจก" aria-label="ยกเลิกการแจก" style={{ padding: '0.4rem' }}>
                                    <XCircle size={18} weight="duotone" style={{ color: 'var(--color-destructive)' }} />
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ══════════ TAB: DISTRIBUTORS ══════════ */}
            {tab === 'distributors' && (
              <div className="card">
                <h2 className="sr-only">รายชื่อผู้แจก</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                  <Users size={18} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                  ผู้แจกเสื้อทั้งหมด ({distStats.length} คน)
                </div>
                {distStats.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <Users size={48} weight="duotone" style={{ color: 'var(--color-text-light)', marginBottom: 'var(--space-2)' }} />
                    <p className="empty-state-title">ยังไม่มีผู้แจก</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>เมื่อมีการแจกเสื้อ จะแสดงสถิติที่นี่</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      {(showAllDist ? distStats : distStats.slice(0, 5))
                        .sort((a, b) => b.count - a.count)
                        .map((d, i) => (
                          <div key={d.name} style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                            padding: 'var(--space-3) var(--space-4)',
                            background: i === 0 ? 'var(--color-primary-light)' : 'var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            border: i === 0 ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                          }}>
                            <span style={{
                              width: 28, height: 28,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '50%',
                              background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                              color: i === 0 ? '#fff' : 'var(--color-text-muted)',
                              fontWeight: 700, fontSize: 'var(--text-xs)',
                              fontFamily: 'var(--font-heading)', flexShrink: 0,
                            }}>{i + 1}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-foreground)' }}>{d.name}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                ล่าสุด: {d.lastAt ? new Date(d.lastAt).toLocaleString('th-TH') : '-'}
                              </div>
                            </div>
                            <span className="badge badge-success" style={{ fontSize: 'var(--text-sm)', padding: '0.3rem 0.75rem' }}>
                              {d.count} ตัว
                            </span>
                          </div>
                        ))}
                    </div>
                    {distStats.length > 5 && (
                      <button onClick={() => setShowAllDist(p => !p)} className="btn btn-ghost btn-sm btn-full" style={{ minHeight: 44 }}>
                        {showAllDist
                          ? <><CaretUp size={16} weight="bold" /> ย่อ</>
                          : <><CaretDown size={16} weight="bold" /> ดูทั้งหมด ({distStats.length} คน)</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══════════ TAB: SETTINGS ══════════ */}
            {tab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 }}>
                <h2 className="sr-only">ตั้งค่าระบบ</h2>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    <Gear size={18} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                    ตั้งค่าระบบ
                  </div>

                  {saveOk && (
                    <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                      <CheckCircle size={16} weight="duotone" style={{ flexShrink: 0 }} />
                      บันทึกสำเร็จ!
                    </div>
                  )}

                  <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                    <label htmlFor="announcement-setting" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Megaphone size={16} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                      ประกาศแจ้งเตือนนักศึกษา (แสดงที่หน้าค้นหา)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <textarea
                        id="announcement-setting" className="input"
                        placeholder="เช่น รับเสื้อได้ที่ห้อง 101 วันที่ 10 ต.ค. เวลา 13:00 - 16:00 น.&#10;(เว้นว่างไว้เพื่อปิดการแสดงผล)"
                        value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                        style={{ minHeight: 100, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p className="input-hint">รองรับการขึ้นบรรทัดใหม่</p>
                        <button onClick={handleSaveAnnouncement} className="btn btn-primary btn-sm" disabled={savingAnnouncement} style={{ minWidth: 100 }}>
                          {savingAnnouncement ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'บันทึกประกาศ'}
                        </button>
                      </div>
                      {announcementOk && <span style={{ color: 'var(--color-success-text)', fontSize: 'var(--text-sm)' }}>บันทึกประกาศแล้ว!</span>}
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="reg-code-setting" className="input-label">
                      รหัสลับสำหรับสมัครบัญชีผู้แจก
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <input
                        id="reg-code-setting" type="text" className="input"
                        placeholder="รหัสใหม่..."
                        value={regCode} onChange={e => setRegCode(e.target.value)}
                      />
                      <button onClick={handleSaveRegCode} className="btn btn-primary" disabled={savingCode || !regCode.trim()} style={{ minHeight: 44, minWidth: 80 }}>
                        {savingCode ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'บันทึก'}
                      </button>
                    </div>
                    <p className="input-hint">แจกรหัสนี้ให้ผู้แจกใช้สมัครบัญชีที่ <a href="/register">/register</a></p>
                  </div>
                </div>

                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    <Package size={16} weight="duotone" style={{ color: 'var(--color-primary)' }} />
                    ข้อมูลระบบ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {[
                      { label: 'ข้อมูลจาก', value: 'Google Sheets' },
                      { label: 'Cache TTL', value: '5 นาที' },
                      { label: 'Auto-refresh', value: 'ทุก 30 วินาที' },
                      { label: 'จำนวนคำสั่งซื้อ', value: `${stats.total} รายการ`, highlight: true },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 600, color: highlight ? 'var(--color-primary-hover)' : 'var(--color-foreground)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
