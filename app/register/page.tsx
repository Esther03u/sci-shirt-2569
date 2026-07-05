'use client';
// app/register/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Eye, EyeOff, Package, KeyRound } from 'lucide-react';

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
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--space-4)',
      }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 'var(--space-10)' }}>
          <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            สร้างบัญชีสำเร็จ! กำลังพาไปหน้า Login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--space-4)',
      background: 'var(--color-background)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)',
          }}>
            <Package size={28} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>สมัครบัญชีผู้แจก</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
            ต้องมีรหัสลับจากแอดมินก่อนสมัคร
          </p>
        </div>

        <div className="card">
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
                  <KeyRound size={14} /> รหัสลับ <span className="required">*</span>
                </span>
              </label>
              <input id="reg-code" type="text" className="input" placeholder="รหัสที่ได้รับจากแอดมิน"
                value={form.registrationCode} onChange={set('registrationCode')} required />
              <p className="input-hint">ขอรหัสจากผู้ดูแลระบบก่อนสมัคร</p>
            </div>

            <div className="input-group">
              <label htmlFor="reg-password" className="input-label">รหัสผ่าน <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input id="reg-password"
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
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirm-password" className="input-label">ยืนยันรหัสผ่าน <span className="required">*</span></label>
              <input id="confirm-password"
                type={showPass ? 'text' : 'password'}
                className="input" placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                required autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18 }} /> กำลังสมัคร...</>
                : <><UserPlus size={18} /> สมัครบัญชี</>
              }
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            มีบัญชีแล้ว? <a href="/login" style={{ fontWeight: 600 }}>เข้าสู่ระบบ</a>
          </p>
        </div>
      </div>
    </div>
  );
}
