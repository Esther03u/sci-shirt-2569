import React from 'react';
import {
  Search, CheckCircle2, Clock, Phone, QrCode, X, Package, AlertTriangle, FileImage, ChevronDown, ChevronUp, History, Shirt
} from 'lucide-react';
import { OrderResult, MyStats, OrderRow } from './types';

function getDriveId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.searchParams.has('id')) return u.searchParams.get('id');
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  } catch (e) {
    // ignore invalid URLs
  }
  return null;
}

export function SearchTab({
  phone, setPhone, handleSearch, loading, result,
  showSlip, setShowSlip, handleDistribute, distributing, stats, error,
  guideMode
}: {
  phone: string; setPhone: (s: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  loading: boolean;
  result: OrderResult | null;
  showSlip: boolean; setShowSlip: React.Dispatch<React.SetStateAction<boolean>>;
  handleDistribute: () => void;
  distributing: boolean;
  stats: MyStats | null;
  error: string;
  guideMode?: boolean;
}) {
  const isDistributed = result?.distribution != null;
  const [cooldown, setCooldown] = React.useState(5);

  React.useEffect(() => {
    if (result && !isDistributed) {
      setCooldown(5);
      const timer = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [result, isDistributed]);

  return (
    <>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h2 className="sr-only">ค้นหาด้วยเบอร์โทร</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="tel" className="input" placeholder="ค้นหาด้วยเบอร์โทรศัพท์"
              value={phone} onChange={e => setPhone(e.target.value)}
              inputMode="tel" style={{ paddingLeft: 'var(--space-10)', height: 48, fontSize: 'var(--text-base)', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
              aria-label="เบอร์โทรศัพท์" autoFocus
            />
            <Search size={20} style={{
              position: 'absolute', left: 'var(--space-4)', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--color-primary)', pointerEvents: 'none',
            }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !phone.trim()} style={{ height: 48, width: 48, borderRadius: 'var(--radius-full)', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : <Search size={20} />}
          </button>
        </form>
      </div>

      {result && (
        <div className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', position: 'relative', marginBottom: 'var(--space-4)' }}>
          {/* Header Section */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className={`badge ${isDistributed ? 'badge-success' : 'badge-pending'}`} style={{ fontWeight: 600, fontSize: '0.7rem', padding: '0.2rem 0.6rem', letterSpacing: '0.02em' }}>
                {isDistributed ? 'รับแล้ว' : 'ยังไม่รับ'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 var(--space-2) 0' }}>
              {result.order.name as string}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: '0.875rem', color: 'var(--color-text-muted)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} /> <span>{result.order.phone as string}</span>
              </div>
              {result.order.branch && (
                <>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>{result.order.branch as string}</span>
                </>
              )}
            </div>
          </div>

          {/* Order Details Bento */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', 
            background: 'var(--color-border)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0
          }}>
            {[
              { label: 'ลำดับคิว', value: `#${result.order.displayId || result.order.rowIndex}` },
              { label: 'ไซส์เสื้อ',  value: result.order.size as string || '-' },
              { label: 'จำนวน', value: `${result.order.quantity} ตัว` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--color-surface)', padding: 'var(--space-3) var(--space-2)', 
                display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Slip Section */}
          {result.order.slipUrl ? (
            <div>
              <button
                onClick={() => setShowSlip(v => !v)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--color-foreground)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <FileImage size={16} color="var(--color-text-muted)" />
                  หลักฐานการชำระเงิน
                </div>
                {showSlip ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSlip && (
                <div style={{
                  marginTop: 'var(--space-2)',
                  background: 'var(--color-muted)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {getDriveId(result.order.slipUrl as string) ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${getDriveId(result.order.slipUrl as string)}/preview`}
                      width="100%"
                      height="350"
                      style={{ border: 'none', background: '#fff' }}
                      allow="autoplay"
                    ></iframe>
                  ) : (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                      <FileImage size={24} style={{ opacity: 0.3, marginBottom: 'var(--space-2)' }} />
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ไม่สามารถแสดงตัวอย่างสลิปได้</p>
                    </div>
                  )}
                  <a
                    href={result.order.slipUrl as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      padding: 'var(--space-3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none',
                      borderTop: '1px solid var(--color-border)'
                    }}
                  >
                    ดูสลิปเต็มจอ <FileImage size={12} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: 'var(--space-4)', 
              background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', 
              border: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)'
            }}>
              <FileImage size={20} style={{ opacity: 0.5 }} />
              <span style={{ fontSize: '0.875rem' }}>ไม่มีสลิปแนบมากับออเดอร์นี้</span>
            </div>
          )}

          {/* Action Section */}
          <div style={{ marginTop: 'var(--space-2)', flexShrink: 0 }}>
            {isDistributed ? (
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', 
                borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)'
              }}>
                <CheckCircle2 size={20} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.875rem', color: '#22c55e', fontWeight: 600 }}>แจกเสื้อเรียบร้อยแล้ว</h4>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    ดำเนินการโดย: <span style={{ fontWeight: 500, color: 'var(--color-foreground)' }}>{(result.distribution?.distributors as Record<string, string> | null)?.name ?? 'ผู้แจก'}</span>
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleDistribute()}
                className="btn btn-primary"
                style={{ 
                  width: '100%', height: 48, fontSize: '1rem', fontWeight: 600, 
                  borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: (distributing || cooldown > 0) ? 'var(--color-muted)' : 'var(--color-primary)',
                  color: (distributing || cooldown > 0) ? 'var(--color-text-muted)' : '#fff',
                  border: (distributing || cooldown > 0) ? '1px solid var(--color-border)' : 'none',
                  boxShadow: (distributing || cooldown > 0) ? 'none' : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  cursor: (distributing || cooldown > 0) ? 'not-allowed' : 'pointer'
                }}
                disabled={distributing || cooldown > 0}
              >
                {distributing
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderColor: 'var(--color-text-muted)', borderRightColor: 'transparent' }} /> กำลังบันทึก...</>
                  : cooldown > 0
                  ? <><Clock size={18} /> ตรวจสอบข้อมูล ({cooldown}s)</>
                  : <><Shirt size={18} /> ยืนยันการแจกเสื้อ</>
                }
              </button>
            )}
          </div>
        </div>
      )}

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
  );
}

