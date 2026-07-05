// app/not-found.tsx — Global 404 page
import { PackageX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      background: 'var(--color-background)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80,
        background: 'var(--color-primary-light)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <PackageX size={40} color="var(--color-primary)" />
      </div>

      <h1 style={{ marginBottom: 'var(--space-3)' }}>ไม่พบหน้าที่ต้องการ</h1>
      <p style={{
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-8)',
        maxWidth: 360,
        margin: '0 auto var(--space-8)',
      }}>
        ลิงก์นี้อาจหมดอายุหรือไม่ถูกต้อง<br />
        กรุณาตรวจสอบ QR Code อีกครั้ง
      </p>

      <a href="/" className="btn btn-primary">
        <ArrowLeft size={16} />
        กลับหน้าค้นหา
      </a>
    </div>
  );
}
