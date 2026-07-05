'use client';
// app/dashboard/page.tsx — Admin Dashboard

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Users, Package, CheckCircle2, Clock,
  Search, RefreshCw, XCircle, LogOut, Settings,
  ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
  const [showDistributors, setShowDistributors] = useState(false);
  const [regCode, setRegCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

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
    } catch { setError('โหลดข้อมูลล้มเหลว'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      loadData();
    });
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'distributed' ? !!o.distribution :
      !o.distribution;
    const q = search.toLowerCase();
    const matchSearch = !q || o.name.toLowerCase().includes(q) || o.phone.includes(q);
    return matchFilter && matchSearch;
  });

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
    setSavingCode(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'registration_code', value: regCode }),
      });
      if (res.ok) setError('');
      else setError('บันทึกล้มเหลว');
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setSavingCode(false); setRegCode(''); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p style={{ marginTop: 'var(--space-4)' }}>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <span className="navbar-brand">Admin Dashboard</span>
        <div className="navbar-actions">
          <button onClick={() => loadData(true)} className="btn btn-ghost btn-sm" disabled={refreshing} aria-label="รีเฟรช">
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          </button>
          <a href="/distribute" className="btn btn-outline btn-sm">แจกเสื้อ</a>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" aria-label="ออกจากระบบ">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 'var(--space-6) var(--space-4)' }}>
        <div className="container">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <XCircle size={14} />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            {[
              { label: 'สั่งทั้งหมด', value: stats.total, icon: Package, color: 'var(--color-primary)' },
              { label: 'แจกแล้ว', value: stats.distributed, icon: CheckCircle2, color: 'var(--color-success)' },
              { label: 'ยังไม่แจก', value: stats.remaining, icon: Clock, color: 'var(--color-accent)' },
              { label: 'คนแจก', value: distStats.length, icon: Users, color: 'var(--color-secondary)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="stat-card-label">{label}</span>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="stat-card-value" style={{ color }}>{value}</span>
                {stats.total > 0 && label !== 'คนแจก' && (
                  <span className="stat-card-sub">
                    {Math.round((value / stats.total) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                <span>ความคืบหน้าการแจก</span>
                <span>{stats.distributed}/{stats.total} ตัว</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(stats.distributed / stats.total) * 100}%`,
                  background: 'var(--color-success)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width var(--transition-slow)',
                }} />
              </div>
            </div>
          )}

          {/* Distributor Stats (collapsible) */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <button
              onClick={() => setShowDistributors(p => !p)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: 'var(--color-foreground)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                <Users size={18} /> ผู้แจกเสื้อ ({distStats.length} คน)
              </span>
              {showDistributors ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showDistributors && distStats.length > 0 && (
              <div className="table-wrapper" style={{ marginTop: 'var(--space-4)', border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>ชื่อผู้แจก</th>
                      <th>แจกแล้ว</th>
                      <th>ล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distStats.sort((a, b) => b.count - a.count).map(d => (
                      <tr key={d.name}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td><span className="badge badge-success">{d.count} ตัว</span></td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {d.lastAt ? new Date(d.lastAt).toLocaleString('th-TH') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filter + Search */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(['all', 'distributed', 'pending'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                >
                  {f === 'all' ? `ทั้งหมด (${stats.total})` :
                   f === 'distributed' ? `แจกแล้ว (${stats.distributed})` :
                   `ยังไม่แจก (${stats.remaining})`}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
              <input
                type="search" className="input" placeholder="ค้นชื่อ / เบอร์"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 'var(--space-9)', height: 40 }}
              />
              <Search size={15} style={{
                position: 'absolute', left: 'var(--space-3)', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--color-text-light)', pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ</th>
                  <th>เบอร์โทร</th>
                  <th>ไซส์</th>
                  <th>สถานะ</th>
                  <th>ผู้แจก</th>
                  <th>เวลา</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>ไม่มีข้อมูล</td></tr>
                ) : filtered.map(order => (
                  <tr key={order.rowIndex}>
                    <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-foreground)' }}>
                      {order.rowIndex}
                    </td>
                    <td style={{ fontWeight: 600 }}>{order.name}</td>
                    <td style={{ fontFamily: 'var(--font-heading)' }}>{order.phone}</td>
                    <td><span className="badge badge-primary">{order.size || '-'}</span></td>
                    <td>
                      {order.distribution ? (
                        <span className="badge badge-success"><CheckCircle2 size={10} /> รับแล้ว</span>
                      ) : (
                        <span className="badge badge-pending"><Clock size={10} /> รอ</span>
                      )}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {order.distribution?.distributors?.name ?? '-'}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {order.distribution?.distributed_at
                        ? new Date(order.distribution.distributed_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
                        : '-'}
                    </td>
                    <td>
                      {order.distribution && (
                        cancelId === order.distribution.id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button onClick={() => handleCancel(order.distribution!.id)} className="btn btn-danger btn-sm" disabled={cancelling}>
                              {cancelling ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'ยืนยัน'}
                            </button>
                            <button onClick={() => setCancelId(null)} className="btn btn-ghost btn-sm">ยกเลิก</button>
                          </div>
                        ) : (
                          <button onClick={() => setCancelId(order.distribution!.id)} className="btn btn-ghost btn-sm" title="ยกเลิกการแจก">
                            <XCircle size={14} style={{ color: 'var(--color-destructive)' }} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Settings */}
          <div className="card" style={{ marginTop: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              <Settings size={18} /> ตั้งค่าระบบ
            </div>
            <div className="input-group" style={{ maxWidth: 400 }}>
              <label htmlFor="reg-code-setting" className="input-label">รหัสลับสำหรับสมัครบัญชีผู้แจก</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  id="reg-code-setting" type="text" className="input"
                  placeholder="รหัสใหม่..."
                  value={regCode} onChange={e => setRegCode(e.target.value)}
                />
                <button onClick={handleSaveRegCode} className="btn btn-primary" disabled={savingCode || !regCode.trim()}>
                  {savingCode ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'บันทึก'}
                </button>
              </div>
              <p className="input-hint">แจกรหัสนี้ให้ผู้แจกใช้สมัครบัญชี</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
