'use client';
// app/login/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Eye, EyeOff, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    // Redirect based on role
    const profileRes = await fetch('/api/profile');
    const profile = profileRes.ok ? await profileRes.json() : null;
    if (profile?.role === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/distribute');
    }
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      background: 'var(--color-background)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)',
          }}>
            <Package size={28} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>เข้าสู่ระบบ</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            สำหรับผู้แจกเสื้อและแอดมินเท่านั้น
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
              <div className="alert alert-error" role="alert" aria-live="polite">
                <LogIn size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email" className="input-label">อีเมล <span className="required">*</span></label>
              <input
                id="email" type="email" className="input"
                placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">รหัสผ่าน <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" required
                  style={{ paddingRight: 'var(--space-10)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 'var(--space-3)', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
                    display: 'flex', minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label={showPass ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังเข้าสู่ระบบ...</> : <><LogIn size={18} /> เข้าสู่ระบบ</>}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            ยังไม่มีบัญชี?{' '}
            <a href="/register" style={{ fontWeight: 600 }}>สมัครใช้งาน</a>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          <a href="/" style={{ color: 'var(--color-text-muted)' }}>← กลับหน้าค้นหา</a>
        </p>
      </div>
    </div>
  );
}
