'use client';
// app/page.tsx — Premium Centered Layout

import { useState, useEffect } from 'react';
import {
  MagnifyingGlass, Package, CheckCircle, Clock, QrCode,
  Sparkle, ArrowRight, Megaphone,
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/smo-logo.png" alt="SMO Logo" style={{ height: 48, width: 'auto', objectFit: 'contain', mixBlendMode: 'screen' }} />
        </div>
        <a href="/login" className="btn btn-outline btn-sm">
          เข้าสู่ระบบ <ArrowRight size={14} weight="bold" />
        </a>
      </nav>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: 'var(--space-12) var(--space-4) var(--space-8)' }}>
        <div className="container" style={{ 
          maxWidth: 640,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}>
          
          {/* Hero Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)', animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <span className="chip" style={{ animation: 'fadeIn 1s ease-out 0.2s both', padding: 'var(--space-1) var(--space-4)', borderRadius: 'var(--radius-full)' }}>
                <Sparkle size={12} weight="fill" />
                มหาวิทยาลัยราชภัฏภูเก็ต
              </span>
            </div>
            <h1 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-foreground)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', lineHeight: 1.2, letterSpacing: '-0.04em' }}>
              เช็คลำดับรับเสื้อ<span className="gradient-text">เฟรชชี่</span><br />
              <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 600 }}>คณะวิทยาศาสตร์และเทคโนโลยี</span><br />
              <span style={{ fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', color: 'var(--color-text-muted)' }}>ปีการศึกษา 2569</span>
            </h1>
            <p style={{
              color: 'var(--color-text-muted)',
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.6,
              fontSize: 'var(--text-base)'
            }}>
              กรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้ เพื่อตรวจสอบข้อมูลไซส์เสื้อและสถานะการรับของของคุณ
            </p>
          </div>

          {/* Announcement Banner */}
          {announcement && (
            <div style={{
              maxWidth: 560, margin: '0 auto', width: '100%',
              padding: 'var(--space-4)',
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
              animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', padding: '4px', background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', flexShrink: 0, marginTop: '2px' }}>
                <Megaphone size={18} weight="duotone" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)', margin: '0 0 4px 0' }}>
                  ประกาศด่วน
                </h2>
                <div style={{ color: 'var(--color-foreground)', fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {announcement}
                </div>
              </div>
            </div>
          )}

          {/* Premium Search Bar */}
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: 560, margin: '0 auto', animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MagnifyingGlass
                  size={22}
                  weight="duotone"
                  style={{
                    position: 'absolute',
                    left: 'var(--space-6)',
                    color: 'var(--color-text-light)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <input
                  id="phone-input"
                  type="tel"
                  maxLength={10}
                  className={`input${error ? ' input-error' : ''}`}
                  placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก..."
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  autoComplete="tel"
                  style={{
                    width: '100%',
                    height: 64,
                    padding: '0 120px 0 calc(var(--space-6) + 32px)',
                    fontSize: 'var(--text-lg)',
                    letterSpacing: '0.05em',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 32px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 12px 40px oklch(var(--color-primary-raw) / 0.15), 0 0 0 2px var(--color-primary)';
                    e.target.style.borderColor = 'transparent';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = '0 12px 32px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.05)';
                    e.target.style.borderColor = 'var(--color-border)';
                  }}
                />
                <button
                  type="submit"
                  id="search-submit-btn"
                  className="btn btn-primary"
                  disabled={loading || !phone.trim()}
                  style={{
                    position: 'absolute',
                    right: 'var(--space-2)',
                    height: 48,
                    borderRadius: 'var(--radius-full)',
                    padding: '0 var(--space-6)',
                    fontSize: 'var(--text-sm)',
                    letterSpacing: '0.02em',
                    fontWeight: 600,
                  }}
                >
                  {loading ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    'ค้นหา'
                  )}
                </button>
              </div>
              {error && (
                <p className="input-error-msg" role="alert" style={{ textAlign: 'center', marginTop: 'var(--space-3)', animation: 'fadeIn 0.3s ease' }}>
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Results */}
          {searched && !loading && (
            <div style={{ animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
              {result ? (
                <OrderCard order={result.order} distribution={result.distribution} />
              ) : error && (
                <div
                  className="glass-card"
                  style={{
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-2xl)',
                    boxShadow: '0 8px 24px oklch(0 0 0 / 0.1)',
                  }}
                >
                  <div style={{
                    width: 56, height: 56,
                    background: 'oklch(0.63 0.24 27 / 0.18)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    border: '1px solid oklch(0.63 0.24 27 / 0.30)',
                  }}>
                    <Package size={26} weight="duotone" style={{ color: 'oklch(0.73 0.22 27)' }} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-foreground)', marginBottom: 'var(--space-2)' }}>
                    ไม่พบข้อมูลการสั่งซื้อ
                  </p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: '100%' }}>
                    กรุณาตรวจสอบเบอร์โทรศัพท์อีกครั้ง<br />หรือติดต่อสโมสรนักศึกษา
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Feature Hints (Bento style grid on desktop) */}
          {!searched && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              animation: 'slideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both'
            }}>
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
                  title: 'QR Code สำหรับยืนยันตัวตน',
                  desc: 'รับโค้ดสำหรับยืนยันการรับเสื้อ',
                },
              ].map(({ icon: Icon, color, glow, title, desc }) => (
                <div
                  key={title}
                  style={{
                    flex: '1 1 280px',
                    maxWidth: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface-2)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: '0 4px 12px oklch(0 0 0 / 0.05)',
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
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-foreground)' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
        padding: 'var(--space-6) var(--space-4)',
        textAlign: 'center',
        borderTop: '1px solid var(--glass-border)',
        background: 'linear-gradient(to top, oklch(1 0 0 / 0.02), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontSize: '11px',
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
