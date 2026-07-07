'use client';
// app/distribute/page.tsx — Distributor page: search / scan / all orders + slip viewer

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, CheckCircle2, Clock, LogOut, Shirt, Phone,
  QrCode, X, Package, TrendingUp, History, AlertTriangle,
  List, FileImage, ChevronDown, ChevronUp, LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

import type { Html5Qrcode } from 'html5-qrcode';
import { OrderResult, MyStats, OrderRow, Tab } from './types';
import { SearchTab, ScanTab, AllOrdersTab } from './Tabs';
import AdminLayout from '@/components/AdminLayout';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
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
    search = '' // kept for backwards compatibility in args, but not sent to server
  ) => {
    setAllLoading(true);
    try {
      const params = new URLSearchParams({ filter });
      // We fetch all orders for the current filter to allow client-side live search
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
    
    import('html5-qrcode').then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
      if (!scanDivRef.current) return;
      
      try {
        const scanner = new Html5Qrcode('qr-scan-region', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        scannerRef.current = scanner;
        setScanning(true);
        setScanError('');
        
        scanner.start(
          { facingMode: 'environment' },
          { 
            fps: 60, // Maximum frame rate
            qrbox: { width: 250, height: 250 },
            disableFlip: true, // Do not scan for mirrored QR codes, doubles scanning speed
          },
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
        scannerRef.current.stop().catch(() => {});
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function handleQrScan(scannedText: string) {
    setLoading(true); setError(''); setResult(null); setSuccessMsg('');
    
    // Extract token if the scanned text is a full URL (e.g. from OrderCard QR)
    let token = scannedText;
    try {
      if (scannedText.startsWith('http')) {
        const url = new URL(scannedText);
        const parts = url.pathname.split('/').filter(Boolean);
        token = parts[parts.length - 1] || scannedText;
      }
    } catch {}

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
    <AdminLayout>
      <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
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
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-2)', marginBottom: 'var(--space-4)'
            }}>
              {[
                { label: 'ของฉัน', value: stats.myStats.total, icon: Shirt, color: 'var(--color-accent)' },
                { label: 'วันนี้', value: stats.myStats.today, icon: TrendingUp, color: 'var(--color-primary)' },
                { label: 'ทั้งหมด', value: stats.overall.distributed, icon: CheckCircle2, color: 'var(--color-success)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card" style={{
                  padding: 'var(--space-3) var(--space-2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 'var(--space-1)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--color-text-muted)' }}>
                    <Icon size={12} style={{ color }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-xl)', color, lineHeight: 1, marginTop: 2 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 'var(--space-3)', 
            marginBottom: 'var(--space-6)' 
          }}>
            {([
              { key: 'search', label: 'ค้นหาเบอร์',    icon: Search },
              { key: 'scan',   label: 'สแกน QR',       icon: QrCode },
              { key: 'all',    label: 'ทั้งหมด',  icon: List   },
            ] as const).map(({ key, label, icon: Icon }) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4) var(--space-2)',
                    minHeight: '100px',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--glass-border)',
                    background: isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'var(--glass-bg)',
                    color: isActive ? '#111' : 'var(--color-text-muted)',
                    boxShadow: isActive ? '0 8px 24px var(--color-primary-glow)' : 'var(--shadow-sm)',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)'
                  }}
                  aria-selected={isActive}
                >
                  <Icon size={32} strokeWidth={isActive ? 2.5 : 2} style={{ filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: isActive ? 700 : 500, letterSpacing: '-0.01em' }}>{label}</span>
                </button>
              );
            })}
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
            <SearchTab
              phone={phone} setPhone={setPhone} handleSearch={handleSearch}
              loading={loading} result={result} showSlip={showSlip} setShowSlip={setShowSlip}
              handleDistribute={handleDistribute} distributing={distributing} stats={stats} error={error}
            />
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: SCAN                               */}
          {/* ═══════════════════════════════════════ */}
          {tab === 'scan' && (
            <ScanTab
              scanning={scanning} stopScanner={stopScanner} setTab={setTab}
              scanError={scanError} scanDivRef={scanDivRef}
            />
          )}

          {/* ═══════════════════════════════════════ */}
          {/* TAB: ALL ORDERS                         */}
          {/* ═══════════════════════════════════════ */}
          {tab === 'all' && (
            <AllOrdersTab
              allTotal={allTotal} allDistributed={allDistributed}
              allSearch={allSearch} setAllSearch={setAllSearch} loadAllOrders={loadAllOrders}
              allFilter={allFilter} setAllFilter={setAllFilter} allLoading={allLoading}
              allOrders={allOrders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
              handleDistribute={handleDistribute} distributing={distributing}
            />
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
