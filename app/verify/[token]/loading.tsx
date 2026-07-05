// app/verify/[token]/loading.tsx — Loading skeleton for verify page
export default function VerifyLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-background)', padding: 'var(--space-4)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Back skeleton */}
        <div className="skeleton" style={{ width: 120, height: 20, marginBottom: 'var(--space-6)' }} />

        {/* Banner skeleton */}
        <div className="skeleton" style={{
          height: 100, borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)',
        }} />

        {/* Card skeleton */}
        <div className="card">
          <div className="skeleton" style={{ width: '60%', height: 32, marginBottom: 'var(--space-5)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
