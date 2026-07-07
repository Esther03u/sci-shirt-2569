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
      flexDirection: 'column',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="bg-ambient" aria-hidden="true" />
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/smo-logo.png" alt="SMO Logo" style={{ height: 40, width: 'auto', objectFit: 'contain', mixBlendMode: 'screen' }} />
        </div>
        <a href="/" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <ArrowLeft size={15} weight="bold" style={{ marginRight: 'var(--space-1)' }} /> กลับหน้าหลัก
        </a>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'var(--space-4)',
        paddingBottom: 'var(--space-12)',
        zIndex: 1,
      }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 'var(--space-8)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56, height: 56,
              background: 'oklch(1 0 0 / 0.03)',
              borderRadius: 'var(--radius-full)',
              marginBottom: 'var(--space-4)',
              border: '1px solid oklch(1 0 0 / 0.08)',
              boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
            }}>
              <ShieldCheck size={28} weight="duotone" style={{ color: 'var(--color-foreground)' }} />
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'var(--color-foreground)', letterSpacing: '-0.02em' }}>
              เข้าสู่ระบบ
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
              สำหรับผู้แจกเสื้อและแอดมิน
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
              <div className="alert alert-error" role="alert" aria-live="polite" style={{ padding: 'var(--space-3)' }}>
                <SignIn size={16} weight="duotone" style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="email" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>อีเมล</label>
              <input
                id="email" type="email" className="input" placeholder="name@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email" required
                style={{ background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }}
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>รหัสผ่าน</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" required
                  style={{ paddingRight: 'var(--space-10)', background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 'var(--space-2)', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
                    display: 'flex', minHeight: 36, minWidth: 36, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  aria-label={showPass ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPass
                    ? <EyeSlash size={16} weight="bold" />
                    : <Eye size={16} weight="bold" />}
                </button>
              </div>
            </div>

            <button
              type="submit" id="login-submit-btn"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-4)', height: 44, borderRadius: 'var(--radius-md)' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> เข้าสู่ระบบ...</>
                : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              ยังไม่มีบัญชีผู้แจก?{' '}
              <a href="/register" style={{ color: 'var(--color-foreground)', fontWeight: 500 }}>
                สมัครใช้งาน
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
