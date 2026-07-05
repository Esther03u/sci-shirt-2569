'use client';
// app/distribute/page.tsx — Distributor page with search + distribute

import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, LogOut, Shirt, User, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface OrderResult {
  order: Record<string, string | number | undefined>;
  distribution: Record<string, unknown> | null;
}

export default function DistributePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser({ id: user.id, email: user.email ?? '' });
      fetch('/api/profile').then(r => r.json()).then(setProfile);
    });
  }, []);

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

  async function handleDistribute() {
    if (!result) return;
    setDistributing(true); setError(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetRowId: result.order.rowIndex,
          phone: result.order.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setSuccessMsg(`แจกเสื้อให้ ${result.order.name} สำเร็จ!`);
        setResult(null); setPhone('');
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
    <div className="page-wrapper">
      <nav className="navbar">
        <span className="navbar-brand">แจกเสื้อ</span>
        <div className="navbar-actions">
          {profile && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {profile.name}
            </span>
          )}
          {profile?.role === 'admin' && (
            <a href="/dashboard" className="btn btn-outline btn-sm">Dashboard</a>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" aria-label="ออกจากระบบ">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 'var(--space-6) var(--space-4)' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h1 style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Shirt size={28} /> ระบบแจกเสื้อ
          </h1>

          {/* Search Form */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <h2 className="card-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
              ค้นหาด้วยเบอร์โทร
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="tel" className="input" placeholder="เบอร์โทรศัพท์"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  inputMode="tel"
                  style={{ paddingLeft: 'var(--space-10)' }}
                  aria-label="เบอร์โทรศัพท์"
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

          {/* Messages */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }} role="alert" aria-live="polite">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }} role="alert" aria-live="polite">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {successMsg}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="card" style={{ borderTop: `4px solid ${isDistributed ? 'var(--color-success)' : 'var(--color-accent)'}` }}>
              <div className="card-header">
                <div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-1)' }}>
                    {result.order.name as string}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Phone size={13} /> {result.order.phone as string}
                  </div>
                </div>
                <span className={`badge ${isDistributed ? 'badge-success' : 'badge-pending'}`}>
                  {isDistributed ? <><CheckCircle2 size={12} /> รับแล้ว</> : <><Clock size={12} /> ยังไม่รับ</>}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                {[
                  { label: 'ลำดับ', value: `#${result.order.rowIndex}` },
                  { label: 'ไซส์', value: result.order.size as string || '-' },
                  { label: 'จำนวน', value: `${result.order.quantity} ตัว` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--color-muted)',
                    borderRadius: 'var(--radius-md)',
                    minWidth: 90,
                  }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-foreground)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {isDistributed ? (
                <div className="alert alert-success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>
                    รับเสื้อแล้วโดย{' '}
                    <strong>
                      {(result.distribution?.distributors as Record<string, string> | null)?.name ?? 'ผู้แจก'}
                    </strong>
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleDistribute}
                  className="btn btn-accent btn-full btn-lg"
                  disabled={distributing}
                >
                  {distributing
                    ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังบันทึก...</>
                    : <><CheckCircle2 size={20} /> ยืนยันการแจกเสื้อ</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
