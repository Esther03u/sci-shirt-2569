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

import { DashTab, Filter, Order, Stats, DistStat } from './types';
import { OverviewTab, OrdersTab, DistributorsTab, SettingsTab } from './Tabs';

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
    const SIZES = ['XS','S','M','L','XL','XXL','3XL'];
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
            {tab === 'overview' && (
              <OverviewTab stats={stats} sizeBreakdown={sizeBreakdown} maxSizeCount={maxSizeCount} pct={pct} />
            )}
            {tab === 'orders' && (
              <OrdersTab 
                stats={stats} filtered={filtered} filter={filter} search={search}
                cancelId={cancelId} cancelling={cancelling}
                setFilter={setFilter} setSearch={setSearch} setCancelId={setCancelId} handleCancel={handleCancel}
              />
            )}
            {tab === 'distributors' && (
              <DistributorsTab distStats={distStats} showAllDist={showAllDist} setShowAllDist={setShowAllDist} />
            )}
            {tab === 'settings' && (
              <SettingsTab 
                announcementText={announcementText} setAnnouncementText={setAnnouncementText}
                savingAnnouncement={savingAnnouncement} announcementOk={announcementOk} handleSaveAnnouncement={handleSaveAnnouncement}
                regCode={regCode} setRegCode={setRegCode} savingCode={savingCode} handleSaveRegCode={handleSaveRegCode} saveOk={saveOk} stats={stats}
              />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
