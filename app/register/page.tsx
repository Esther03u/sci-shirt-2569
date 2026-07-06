'use client';
// app/register/page.tsx — Phosphor Icons Duotone

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Eye, EyeSlash, TShirt, ArrowLeft,
  Key, CheckCircle,
} from '@phosphor-icons/react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', registrationCode: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  /* ── Success State ── */
  if (success) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--space-4)', position: 'relative',
      }}>
        <div className="bg-ambient" aria-hidden="true" />
        <div className="glass-card" style={{
          maxWidth: 400, width: '100%', textAlign: 'center', padding: 'var(--space-10)',
          boxShadow: '0 24px 64px oklch(0 0 0 / 0.50)',
          animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{
            width: 68, height: 68,
            background: 'oklch(0.64 0.18 162 / 0.18)',
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-5)',
            border: '1px solid oklch(0.64 0.18 162 / 0.35)',
            boxShadow: '0 0 30px oklch(0.64 0.18 162 / 0.20)',
          }}>
            <CheckCircle size={34} weight="duotone" style={{ color: 'oklch(0.74 0.18 162)' }} />
          </div>
          <h2 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-foreground)' }}>
            สมัครสำเร็จ!
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: '100%' }}>
            กำลังพาคุณไปหน้าเข้าสู่ระบบ...
          </p>
        </div>
      </div>
    );
  }

  /* ── Form ── */
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

      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>

        {/* Back link */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <a href="/login" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }}>
            <ArrowLeft size={15} weight="bold" /> กลับหน้าเข้าสู่ระบบ
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
            <UserPlus size={34} color="#fff" weight="duotone" />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)', color: 'var(--color-foreground)' }}>
            สมัครบัญชีผู้แจก
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            ต้องมีรหัสลับจากแอดมินก่อนสมัคร
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
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="name" className="input-label">ชื่อ-นามสกุล <span className="required">*</span></label>
              <input id="name" type="text" className="input" placeholder="สมชาย ใจดี"
                value={form.name} onChange={set('name')} required autoComplete="name" />
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">อีเมล <span className="required">*</span></label>
              <input id="email" type="email" className="input" placeholder="your@email.com"
                value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>

            <div className="input-group">
              <label htmlFor="reg-code" className="input-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Key size={13} weight="duotone" style={{ color: 'var(--color-accent)' }} />
                  รหัสลับ <span className="required">*</span>
                </span>
              </label>
              <input id="reg-code" type="text" className="input" placeholder="รหัสที่ได้รับจากแอดมิน"
                value={form.registrationCode} onChange={set('registrationCode')} required />
              <p className="input-hint">ขอรหัสจากผู้ดูแลระบบก่อนสมัคร</p>
            </div>

            <div className="input-group">
              <label htmlFor="reg-password" className="input-label">รหัสผ่าน <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="input" placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={form.password} onChange={set('password')}
                  required autoComplete="new-password"
                  style={{ paddingRight: 'var(--space-10)' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 'var(--space-3)', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
                    display: 'flex', minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label={showPass ? 'ซ่อน' : 'แสดง'}
                >
                  {showPass ? <EyeSlash size={17} weight="duotone" /> : <Eye size={17} weight="duotone" />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password" className="input-label">ยืนยันรหัสผ่าน <span className="required">*</span></label>
              <input
                id="confirm-password"
                type={showPass ? 'text' : 'password'}
                className="input" placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                required autoComplete="new-password"
              />
            </div>

            <button
              type="submit" id="register-submit-btn"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังสมัคร...</>
                : <><UserPlus size={18} weight="duotone" /> สมัครบัญชี</>}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            มีบัญชีแล้ว?{' '}
            <a href="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>เข้าสู่ระบบ</a>
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
