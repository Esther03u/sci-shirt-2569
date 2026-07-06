'use client';
// components/OrderCard.tsx — Phosphor Icons Duotone

import { useState, useEffect } from 'react';
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

  const isDistributed = !!distribution;
  const distributorName = distribution?.distributors?.name ?? '';

  useEffect(() => {
    let cancelled = false;
    async function generateQr() {
      try {
        const QRCode = (await import('qrcode')).default;
        const verifyUrl = `${window.location.origin}/verify/${btoa(`${order.rowIndex}:${order.phone}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
        const dataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 220,
          margin: 2,
          color: { dark: '#4C1D95', light: '#FFFFFF' },
        });
        if (!cancelled) { setQrDataUrl(dataUrl); setQrLoading(false); }
      } catch {
        if (!cancelled) setQrLoading(false);
      }
    }
    generateQr();
    return () => { cancelled = true; };
  }, [order.rowIndex, order.phone]);

  function handleDownloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-shirt-${order.phone}.png`;
    a.click();
  }

  const statusColor = isDistributed ? 'oklch(0.64 0.18 162)' : 'oklch(0.72 0.18 72)';

  return (
    <div className="glass-card" style={{
      overflow: 'hidden',
      boxShadow: `0 24px 64px oklch(0 0 0 / 0.50), 0 0 0 1px oklch(1 0 0 / 0.08), 0 0 40px ${isDistributed ? 'oklch(0.64 0.18 162 / 0.10)' : 'oklch(0.72 0.18 72 / 0.10)'}`,
    }}>
      {/* Accent bar */}
      <div style={{
        height: 3,
        background: isDistributed
          ? 'linear-gradient(90deg, oklch(0.55 0.20 162), oklch(0.64 0.18 180))'
          : 'linear-gradient(90deg, oklch(0.68 0.24 335), oklch(0.72 0.18 72))',
      }} />

      <div style={{ padding: 'var(--space-6)' }}>

        {/* Status Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-5)',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-1)',
            }}>
              <Sparkle size={12} weight="duotone" style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                รายการสั่งซื้อ
              </span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)',
              fontWeight: 700, color: 'var(--color-foreground)',
            }}>
              {order.name as string || 'ไม่ระบุชื่อ'}
            </h2>
          </div>
          <span className={`badge ${isDistributed ? 'badge-success' : 'badge-pending'}`}>
            {isDistributed
              ? <><CheckCircle size={13} weight="fill" /> รับเสื้อแล้ว</>
              : <><Clock size={13} weight="duotone" /> ยังไม่ได้รับ</>}
          </span>
        </div>

        {/* Order Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}>
          {[
            { icon: Hash,  label: 'ลำดับที่', value: `#${order.rowIndex}`, color: 'oklch(0.60 0.25 293)' },
            { icon: Phone, label: 'เบอร์โทร',  value: order.phone as string, color: 'oklch(0.64 0.18 162)' },
            { icon: Ruler, label: 'ไซส์',      value: order.size as string || '-', color: 'oklch(0.72 0.18 72)' },
            { icon: User,  label: 'จำนวน',    value: `${order.quantity} ตัว`, color: 'oklch(0.68 0.24 335)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{
              padding: 'var(--space-4)',
              background: 'oklch(1 0 0 / 0.04)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-xs)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <Icon size={12} weight="duotone" style={{ color }} />
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

        {/* Distribution info */}
        {isDistributed && distributorName && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>
            <CheckCircle size={16} weight="duotone" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              รับเสื้อแล้วโดย <strong>{distributorName}</strong>
              {distribution?.distributed_at && (
                <span style={{ display: 'block', fontSize: 'var(--text-xs)', marginTop: 2, opacity: 0.8 }}>
                  {new Date(distribution.distributed_at as string).toLocaleString('th-TH')}
                </span>
              )}
            </span>
          </div>
        )}

        {/* QR Code Section */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-5)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginBottom: 'var(--space-5)',
            color: 'var(--color-foreground)', fontWeight: 600,
          }}>
            <QrCode size={19} weight="duotone" style={{ color: statusColor }} />
            QR Code สำหรับรับเสื้อ
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            {qrLoading ? (
              <div className="skeleton" style={{ width: 220, height: 220, borderRadius: 'var(--radius-md)' }} />
            ) : qrDataUrl ? (
              <div style={{
                padding: 'var(--space-4)', background: '#fff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 40px oklch(0.60 0.25 293 / 0.20)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR Code สำหรับ ${order.name}`}
                  width={220} height={220}
                  style={{ display: 'block', borderRadius: 4 }}
                />
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                ไม่สามารถสร้าง QR Code ได้
              </p>
            )}

            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
              textAlign: 'center', maxWidth: 280,
            }}>
              แสดง QR Code นี้ให้ผู้แจกเสื้อ หรือบันทึกไว้ในโทรศัพท์
            </p>

            {qrDataUrl && (
              <button onClick={handleDownloadQr} className="btn btn-outline btn-sm" id="download-qr-btn">
                <DownloadSimple size={15} weight="duotone" />
                บันทึก QR Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
