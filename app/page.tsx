'use client';
// app/page.tsx — Public Search Page (Phosphor Icons Duotone)

import { useState, useEffect } from 'react';
import {
  MagnifyingGlass, Package, CheckCircle, Clock, QrCode,
  Sparkle, TShirt, ArrowRight, Megaphone,
} from '@phosphor-icons/react';
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
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then(d => { if (d.announcement) setAnnouncement(d.announcement); })
      .catch(() => {});
  }, []);

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
      {/* Ambient background blobs */}
      <div className="bg-ambient" aria-hidden="true" />

      {/* ── Navbar ── */}
      <nav className="navbar" style={{ backdropFilter: 'blur(16px)', background: 'oklch(0 0 0 / 0.4)', borderBottom: '1px solid oklch(1 1 1 / 0.05)', boxShadow: '0 4px 30px oklch(0 0 0 / 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 46, height: 46,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            position: 'relative'
          }}>
            <img src="/smo-logo.png" alt="SMO Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }} />
          </div>
        </div>
        <a href="/login" className="btn btn-outline btn-sm">
          เข้าสู่ระบบ <ArrowRight size={14} weight="bold" />
        </a>
      </nav>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: 'var(--space-12) var(--space-4) var(--space-8)' }}>
        <div className="container" style={{ maxWidth: 680 }}>

          {/* ── Hero Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)', animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
            {/* Chip */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-5)' }}>
              <span className="chip" style={{ animation: 'fadeIn 1s ease-out 0.2s both' }}>
                <Sparkle size={11} weight="fill" />
                คณะวิทยาศาสตร์และเทคโนโลยี • มรภ.ภูเก็ต
              </span>
            </div>

            {/* Hero Logo */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              marginBottom: 'var(--space-4)',
              animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both',
              position: 'relative'
            }}>
              <img src="/smo-logo.png" alt="SMO Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'screen' }} />
            </div>

            <h1 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-foreground)', fontSize: '1.75rem', lineHeight: 1.4, animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both', letterSpacing: '-0.02em' }}>
              เช็คลำดับรายชื่อรับเสื้อ<span className="gradient-text">เฟรชชี่</span><br />
              คณะวิทยาศาสตร์และเทคโนโลยี 2569
            </h1>
            <p style={{
              color: 'var(--color-text-muted)',
              margin: '0 auto',
              maxWidth: 480,
              lineHeight: 1.75,
              animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both'
            }}>
              กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้<br />
              เพื่อตรวจสอบข้อมูลและสถานะการรับเสื้อ
            </p>
          </div>

          {/* ── Announcement Banner ── */}
          {announcement && (
            <div className="glass-card" style={{
              marginBottom: 'var(--space-6)', padding: 'var(--space-5)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-accent) 5%, transparent))',
              border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
              boxShadow: '0 8px 32px color-mix(in srgb, var(--color-primary) 10%, transparent)',
              display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start',
              animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0, boxShadow: 'var(--shadow-glow-primary)'
              }}>
                <Megaphone size={20} weight="duotone" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-1)', marginTop: 0 }}>
                  ประกาศด่วน
                </h2>
                <div style={{ color: 'var(--color-foreground)', fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {announcement}
                </div>
              </div>
            </div>
          )}

          {/* ── Search Card ── */}
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-8)',
              marginBottom: 'var(--space-6)',
              boxShadow: '0 24px 64px oklch(0 0 0 / 0.50), 0 0 0 1px oklch(1 0 0 / 0.08)',
            }}
          >
            <form onSubmit={handleSearch}>
              <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
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
                    style={{
                      paddingLeft: 'var(--space-10)',
                      height: 52,
                      fontSize: 'var(--text-lg)',
                      letterSpacing: '0.05em',
                    }}
                  />
                  <MagnifyingGlass
                    size={18}
                    weight="duotone"
                    style={{
                      position: 'absolute',
                      left: 'var(--space-4)',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-light)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                {error && <p className="input-error-msg" role="alert">{error}</p>}
              </div>

              <button
                type="submit"
                id="search-submit-btn"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading || !phone.trim()}
                style={{ fontSize: 'var(--text-base)', letterSpacing: '0.02em' }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังค้นหา...</>
                ) : (
                  <><MagnifyingGlass size={18} weight="duotone" /> ค้นหาข้อมูลเสื้อ</>
                )}
              </button>
            </form>
          </div>

          {/* ── Results ── */}
          {searched && !loading && (
            <div style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              {result ? (
                <OrderCard order={result.order} distribution={result.distribution} />
              ) : error && (
                <div
                  className="glass-card"
                  style={{
                    padding: 'var(--space-10)',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px oklch(0 0 0 / 0.30)',
                  }}
                >
                  <div style={{
                    width: 64, height: 64,
                    background: 'oklch(0.63 0.24 27 / 0.18)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    border: '1px solid oklch(0.63 0.24 27 / 0.30)',
                  }}>
                    <Package size={30} weight="duotone" style={{ color: 'oklch(0.73 0.22 27)' }} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-foreground)', marginBottom: 'var(--space-2)' }}>
                    ไม่พบข้อมูลการสั่งซื้อ
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: '100%' }}>
                    กรุณาตรวจสอบเบอร์โทรศัพท์อีกครั้ง<br />หรือติดต่อผู้ดูแลระบบ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Feature Hints ── */}
          {!searched && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              {[
                {
                  icon: CheckCircle,
                  color: 'oklch(0.64 0.18 162)',
                  glow: 'oklch(0.64 0.18 162 / 0.15)',
                  title: 'ตรวจสอบสถานะ',
                  desc: 'เช็คว่ารับเสื้อแล้วหรือยัง',
                },
                {
                  icon: QrCode,
                  color: 'var(--color-primary)',
                  glow: 'var(--color-primary-light)',
                  title: 'QR Code การรับเสื้อ',
                  desc: 'รับโค้ดสำหรับยืนยันการรับเสื้อ',
                },
                {
                  icon: Clock,
                  color: 'oklch(0.72 0.18 72)',
                  glow: 'oklch(0.72 0.18 72 / 0.15)',
                  title: 'ข้อมูลการสั่งซื้อ',
                  desc: 'ดูรายละเอียดไซส์และจำนวน',
                },
              ].map(({ icon: Icon, color, glow, title, desc }) => (
                <div
                  key={title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'oklch(1 0 0 / 0.03)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--glass-border)',
                    transition: 'border-color var(--transition-base)',
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--radius-md)',
                    background: glow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--color-border)',
                  }}>
                    <Icon size={20} weight="duotone" style={{ color }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-foreground)', marginBottom: 2 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        borderTop: '1px solid var(--glass-border)',
        background: 'linear-gradient(to top, oklch(1 0 0 / 0.02), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sparkle size={12} weight="duotone" style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 500, letterSpacing: '0.02em', color: 'var(--color-text-muted)' }}>
            สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี
          </span>
          <Sparkle size={12} weight="duotone" style={{ color: 'var(--color-accent)' }} />
        </div>
        <span style={{ color: 'var(--color-text-light)', opacity: 0.6 }}>
          มหาวิทยาลัยราชภัฏภูเก็ต © 2569
        </span>
      </footer>
    </div>
  );
}
