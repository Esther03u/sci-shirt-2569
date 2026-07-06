import React from 'react';
import {
  Search, CheckCircle2, Clock, Phone, QrCode, X, Package, AlertTriangle, FileImage, ChevronDown, ChevronUp, History
} from 'lucide-react';
import { OrderResult, MyStats, OrderRow } from './types';

export function SearchTab({
  phone, setPhone, handleSearch, loading, result,
  showSlip, setShowSlip, handleDistribute, distributing, stats, error
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
}) {
  const isDistributed = result?.distribution != null;

  return (
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

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {([
          { key: 'all' as const,         label: 'ทั้งหมด' },
          { key: 'pending' as const,     label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> ยังไม่รับ</span> },
          { key: 'distributed' as const, label: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> รับแล้ว</span> },
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
  );
}
