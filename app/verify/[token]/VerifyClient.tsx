'use client';
// app/verify/[token]/VerifyClient.tsx

import { useState } from 'react';
import { CheckCircle2, Clock, Package, Phone, Ruler, Hash, User, ArrowLeft } from 'lucide-react';
import type { ShirtOrder } from '@/lib/google-sheets';

interface Distribution {
  id: string;
  distributed_at?: string;
  distributors?: { name: string };
  [key: string]: unknown;
}

interface Props {
  order: ShirtOrder;
  distribution: Distribution | null;
  canDistribute: boolean;
  isAdmin: boolean;
  token: string;
}

export default function VerifyClient({ order, distribution, canDistribute, isAdmin, token }: Props) {
  const [localDist, setLocalDist] = useState<Distribution | null>(distribution);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isDistributed = !!localDist;

  async function handleDistribute() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetRowId: order.rowIndex, phone: order.phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setLocalDist({ id: data.distribution.id, distributed_at: data.distribution.distributed_at });
      }
    } catch { setError('เกิดข้อผิดพลาด'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-background)', padding: 'var(--space-4)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Back */}
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-6)', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> กลับหน้าหลัก
        </a>

        {/* Status Banner */}
        <div style={{
          background: isDistributed ? 'var(--color-success)' : 'var(--color-accent)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isDistributed
              ? <CheckCircle2 size={32} />
              : <Clock size={32} />
            }
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {isDistributed ? 'รับเสื้อแล้ว' : 'ยังไม่ได้รับเสื้อ'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginTop: 2 }}>
              {isDistributed && localDist?.distributed_at
                ? `รับเมื่อ ${new Date(localDist.distributed_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}`
                : 'รอการแจก'
              }
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-5)' }}>
            {order.name}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[
              { icon: Hash,   label: 'ลำดับที่', value: `#${order.rowIndex}` },
              { icon: Phone,  label: 'เบอร์โทร',  value: order.phone },
              { icon: Ruler,  label: 'ไซส์',      value: order.size || '-' },
              { icon: Package, label: 'จำนวน',   value: `${order.quantity} ตัว` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                padding: 'var(--space-3)',
                background: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                  marginBottom: 4,
                }}>
                  <Icon size={11} /> {label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700,
                  fontSize: 'var(--text-base)', color: 'var(--color-foreground)',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {isDistributed && localDist?.distributors?.name && (
            <div className="alert alert-success" style={{ marginTop: 'var(--space-4)' }}>
              <User size={16} style={{ flexShrink: 0 }} />
              แจกโดย <strong>{localDist.distributors.name}</strong>
            </div>
          )}
        </div>

        {/* Action */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {canDistribute && !isDistributed && (
          <button
            onClick={handleDistribute}
            disabled={loading}
            className="btn btn-accent btn-full btn-lg"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 20, height: 20 }} /> กำลังบันทึก...</>
              : <><CheckCircle2 size={22} /> ยืนยันการแจกเสื้อ</>
            }
          </button>
        )}

        {!canDistribute && !isDistributed && (
          <div style={{ textAlign: 'center' }}>
            <a href="/login" className="btn btn-primary btn-full btn-lg">
              เข้าสู่ระบบเพื่อแจกเสื้อ
            </a>
            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              เฉพาะผู้แจกที่ login แล้วเท่านั้น
            </p>
          </div>
        )}

        {isAdmin && isDistributed && (
          <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
            ต้องการยกเลิก? ไปที่{' '}
            <a href="/dashboard">Admin Dashboard</a>
          </p>
        )}
      </div>
    </div>
  );
}
