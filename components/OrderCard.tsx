'use client';
// components/OrderCard.tsx — Displays order info with QR code

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Download, QrCode, User, Phone, Ruler, Hash } from 'lucide-react';

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


  // Generate QR code client-side
  useEffect(() => {
    let cancelled = false;
    async function generateQr() {
      try {
        const QRCode = (await import('qrcode')).default;
        const verifyUrl = `${window.location.origin}/verify/${btoa(`${order.rowIndex}:${order.phone}`).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
        const dataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 220,
          margin: 1,
          color: { dark: '#4C1D95', light: '#FFFFFF' },
        });
        if (!cancelled) {
          setQrDataUrl(dataUrl);
          setQrLoading(false);
        }
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

  return (
    <div className="card" style={{ borderTop: `4px solid ${isDistributed ? 'var(--color-success)' : 'var(--color-accent)'}` }}>
      {/* Status Header */}
      <div className="card-header" style={{ flexWrap: 'wrap' }}>
        <h2 className="card-title" style={{ fontSize: 'var(--text-xl)' }}>
          {order.name as string || 'ไม่ระบุชื่อ'}
        </h2>
        <span className={`badge ${isDistributed ? 'badge-success' : 'badge-pending'}`}>
          {isDistributed ? (
            <><CheckCircle2 size={12} /> รับเสื้อแล้ว</>
          ) : (
            <><Clock size={12} /> ยังไม่ได้รับ</>
          )}
        </span>
      </div>

      {/* Order Details */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'var(--color-muted)',
        borderRadius: 'var(--radius-md)',
      }}>
        {[
          { icon: Hash,   label: 'ลำดับที่', value: `#${order.rowIndex}` },
          { icon: Phone,  label: 'เบอร์โทร',  value: order.phone as string },
          { icon: Ruler,  label: 'ไซส์',      value: order.size as string || '-' },
          { icon: User,   label: 'จำนวน',    value: `${order.quantity} ตัว` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-1)',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <Icon size={12} />
              {label}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--color-foreground)',
              fontSize: 'var(--text-base)',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Distribution info */}
      {isDistributed && distributorName && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
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
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-5)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
          color: 'var(--color-foreground)',
          fontWeight: 600,
        }}>
          <QrCode size={18} />
          QR Code สำหรับรับเสื้อ
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          {qrLoading ? (
            <div className="skeleton" style={{ width: 220, height: 220, borderRadius: 'var(--radius-md)' }} />
          ) : qrDataUrl ? (
            <div style={{
              padding: 'var(--space-3)',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR Code สำหรับ ${order.name}`}
                width={220}
                height={220}
                style={{ display: 'block' }}
              />
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              ไม่สามารถสร้าง QR Code ได้
            </p>
          )}

          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            maxWidth: 280,
          }}>
            แสดง QR Code นี้ให้ผู้แจกเสื้อ หรือบันทึกไว้ในโทรศัพท์
          </p>

          {qrDataUrl && (
            <button
              onClick={handleDownloadQr}
              className="btn btn-outline btn-sm"
            >
              <Download size={14} />
              บันทึก QR Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