export function ScanTab({
  scanning, stopScanner, setTab, scanError, scanDivRef
}: {
  scanning: boolean; stopScanner: () => void; setTab: (t: 'search') => void;
  scanError: string; scanDivRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', color: '#fff', paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'calc(var(--space-4) + env(safe-area-inset-top)) var(--space-4) var(--space-4)' }}>
        <h2 style={{ fontSize: 'var(--text-base)', margin: 0, fontWeight: 600 }}>สแกน QR Code</h2>
        <button onClick={() => { stopScanner(); setTab('search'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <X size={14} /> ปิด
        </button>
      </div>
      {scanError && (
        <div className="alert alert-error" style={{ margin: '0 var(--space-4) var(--space-4)' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          {scanError}
        </div>
      )}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div id="qr-scan-region" ref={scanDivRef} style={{ width: '100%', maxWidth: 400 }} />
        
        {/* Dim Overlay around the scan region to focus user (handled by html5-qrcode natively mostly, but we can style the container) */}
        
        {!scanning && !scanError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)',
            color: '#fff', fontSize: 'var(--text-sm)',
          }}>
            <span className="spinner" style={{ width: 32, height: 32, borderColor: '#fff', borderRightColor: 'transparent' }} />
            <span>กำลังเปิดกล้อง...</span>
          </div>
        )}
      </div>
      <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          ให้นักศึกษาแสดง QR Code จากหน้าเว็บของตัวเอง แล้วนำกล้องไปใกล้
        </p>
      </div>
    </div>
  );
}

export function AllOrdersTab({
  allTotal, allDistributed, allSearch, setAllSearch, loadAllOrders, allFilter, setAllFilter, allLoading,
  allOrders, selectedOrder, setSelectedOrder, handleDistribute, distributing
}: {
  allTotal: number; allDistributed: number;
  allSearch: string; setAllSearch: (s: string) => void;
  loadAllOrders: (f: 'all' | 'distributed' | 'pending', s: string) => void;
  allFilter: 'all' | 'distributed' | 'pending'; setAllFilter: (f: 'all' | 'distributed' | 'pending') => void;
  allLoading: boolean;
  allOrders: OrderRow[];
  selectedOrder: OrderRow | null; setSelectedOrder: (o: OrderRow | null) => void;
  handleDistribute: (sheetRowId: number, phone: string, name: string) => void;
  distributing: boolean;
}) {
  const filteredOrders = React.useMemo(() => {
    if (!allSearch.trim()) return allOrders;
    const s = allSearch.toLowerCase().trim();
    return allOrders.filter(row => 
      (row.name && row.name.toLowerCase().includes(s)) ||
      (row.searchPhones && row.searchPhones.includes(s)) ||
      (row.phone && row.phone.includes(s))
    );
  }, [allOrders, allSearch]);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  const [cooldown, setCooldown] = React.useState(5);

  React.useEffect(() => {
    if (selectedOrder && !selectedOrder.distribution) {
      setCooldown(5);
      const timer = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedOrder]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [allSearch, allFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
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

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', position: 'sticky', top: 10, zIndex: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text" className="input" placeholder="ค้นหาชื่อ หรือเบอร์โทร (Live Search)"
            value={allSearch}
            onChange={e => setAllSearch(e.target.value)}
            style={{ paddingLeft: 'var(--space-10)', paddingRight: 'var(--space-10)', boxShadow: 'var(--shadow-sm)' }}
          />
          <Search size={16} style={{
            position: 'absolute', left: 'var(--space-3)', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-text-light)', pointerEvents: 'none',
          }} />
          {allSearch && (
            <button
              onClick={() => setAllSearch('')}
              style={{
                position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => loadAllOrders(allFilter, '')} className="btn btn-outline" disabled={allLoading} title="รีเฟรชข้อมูลล่าสุด">
          {allLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <History size={16} />}
        </button>
      </div>

      <div className="segmented-control" style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
        {([
          { key: 'all' as const,         label: 'ทั้งหมด' },
          { key: 'pending' as const,     label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={16} /> ยังไม่รับ</span> },
          { key: 'distributed' as const, label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={16} /> รับแล้ว</span> },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setAllFilter(key); loadAllOrders(key, allSearch); }}
            className="tab-btn"
            aria-selected={allFilter === key}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedOrder && (
        <div className="dialog-backdrop" onClick={() => setSelectedOrder(null)} style={{ zIndex: 100 }}>
          <div className="dialog" onClick={e => e.stopPropagation()} style={{
            position: 'relative',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)'
          }}>
            {/* Close Button */}
            <button onClick={() => setSelectedOrder(null)} className="btn btn-ghost btn-sm" style={{ 
              position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', 
              borderRadius: 'var(--radius-full)', width: 32, height: 32, padding: 0, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)', background: 'transparent'
            }}>
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ paddingRight: 'var(--space-8)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className={`badge ${selectedOrder.distribution ? 'badge-success' : 'badge-pending'}`} style={{ fontWeight: 600, fontSize: '0.7rem', padding: '0.2rem 0.6rem', letterSpacing: '0.02em' }}>
                  {selectedOrder.distribution ? 'รับแล้ว' : 'ยังไม่รับ'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 var(--space-2) 0' }}>
                {selectedOrder.name}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: '0.875rem', color: 'var(--color-text-muted)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} /> <span>{selectedOrder.phone}</span>
                </div>
                {selectedOrder.branch && (
                  <>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{selectedOrder.branch}</span>
                  </>
                )}
              </div>
            </div>

            {/* Bento Details */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', 
              background: 'var(--color-border)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0
            }}>
              {[
                { label: 'ลำดับคิว', value: `#${selectedOrder.displayId || selectedOrder.rowIndex}` },
                { label: 'ไซส์เสื้อ',  value: selectedOrder.size || '-' },
                { label: 'จำนวน', value: `${selectedOrder.quantity} ตัว` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--color-surface)', padding: 'var(--space-3) var(--space-2)', 
                  display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Slip */}
            {selectedOrder.slipUrl ? (
              <div>
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  marginBottom: 'var(--space-2)' 
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>หลักฐานการชำระเงิน</span>
                  <a href={selectedOrder.slipUrl} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600
                  }}>
                    ดูเต็มจอ <FileImage size={12} />
                  </a>
                </div>
                <div style={{ 
                  background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', overflow: 'hidden', 
                  border: '1px solid var(--color-border)', position: 'relative'
                }}>
                  {getDriveId(selectedOrder.slipUrl) ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${getDriveId(selectedOrder.slipUrl)}/preview`}
                      width="100%"
                      height="320"
                      style={{ border: 'none', display: 'block', background: '#fff' }}
                      allow="autoplay"
                    />
                  ) : (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                      <FileImage size={24} style={{ opacity: 0.3, marginBottom: 'var(--space-2)' }} />
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>ไม่สามารถแสดงตัวอย่างสลิปได้</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: 'var(--space-4)', 
                background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', 
                border: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-muted)'
              }}>
                <FileImage size={20} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '0.875rem' }}>ไม่มีสลิปแนบมากับออเดอร์นี้</span>
              </div>
            )}

            {/* Action */}
            <div style={{ marginTop: 'auto', flexShrink: 0 }}>
              {selectedOrder.distribution ? (
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', 
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)'
                }}>
                  <CheckCircle2 size={20} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '0.875rem', color: '#22c55e', fontWeight: 600 }}>แจกเสื้อเรียบร้อยแล้ว</h4>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      ดำเนินการโดย: <span style={{ fontWeight: 500, color: 'var(--color-foreground)' }}>{selectedOrder.distribution.distributors?.name ?? 'ผู้แจก'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleDistribute(selectedOrder.rowIndex, selectedOrder.phone, selectedOrder.name)}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', height: 48, fontSize: '1rem', fontWeight: 600, 
                    borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: (distributing || cooldown > 0) ? 'var(--color-muted)' : 'var(--color-primary)',
                    color: (distributing || cooldown > 0) ? 'var(--color-text-muted)' : '#fff',
                    border: (distributing || cooldown > 0) ? '1px solid var(--color-border)' : 'none',
                    boxShadow: (distributing || cooldown > 0) ? 'none' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                    cursor: (distributing || cooldown > 0) ? 'not-allowed' : 'pointer'
                  }}
                  disabled={distributing || cooldown > 0}
                >
                  {distributing
                    ? <><span className="spinner" style={{ width: 18, height: 18, borderColor: 'var(--color-text-muted)', borderRightColor: 'transparent' }} /> กำลังบันทึก...</>
                    : cooldown > 0
                    ? <><Clock size={18} /> ตรวจสอบข้อมูล ({cooldown}s)</>
                    : <><Shirt size={18} /> ยืนยันการแจกเสื้อ</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {allLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={48} /></div>
          <p className="empty-state-title">ไม่พบข้อมูล</p>
        </div>
      ) : (
        <>
          <div className="app-list" style={{ marginTop: 'var(--space-2)' }}>
            {paginatedOrders.map(row => (
              <div
                key={row.rowIndex}
                className={`app-list-item ${selectedOrder?.rowIndex === row.rowIndex ? 'selected' : ''}`}
                onClick={() => setSelectedOrder(selectedOrder?.rowIndex === row.rowIndex ? null : row)}
                style={{
                  background: selectedOrder?.rowIndex === row.rowIndex ? 'var(--color-primary-light)' : 'transparent',
                  borderColor: selectedOrder?.rowIndex === row.rowIndex ? 'var(--color-primary)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="app-list-item-content">
                  <span className="app-list-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    {row.name || '—'}
                    {row.branch && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>({row.branch})</span>
                    )}
                    {row.slipUrl && (
                      <span style={{
                        fontSize: '0.65rem',
                        background: '#dcfce7', color: '#166534',
                        borderRadius: 4, padding: '2px 6px',
                        fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
                      }}><FileImage size={12} />สลิป</span>
                    )}
                  </span>
                  <span className="app-list-subtitle" style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 2 }}>
                    <span><Phone size={12} style={{ verticalAlign: 'text-top', marginRight: 4 }} />{row.phone}</span>
                    <span><Shirt size={12} style={{ verticalAlign: 'text-top', marginRight: 4 }} />{row.size} × {row.quantity}</span>
                  </span>
                </div>
                <div className="app-list-trailing">
                  {row.distribution ? (
                    <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <Clock size={24} style={{ color: 'var(--color-warning)' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 'var(--space-4)', padding: 'var(--space-3)',
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'
            }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </button>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                หน้า {currentPage} จาก {totalPages}
              </div>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                ถัดไป
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
