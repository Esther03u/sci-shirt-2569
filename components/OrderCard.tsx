'use client';
// components/OrderCard.tsx — Phosphor Icons Duotone

import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  CheckCircle, Clock, DownloadSimple, QrCode,
  User, Phone, Ruler, Hash, Sparkle,
} from '@phosphor-icons/react';

interface Distribution {
  id: string;
  distributed_at?: string;
  distributors?: { name: string };
  [key: string]: unknown;
}

interface OrderCardProps {
  order: Record<string, string | number | undefined>;
  distribution: Distribution | null;
}

export default function OrderCard({ order, distribution }: OrderCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  const isDistributed = !!distribution;
  const distributorName = distribution?.distributors?.name ?? '';

  useEffect(() => {
    let cancelled = false;
    async function generateQr() {
      try {
        const QRCode = (await import('qrcode')).default;
        const verifyUrl = `${window.location.origin}/verify/${btoa(`${order.rowIndex}:${order.phone}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
        const dataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 320,
          margin: 1.5,
          color: { dark: '#3B0764', light: '#FFFFFF' },
        });
        if (!cancelled) { setQrDataUrl(dataUrl); setQrLoading(false); }
      } catch {
        if (!cancelled) setQrLoading(false);
      }
    }
    generateQr();
    return () => { cancelled = true; };
  }, [order.rowIndex, order.phone]);

  async function handleDownloadQr() {
    if (!cardRef.current || !qrDataUrl) return;
    
    try {
      if (downloadBtnRef.current) {
        downloadBtnRef.current.style.visibility = 'hidden';
      }

      const image = await toPng(cardRef.current, {
        pixelRatio: 3, // High-res capture for print/share
        backgroundColor: '#141416', // Dark elegant background matching color-surface
        style: {
          transform: 'scale(1)',
        },
      });

      if (downloadBtnRef.current) {
        downloadBtnRef.current.style.visibility = 'visible';
      }

      const a = document.createElement('a');
      a.href = image;
      a.download = `qr-shirt-${order.phone}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to capture image', err);
      if (downloadBtnRef.current) {
        downloadBtnRef.current.style.visibility = 'visible';
      }
    }
  }

  const statusColor = isDistributed ? 'oklch(0.64 0.18 162)' : 'oklch(0.75 0.14 85)';

  return (
    <div 
      ref={cardRef}
      className="card" 
      style={{
        padding: 0,
        overflow: 'hidden',
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: `0 24px 64px oklch(0 0 0 / 0.60), 0 0 0 1px oklch(1 0 0 / 0.05), 0 0 40px ${isDistributed ? 'oklch(0.64 0.18 162 / 0.15)' : 'oklch(0.75 0.14 85 / 0.15)'}`,
      }}
    >
      {/* Premium Gradient Accent Bar */}
      <div style={{
        height: 4,
        background: isDistributed
          ? 'linear-gradient(90deg, oklch(0.55 0.20 162), oklch(0.64 0.18 180))'
          : 'linear-gradient(90deg, oklch(0.68 0.24 335), var(--color-primary))',
      }} />

      <div style={{ padding: 'var(--space-5) var(--space-5)' }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-1)',
            }}>
              <Sparkle size={14} weight="duotone" style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ 
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', 
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' 
              }}>
                รายการสั่งซื้อ
              </span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
              fontWeight: 700, color: 'var(--color-foreground)',
              letterSpacing: '-0.02em', lineHeight: 1.2
            }}>
              {order.name as string || 'ไม่ระบุชื่อ'}
            </h2>
          </div>
          <span className={`badge ${isDistributed ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-xs)' }}>
            {isDistributed
              ? <><CheckCircle size={14} weight="fill" /> รับเสื้อแล้ว</>
              : <><Clock size={14} weight="fill" /> ยังไม่ได้รับ</>}
          </span>
        </div>

        {/* Data Grid Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-5)',
        }}>
          {[
            { icon: Hash,  label: 'ลำดับที่', value: `#${order.displayId || order.rowIndex}`, color: 'oklch(0.60 0.25 293)' },
            { icon: Phone, label: 'เบอร์โทร',  value: order.phone as string, color: 'oklch(0.70 0.12 155)' },
            { icon: Ruler, label: 'ไซส์',      value: order.size as string || '-', color: 'oklch(0.75 0.15 70)' },
            { icon: User,  label: 'จำนวน',    value: `${order.quantity} ตัว`, color: 'oklch(0.68 0.24 335)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              padding: 'var(--space-3)',
              background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                color: 'var(--color-text-muted)',
                fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                <Icon size={14} weight="duotone" style={{ color }} />
                {label}
              </div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                color: 'var(--color-foreground)', fontSize: 'var(--text-base)',
                letterSpacing: '-0.01em',
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Distribution Alert */}
        {isDistributed && distributorName && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
            <CheckCircle size={18} weight="duotone" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 'var(--text-sm)' }}>
                รับเสื้อแล้วโดย {distributorName}
              </div>
              {distribution?.distributed_at && (
                <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.85, fontWeight: 500 }}>
                  {new Date(distribution.distributed_at as string).toLocaleString('th-TH')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Divider & Section */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
            color: 'var(--color-foreground)', fontWeight: 600, fontSize: 'var(--text-sm)',
          }}>
            <QrCode size={18} weight="duotone" style={{ color: statusColor }} />
            QR Code สำหรับรับเสื้อ
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            {qrLoading ? (
              <div className="skeleton" style={{ width: 180, height: 180, borderRadius: 'var(--radius-lg)' }} />
            ) : qrDataUrl ? (
              <div style={{
                padding: 'var(--space-2)', background: '#fff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px oklch(0 0 0 / 0.30)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR Code สำหรับ ${order.name}`}
                  width={180} height={180}
                  style={{ display: 'block', borderRadius: '6px' }}
                />
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                ไม่สามารถสร้าง QR Code ได้
              </p>
            )}

            <p style={{
              fontSize: '12px', color: 'var(--color-text-muted)',
              textAlign: 'center', maxWidth: 280, lineHeight: 1.4,
              fontWeight: 500
            }}>
              แสดง QR Code นี้ให้ผู้แจกเสื้อ หรือบันทึกไว้ในโทรศัพท์
            </p>

            {qrDataUrl && (
              <div data-html2canvas-ignore="true" style={{ width: '100%', marginTop: 'var(--space-1)' }}>
                <button 
                  ref={downloadBtnRef}
                  onClick={handleDownloadQr} 
                  className="btn btn-outline btn-full btn-lg" 
                  style={{ fontWeight: 600, letterSpacing: '0.02em' }}
                >
                  <DownloadSimple size={18} weight="duotone" />
                  บันทึก QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
