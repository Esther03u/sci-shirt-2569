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
        <a href="/login" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <ArrowLeft size={15} weight="bold" style={{ marginRight: 'var(--space-1)' }} /> กลับหน้าเข้าสู่ระบบ
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
              <UserPlus size={28} weight="duotone" style={{ color: 'var(--color-foreground)' }} />
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'var(--color-foreground)', letterSpacing: '-0.02em' }}>
              สมัครบัญชีผู้แจก
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
              ต้องใช้รหัสลับจากแอดมินเพื่อยืนยันตัวตน
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
              <div className="alert alert-error" role="alert" aria-live="polite" style={{ padding: 'var(--space-3)' }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="name" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ชื่อ-นามสกุล</label>
              <input id="name" type="text" className="input" placeholder="สมชาย ใจดี"
                value={form.name} onChange={set('name')} required autoComplete="name" 
                style={{ background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }} />
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>อีเมล</label>
              <input id="email" type="email" className="input" placeholder="name@example.com"
                value={form.email} onChange={set('email')} required autoComplete="email" 
                style={{ background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }} />
            </div>

            <div className="input-group">
              <label htmlFor="reg-code" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Key size={14} weight="bold" style={{ color: 'var(--color-accent)' }} />
                  รหัสลับ
                </span>
              </label>
              <input id="reg-code" type="text" className="input" placeholder="รหัสที่ได้รับจากแอดมิน"
                value={form.registrationCode} onChange={set('registrationCode')} required 
                style={{ background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }} />
            </div>

            <div className="input-group">
              <label htmlFor="reg-password" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="input" placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={form.password} onChange={set('password')}
                  required autoComplete="new-password"
                  style={{ paddingRight: 'var(--space-10)', background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 'var(--space-2)', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
                    display: 'flex', minHeight: 36, minWidth: 36, alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  aria-label={showPass ? 'ซ่อน' : 'แสดง'}
                >
                  {showPass ? <EyeSlash size={16} weight="bold" /> : <Eye size={16} weight="bold" />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password" className="input-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ยืนยันรหัสผ่าน</label>
              <input
                id="confirm-password"
                type={showPass ? 'text' : 'password'}
                className="input" placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                required autoComplete="new-password"
                style={{ background: 'oklch(1 0 0 / 0.03)', borderColor: 'oklch(1 0 0 / 0.08)' }}
              />
            </div>

            <button
              type="submit" id="register-submit-btn"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-4)', height: 44, borderRadius: 'var(--radius-md)' }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> กำลังสมัคร...</>
                : 'สมัครบัญชี'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              มีบัญชีอยู่แล้ว?{' '}
              <a href="/login" style={{ color: 'var(--color-foreground)', fontWeight: 500 }}>
                เข้าสู่ระบบ
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
