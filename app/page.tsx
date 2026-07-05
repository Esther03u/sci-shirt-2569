'use client';
// app/page.tsx — Public Search Page

import { useState } from 'react';
import { Search, Package, CheckCircle2, Clock, QrCode } from 'lucide-react';
import OrderCard from '@/components/OrderCard';

interface Distribution {
  id: string;
  distributed_at?: string;
  distributors?: { name: string };
  [key: string]: unknown;
}

export default function HomePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    order: Record<string, string | number | undefined>;
    distribution: Distribution | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?phone=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ไม่พบข้อมูล');
      } else {
        setResult(data);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">SCI Shirt 2569</span>
        <a href="/login" className="btn btn-outline btn-sm">เข้าสู่ระบบ</a>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, padding: 'var(--space-8) var(--space-4)' }}>
        <div className="container" style={{ maxWidth: 680 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              background: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
            }}>
              <Package size={32} color="var(--color-primary)" />
            </div>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>
              เช็คเสื้อ Freshy 2569
            </h1>
            <p style={{
              color: 'var(--color-text-muted)',
              margin: '0 auto',
              maxWidth: 480,
            }}>
              คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต<br />
              กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้เพื่อตรวจสอบข้อมูล
            </p>
          </div>

          {/* Search Form */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <form onSubmit={handleSearch}>
              <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label htmlFor="phone-input" className="input-label">
                  เบอร์โทรศัพท์ <span className="required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="phone-input"
                    type="tel"
                    className={`input${error ? ' input-error' : ''}`}
                    placeholder="เช่น 0812345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  />
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 'var(--space-3)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-light)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                {error && <p className="input-error-msg">{error}</p>}
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || !phone.trim()}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังค้นหา...</>
                ) : (
                  <><Search size={18} /> ค้นหาข้อมูล</>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          {searched && !loading && (
            <>
              {result ? (
                <OrderCard order={result.order} distribution={result.distribution} />
              ) : error && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Package size={64} />
                  </div>
                  <p className="empty-state-title">ไม่พบข้อมูลการสั่งซื้อ</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                    กรุณาตรวจสอบเบอร์โทรศัพท์อีกครั้ง หรือติดต่อผู้ดูแลระบบ
                  </p>
                </div>
              )}
            </>
          )}

          {/* Initial hint */}
          {!searched && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)',
            }}>
              {[
                { icon: CheckCircle2, color: 'var(--color-success)', text: 'ตรวจสอบสถานะการรับเสื้อ' },
                { icon: QrCode,       color: 'var(--color-primary)', text: 'รับ QR Code สำหรับการรับเสื้อ' },
                { icon: Clock,        color: 'var(--color-warning)', text: 'ดูข้อมูลการสั่งซื้อของคุณ' },
              ].map(({ icon: Icon, color, text }) => (
                <div key={text} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                }}>
                  <Icon size={18} style={{ color, flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: 'var(--space-6) var(--space-4)',
        textAlign: 'center',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-xs)',
      }}>
        คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต © 2569
      </footer>
    </div>
  );
}
