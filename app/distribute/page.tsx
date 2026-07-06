'use client';
// app/distribute/page.tsx — Distributor page: search / scan / all orders + slip viewer

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, CheckCircle2, Clock, LogOut, Shirt, Phone,
  QrCode, X, Package, TrendingUp, History, AlertTriangle,
  List, FileImage, ChevronDown, ChevronUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface OrderResult {
  order: Record<string, string | number | undefined>;
  distribution: Record<string, unknown> | null;
}

interface MyStats {
  myStats: { total: number; today: number };
  overall: { distributed: number };
  recentFive: { sheet_row_id: string; phone: string; distributed_at: string }[];
}

interface OrderRow {
  rowIndex: number;
  name: string;
  phone: string;
  size: string;
  quantity: number;
  slipUrl: string | null;
  distribution: { distributed_at: string; distributors?: { name: string } } | null;
}

type Tab = 'search' | 'scan' | 'all';

export default function DistributePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ role?: string; name?: string } | null>(null);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [distributing, setDistributing] = useState(false);
  const [stats, setStats] = useState<MyStats | null>(null);
  
  const [tab, setTab] = useState<Tab>('search');
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<unknown>(null);
  const scanDivRef = useRef<HTMLDivElement>(null);

  // All Orders tab state
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allFilter, setAllFilter] = useState<'all' | 'distributed' | 'pending'>('all');
  const [allSearch, setAllSearch] = useState('');
  const [allTotal, setAllTotal] = useState(0);
  const [allDistributed, setAllDistributed] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [showSlip, setShowSlip] = useState(false);

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/distribute/stats');
    if (res.ok) setStats(await res.json());
  }, []);

  const loadAllOrders = useCallback(async (
    filter: 'all' | 'distributed' | 'pending' = 'all',
    search = ''
  ) => {
    setAllLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      if (search) params.set('search', search);
      const res = await fetch(`/api/distribute/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllOrders(data.orders ?? []);
        setAllTotal(data.total ?? 0);
        setAllDistributed(data.distributed ?? 0);
      }
    } finally {
      setAllLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      fetch('/api/profile').then(r => r.json()).then(setProfile);
      loadStats();
    });
  }, []);

  // Load all orders when switching to that tab
  useEffect(() => {
    if (tab === 'all') loadAllOrders(allFilter, allSearch);
  }, [tab, loadAllOrders, allFilter, allSearch]);

  // QR Scanner lifecycle
  useEffect(() => {
    if (tab !== 'scan') {
      stopScanner();
      return;
    }
    
    // Dynamic import to avoid SSR issues with html5-qrcode
    let scanner: any;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!scanDivRef.current) return;
      
      try {
        scanner = new Html5Qrcode('qr-scan-region');
        scannerRef.current = scanner;
        setScanning(true);
        setScanError('');
        
        scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            stopScanner();
            setTab('search');
            handleQrScan(decodedText);
          },
          () => {} // ignore errors during scanning
        ).catch((err: Error) => {
          setScanning(false);
          setScanError('ไม่สามารถเปิดกล้องได้ โปรดตรวจสอบการอนุญาตใช้งานกล้อง');
        });
      } catch (err) {
        setScanning(false);
        setScanError('เกิดข้อผิดพลาดในการเริ่มต้นกล้อง');
      }
    });
    
    return () => {
      stopScanner();
    };
  }, [tab]);

  function stopScanner() {
    if (scannerRef.current) {
      try {
        (scannerRef.current as any).stop().catch(() => {});
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function handleQrScan(token: string) {
    setLoading(true); setError(''); setResult(null); setSuccessMsg('');
    try {
      const res = await fetch(`/api/checkin/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setResult(data);
        setPhone(String(data.order.phone ?? ''));
      }
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;
    setLoading(true); setError(''); setResult(null); setSuccessMsg('');
    try {
      const res = await fetch(`/api/search?phone=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error); } else { setResult(data); }
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }

  async function handleDistribute(sheetRowId?: number, orderPhone?: string, orderName?: string) {
    const rid = sheetRowId ?? (result?.order?.rowIndex as number);
    const ph  = orderPhone  ?? (result?.order?.phone as string);
    const nm  = orderName   ?? (result?.order?.name as string) ?? 'ผู้สั่ง';
    if (!rid) return;
    setDistributing(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetRowId: rid, phone: ph }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setSuccessMsg(`แจกเสื้อให้ ${nm} สำเร็จ!`);
        setResult(null); setPhone('');
        setSelectedOrder(null);
        loadStats();
        if (tab === 'all') loadAllOrders(allFilter, allSearch);
      }
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setDistributing(false); }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const isDistributed = result?.distribution != null;

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Shirt size={20} color="var(--color-primary)" />
          <span className="navbar-brand">ระบบแจกเสื้อ</span>
        </div>
        <div className="navbar-actions">
          {profile?.role === 'admin' && (
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline btn-sm">
              Dashboard
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="ออกจากระบบ">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 800 }}>
        {/* Welcome */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)' }}>
            สวัสดี, {profile?.name || 'ทีมงานแจกเสื้อ'} ✌️
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            ค้นหาผู้สั่งด้วยเบอร์โทร, สแกน QR Code หรือดูรายการทั้งหมดเพื่อแจกเสื้อ
          </p>
        </div>

        <div className="grid-stack">
          {/* ── Stats Summary ── */}
          {stats && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 'var(--space-3)', marginBottom: 'var(--space-2)'
            }}>
              {[
                { label: 'ยอดของฉัน (รวม)', value: stats.myStats.total, icon: Shirt, color: 'var(--color-accent)' },
                { label: 'ยอดของฉัน (วันนี้)', value: stats.myStats.today, icon: TrendingUp, color: 'var(--color-primary)' },
                { label: 'ยอดแจกทั้งระบบ', value: stats.overall.distributed, icon: CheckCircle2, color: 'var(--color-success)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card" style={{
                  padding: 'var(--space-4)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  gap: 'var(--space-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)' }}>
                    <Icon size={13} style={{ color }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-2xl)', color, lineHeight: 1 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab Switcher ── */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
            background: 'var(--color-muted)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1)',
          }}>
            {([
              { key: 'search', label: 'ค้นหาเบอร์',    icon: Search },
              { key: 'scan',   label: 'สแกน QR',       icon: QrCode },
              { key: 'all',    label: 'รายการทั้งหมด',  icon: List   },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  transition: 'all var(--transition-fast)',
                  background: tab === key ? 'var(--color-surface)' : 'transparent',
                  color: tab === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Messages (always visible) ── */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert" aria-live="polite">
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              {error}
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={14} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }} role="alert" aria-live="polite">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {successMsg}
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: SEARCH                             */}
          {/* ═══════════════════════════════════════ */}
          {tab === 'search' && (
            <>
              <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <h2 className="card-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                  ค้นหาด้วยเบอร์โทร
                </h2>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="tel" className="input" placeholder="เบอร์โทรศัพท์"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      inputMode="tel" style={{ paddingLeft: 'var(--space-10)' }}
                      aria-label="เบอร์โทรศัพท์" autoFocus
                    />
                    <Phone size={16} style={{
                      position: 'absolute', left: 'var(--space-3)', top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--color-text-light)', pointerEvents: 'none',
                    }} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={loading || !phone.trim()}>
                    {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
                  </button>
                </form>
              </div>

              {/* ── Result Card with Slip ── */}
              {result && (
                <div className="card" style={{ borderTop: `4px solid ${isDistributed ? 'var(--color-success)' : 'var(--color-accent)'}`, marginBottom: 'var(--space-4)' }}>
                  <div className="card-header">
                    <div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-1)' }}>
                        {result.order.name as string}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Phone size={13} /> {result.order.phone as string}
                      </div>
                    </div>
                    <span className={`badge ${isDistributed ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: 'var(--text-sm)', padding: '0.35rem 0.75rem' }}>
                      {isDistributed ? <><CheckCircle2 size={14} /> รับแล้ว</> : <><Clock size={14} /> ยังไม่รับ</>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                    {[
                      { label: 'ลำดับ', value: `#${result.order.rowIndex}` },
                      { label: 'ไซส์',  value: result.order.size as string || '-' },
                      { label: 'จำนวน', value: `${result.order.quantity} ตัว` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--color-muted)',
                        borderRadius: 'var(--radius-md)',
                        minWidth: 90, flex: 1,
                      }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-foreground)', fontSize: 'var(--text-lg)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Slip Viewer ── */}
                  {result.order.slipUrl ? (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <button
                        onClick={() => setShowSlip(v => !v)}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                          border: '1px solid #86efac',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 'var(--text-sm)',
                          color: '#166534',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <FileImage size={16} />
                          ดูสลิปการโอนเงิน / หลักฐานการชำระเงิน
                        </div>
                        {showSlip ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {showSlip && (
                        <div style={{
                          marginTop: 'var(--space-2)',
                          padding: 'var(--space-4)',
                          background: 'var(--color-muted)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)',
                        }}>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
                            กดปุ่มด้านล่างเพื่อเปิดสลิปใน Google Drive
                          </p>
                          <a
                            href={result.order.slipUrl as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
                          >
                            <FileImage size={16} />
                            เปิดสลิป / หลักฐานการชำระเงิน
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      marginBottom: 'var(--space-4)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-muted)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    }}>
                      <FileImage size={14} />
                      ไม่มีสลิปแนบในฟอร์ม
                    </div>
                  )}

                  {/* ── Distribute Action ── */}
                  {isDistributed ? (
                    <div className="alert alert-success">
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <span>
                        รับเสื้อแล้วโดย <strong>{(result.distribution?.distributors as Record<string, string> | null)?.name ?? 'ผู้แจก'}</strong>
                      </span>
                    </div>
                  ) : (
                    <button onClick={() => handleDistribute()} className="btn btn-accent btn-full btn-lg" disabled={distributing}>
                      {distributing
                        ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังบันทึก...</>
                        : <><CheckCircle2 size={20} /> ยืนยันการแจกเสื้อ</>
                      }
                    </button>
                  )}
                </div>
              )}

              {/* ── Recent History ── */}
              {stats && stats.recentFive.length > 0 && !result && !error && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontWeight: 700, color: 'var(--color-foreground)' }}>
                    <History size={16} color="var(--color-primary)" />
                    ล่าสุดของฉัน
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {stats.recentFive.map((d) => (
                      <div key={d.sheet_row_id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-muted)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-sm)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <CheckCircle2 size={14} color="var(--color-success)" />
                          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{d.phone}</span>
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {new Date(d.distributed_at).toLocaleString('th-TH', { timeStyle: 'short', dateStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: SCAN                               */}
          {/* ═══════════════════════════════════════ */}
          {tab === 'scan' && (
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 className="card-title" style={{ fontSize: 'var(--text-base)' }}>สแกน QR Code จากมือถือนักศึกษา</h2>
                {scanning && (
                  <button onClick={() => { stopScanner(); setTab('search'); }} className="btn btn-ghost btn-sm">
                    <X size={14} /> ยกเลิก
                  </button>
                )}
              </div>
              {scanError && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  {scanError}
                </div>
              )}
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', minHeight: 300 }}>
                <div id="qr-scan-region" ref={scanDivRef} style={{ width: '100%' }} />
                {!scanning && !scanError && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
                    color: '#fff', fontSize: 'var(--text-sm)',
                  }}>
                    <span className="spinner" style={{ width: 32, height: 32 }} />
                    <span>กำลังเปิดกล้อง...</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
                📱 ให้นักศึกษาแสดง QR Code จากหน้าเว็บของตัวเอง แล้วนำกล้องไปใกล้
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: ALL ORDERS                         */}
          {/* ═══════════════════════════════════════ */}
          {tab === 'all' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {[
                  { label: 'ทั้งหมด',   value: allTotal,                     color: 'var(--color-primary)' },
                  { label: 'รับแล้ว',   value: allDistributed,               color: 'var(--color-success)' },
                  { label: 'ยังไม่รับ', value: allTotal - allDistributed,    color: 'var(--color-warning)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-xl)', color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text" className="input" placeholder="ค้นหาชื่อ หรือเบอร์โทร"
                    value={allSearch}
                    onChange={e => setAllSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadAllOrders(allFilter, allSearch)}
                    style={{ paddingLeft: 'var(--space-10)' }}
                  />
                  <Search size={16} style={{
                    position: 'absolute', left: 'var(--space-3)', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--color-text-light)', pointerEvents: 'none',
                  }} />
                </div>
                <button onClick={() => loadAllOrders(allFilter, allSearch)} className="btn btn-outline" disabled={allLoading}>
                  {allLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
                </button>
              </div>

              {/* Filter */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {([
                  { key: 'all',         label: 'ทั้งหมด' },
                  { key: 'pending',     label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> ยังไม่รับ</span> },
                  { key: 'distributed', label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> รับแล้ว</span> },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setAllFilter(key); loadAllOrders(key, allSearch); }}
                    className={`btn btn-sm ${allFilter === key ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, fontSize: 'var(--text-xs)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Selected Order Detail */}
              {selectedOrder && (
                <div className="card" style={{
                  borderTop: `4px solid ${selectedOrder.distribution ? 'var(--color-success)' : 'var(--color-accent)'}`,
                  marginBottom: 'var(--space-4)',
                }}>
                  <div className="card-header">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-heading)' }}>
                        {selectedOrder.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {selectedOrder.phone}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span className={`badge ${selectedOrder.distribution ? 'badge-success' : 'badge-pending'}`}>
                        {selectedOrder.distribution ? <><CheckCircle2 size={12} /> รับแล้ว</> : <><Clock size={12} /> ยังไม่รับ</>}
                      </span>
                      <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-sm">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                    {[
                      { label: 'ลำดับ', value: `#${selectedOrder.rowIndex}` },
                      { label: 'ไซส์',  value: selectedOrder.size || '-' },
                      { label: 'จำนวน', value: `${selectedOrder.quantity} ตัว` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-muted)',
                        borderRadius: 'var(--radius-sm)',
                        flex: 1, minWidth: 80,
                      }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Slip link for selected order */}
                  {selectedOrder.slipUrl ? (
                    <a
                      href={selectedOrder.slipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ marginBottom: 'var(--space-3)', textDecoration: 'none', display: 'inline-flex', color: '#166534', borderColor: '#86efac', background: '#f0fdf4' }}
                    >
                      <FileImage size={14} />
                      ดูสลิปการชำระเงิน
                    </a>
                  ) : (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileImage size={12} /> ไม่มีสลิปแนบ
                    </div>
                  )}

                  {selectedOrder.distribution ? (
                    <div className="alert alert-success">
                      <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                      รับเสื้อแล้วโดย <strong>{selectedOrder.distribution.distributors?.name ?? 'ผู้แจก'}</strong>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDistribute(selectedOrder.rowIndex, selectedOrder.phone, selectedOrder.name)}
                      className="btn btn-accent btn-full"
                      disabled={distributing}
                    >
                      {distributing
                        ? <><span className="spinner" style={{ width: 16, height: 16 }} /> กำลังบันทึก...</>
                        : <><CheckCircle2 size={16} /> ยืนยันการแจกเสื้อ</>
                      }
                    </button>
                  )}
                </div>
              )}

              {/* Order List */}
              {allLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                  <span className="spinner" style={{ width: 32, height: 32 }} />
                </div>
              ) : allOrders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Package size={48} /></div>
                  <p className="empty-state-title">ไม่พบข้อมูล</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {allOrders.map(row => (
                    <button
                      key={row.rowIndex}
                      onClick={() => setSelectedOrder(selectedOrder?.rowIndex === row.rowIndex ? null : row)}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-4)',
                        background: selectedOrder?.rowIndex === row.rowIndex ? 'var(--color-primary-light)' : 'var(--color-surface)',
                        border: `1px solid ${selectedOrder?.rowIndex === row.rowIndex ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                          {row.name || '—'}
                          {row.slipUrl && (
                            <span style={{
                              marginLeft: 6, fontSize: '0.65rem',
                              background: '#dcfce7', color: '#166534',
                              borderRadius: 4, padding: '1px 5px',
                              fontWeight: 700,
                            }}><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileImage size={12} />สลิป</span></span>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--space-3)' }}>
                          <span>{row.phone}</span>
                          <span>{row.size} × {row.quantity}</span>
                        </div>
                      </div>
                      <span className={`badge ${row.distribution ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.65rem', marginLeft: 'var(--space-3)', flexShrink: 0 }}>
                        {row.distribution ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} /> : <Clock size={16} style={{ color: 'var(--color-warning)' }} />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
