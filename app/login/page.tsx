'use client';
// app/login/page.tsx — Phosphor Icons Duotone

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SignIn, Eye, EyeSlash, TShirt, ArrowLeft, ShieldCheck,
} from '@phosphor-icons/react';
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
      position: 'relative',
    }}>
      <div className="bg-ambient" aria-hidden="true" />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>

        {/* Back link */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <a href="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={15} weight="bold" /> กลับหน้าหลัก
          </a>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 68, height: 68,
            background: 'radial-gradient(circle at 30% 30%, var(--color-secondary), var(--color-primary))',
            borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--space-5)',
            boxShadow: '0 0 40px var(--color-primary-glow), 0 0 80px var(--color-primary-light), inset 0 1px 0 oklch(1 0 0 / 0.20)',
          }}>
            <ShieldCheck size={34} color="#fff" weight="duotone" />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', color: 'var(--color-foreground)' }}>
            เข้าสู่ระบบ
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            สำหรับผู้แจกเสื้อและแอดมินเท่านั้น
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card" style={{
          padding: 'var(--space-6)',
          boxShadow: '0 24px 64px oklch(0 0 0 / 0.50), 0 0 0 1px oklch(1 0 0 / 0.08)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
              <div className="alert alert-error" role="alert" aria-live="polite">
                <SignIn size={16} weight="duotone" style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email" className="input-label">อีเมล <span className="required">*</span></label>
              <input
                id="email" type="email" className="input" placeholder="your@email.com"
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
                  className="input" placeholder="••••••••"
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
                  {showPass
                    ? <EyeSlash size={17} weight="duotone" />
                    : <Eye size={17} weight="duotone" />}
                </button>
              </div>
            </div>

            <button
              type="submit" id="login-submit-btn"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังเข้าสู่ระบบ...</>
                : <><SignIn size={18} weight="duotone" /> เข้าสู่ระบบ</>}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            ยังไม่มีบัญชี?{' '}
            <a href="/register" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              สมัครใช้งาน
            </a>
          </p>
        </div>

        {/* Footer brand */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-2)', marginTop: 'var(--space-6)',
          color: 'var(--color-text-light)', fontSize: 'var(--text-xs)',
        }}>
          <TShirt size={13} weight="duotone" />
          SCI Shirt 2569 — มรภ.ภูเก็ต
        </div>
      </div>
    </div>
  );
}
