'use client';
// app/dashboard/page.tsx — Admin Dashboard (redesigned with tabs)

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Users, Package, CheckCircle2, Clock,
  Search, RefreshCw, XCircle, LogOut, Settings,
  AlertTriangle, Shirt, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
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
  XS: '#8B5CF6', S: '#6D28D9', M: '#7C3AED',
  L: '#EA580C', XL: '#D97706', XXL: '#059669', '3XL': '#DC2626',
};

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
    // Auto-refresh every 30s
    const interval = setInterval(() => loadData(true), 30_000);
    return () => clearInterval(interval);
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

  // Size breakdown
  const sizeMap: Record<string, { total: number; distributed: number }> = {};
  orders.forEach(o => {
    const s = (o.size || 'ไม่ระบุ').split(/[/,\s]/)[0].toUpperCase().trim();
    if (!sizeMap[s]) sizeMap[s] = { total: 0, distributed: 0 };
    sizeMap[s].total += o.quantity || 1;
    if (o.distribution) sizeMap[s].distributed += o.quantity || 1;
  });
  const sizeBreakdown = Object.entries(sizeMap).sort(([a], [b]) => {
    const ai = SIZES.indexOf(a); const bi = SIZES.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });
  const maxSizeCount = Math.max(...sizeBreakdown.map(([, v]) => v.total), 1);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const pct = stats.total > 0 ? Math.round((stats.distributed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <span className="spinner" style={{ width: 36, height: 36 }} />
          <p style={{ marginTop: 'var(--space-4)', fontWeight: 600 }}>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const TABS: { key: DashTab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',      label: 'ภาพรวม',      icon: BarChart2 },
    { key: 'orders',        label: `รายการ (${stats.total})`, icon: Package },
    { key: 'distributors',  label: `ผู้แจก (${distStats.length})`, icon: Users },
    { key: 'settings',      label: 'ตั้งค่า',      icon: Settings },
  ];

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BarChart2 size={20} color="var(--color-primary)" />
          <span className="navbar-brand">Admin Dashboard</span>
        </div>
        <div className="navbar-actions">
          <button
            onClick={() => loadData(true)}
            className="btn btn-ghost btn-sm"
            disabled={refreshing}
            aria-label="รีเฟรช"
            title="รีเฟรชข้อมูล (auto ทุก 30 วิ)"
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          </button>
          <a href="/distribute" className="btn btn-outline btn-sm"><Shirt size={14} /> แจกเสื้อ</a>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" aria-label="ออกจากระบบ">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 'var(--space-5) var(--space-4)' }}>
        <div className="container">

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <XCircle size={14} />
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-1)',
            borderBottom: '2px solid var(--color-border)',
            marginBottom: 'var(--space-6)',
            overflowX: 'auto',
          }}>
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-3) var(--space-4)',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontWeight: tab === key ? 700 : 500,
                  fontSize: 'var(--text-sm)',
                  color: tab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderBottom: tab === key ? '2px solid var(--color-primary)' : '2px solid transparent',
                  marginBottom: -2,
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* ══════════ TAB: OVERVIEW ══════════ */}
          {tab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
                {[
                  { label: 'สั่งทั้งหมด',  value: stats.total,       icon: Package,      color: 'var(--color-primary)' },
                  { label: 'แจกแล้ว',      value: stats.distributed,  icon: CheckCircle2, color: 'var(--color-success)' },
                  { label: 'ยังไม่แจก',    value: stats.remaining,    icon: Clock,        color: 'var(--color-accent)' },
                  { label: 'ผู้แจก',       value: distStats.length,   icon: Users,        color: 'var(--color-secondary)' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="stat-card-label">{label}</span>
                      <div style={{ padding: 'var(--space-2)', background: `${color}18`, borderRadius: 'var(--radius-sm)' }}>
                        <Icon size={16} style={{ color }} />
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
                      <TrendingUp size={16} color="var(--color-primary)" />
                      ความคืบหน้าการแจก
                    </span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-success)', fontSize: 'var(--text-xl)' }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 12, background: 'var(--color-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-slow)',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <span>แจกแล้ว {stats.distributed} ตัว</span>
                    <span>เหลือ {stats.remaining} ตัว</span>
                  </div>
                </div>
              )}

              {/* Size Breakdown Chart */}
              {sizeBreakdown.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    <BarChart2 size={18} color="var(--color-primary)" />
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
                                background: `${color}15`, borderRadius: 'var(--radius-sm)', padding: '2px 0',
                              }}>{size}</span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                แจก {distributed}/{total} ตัว
                              </span>
                            </div>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color }}>
                              {Math.round(distPct)}%
                            </span>
                          </div>
                          <div style={{ height: 8, background: 'var(--color-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(total / maxSizeCount) * 100}%`,
                              background: `${color}30`,
                              borderRadius: 'var(--radius-full)',
                              position: 'relative',
                            }}>
                              <div style={{
                                position: 'absolute', inset: 0,
                                width: `${distPct}%`,
                                background: color,
                                borderRadius: 'var(--radius-full)',
                                transition: 'width var(--transition-slow)',
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
                       f === 'distributed' ? `✅ แจกแล้ว (${stats.distributed})` :
                       `⏳ รอ (${stats.remaining})`}
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
                        <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--color-foreground)' }}>{order.rowIndex}</td>
                        <td style={{ fontWeight: 600 }}>{order.name}</td>
                        <td style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)' }}>{order.phone}</td>
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
            </>
          )}

          {/* ══════════ TAB: DISTRIBUTORS ══════════ */}
          {tab === 'distributors' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                <Users size={18} color="var(--color-primary)" />
                ผู้แจกเสื้อทั้งหมด ({distStats.length} คน)
              </div>
              {distStats.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <Users size={48} color="var(--color-text-light)" />
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
                          background: i === 0 ? 'var(--color-primary-light)' : 'var(--color-muted)',
                          borderRadius: 'var(--radius-md)',
                          border: i === 0 ? '1px solid var(--color-primary)' : '1px solid transparent',
                        }}>
                          <span style={{
                            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%',
                            background: i === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                            color: i === 0 ? '#fff' : 'var(--color-text-muted)',
                            fontWeight: 700, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-heading)',
                            flexShrink: 0,
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
                    <button
                      onClick={() => setShowAllDist(p => !p)}
                      className="btn btn-ghost btn-sm btn-full"
                    >
                      {showAllDist ? <><ChevronUp size={14} /> ย่อ</> : <><ChevronDown size={14} /> ดูทั้งหมด ({distStats.length} คน)</>}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══════════ TAB: SETTINGS ══════════ */}
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                  <Settings size={18} color="var(--color-primary)" />
                  ตั้งค่าระบบ
                </div>

                {saveOk && (
                  <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    บันทึกสำเร็จ!
                  </div>
                )}

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
                    <button onClick={handleSaveRegCode} className="btn btn-primary" disabled={savingCode || !regCode.trim()}>
                      {savingCode ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'บันทึก'}
                    </button>
                  </div>
                  <p className="input-hint">แจกรหัสนี้ให้ผู้แจกใช้สมัครบัญชีที่ <a href="/register">/register</a></p>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                  ℹ️ ข้อมูลระบบ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ข้อมูลจาก</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>Google Sheets</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cache TTL</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>5 นาที</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Auto-refresh</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-foreground)' }}>ทุก 30 วินาที</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>จำนวนคำสั่งซื้อ</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{stats.total} รายการ</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
