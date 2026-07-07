'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChartBar, TShirt, SignOut } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const NAV_ITEMS = [
    { label: 'ภาพรวม (Admin)', href: '/dashboard', icon: ChartBar },
    { label: 'ระบบแจกเสื้อ', href: '/distribute', icon: TShirt },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="app-shell">
      <style>{`
        @media (max-width: 768px) {
          .app-shell { flex-direction: column !important; }
          .app-sidebar { display: none !important; }
          .hide-on-mobile { display: none !important; }
          .app-content-scrollable { padding: var(--space-4) !important; }
        }
        @media (min-width: 769px) {
          .app-bottom-nav { display: none !important; }
          .app-mobile-header { display: none !important; }
          .hide-on-desktop { display: none !important; }
        }
      `}</style>
      <div className="bg-ambient" aria-hidden="true" />
      
      {/* Desktop Sidebar */}
      <aside className="app-sidebar hide-on-mobile">
        <div className="app-sidebar-header">
          <div className="app-brand-icon" style={{ background: 'transparent' }}>
            <img src="/smo-logo.png" alt="SMO Logo" width={28} height={28} style={{ objectFit: 'contain', mixBlendMode: 'screen' }} />
          </div>
          <h1 className="app-brand-text">ระบบจัดการเสื้อ</h1>
        </div>
        
        <nav className="app-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`app-nav-item ${active ? 'active' : ''}`}
              >
                <Icon size={20} weight={active ? 'duotone' : 'regular'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-footer">
          <button onClick={handleLogout} className="app-nav-item danger">
            <SignOut size={20} weight="regular" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Mobile Header */}
        <header className="app-mobile-header hide-on-desktop">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div className="app-brand-icon-sm" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/smo-logo.png" alt="SMO Logo" width={20} height={20} style={{ objectFit: 'contain', mixBlendMode: 'screen' }} />
            </div>
            <h1 className="app-brand-text-sm">
              {NAV_ITEMS.find(n => n.href === pathname)?.label || 'ระบบจัดการเสื้อ'}
            </h1>
          </div>
          <button onClick={handleLogout} className="app-mobile-logout" aria-label="ออกจากระบบ">
            <SignOut size={20} weight="regular" />
          </button>
        </header>
        
        <div className="app-content-scrollable">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="app-bottom-nav hide-on-desktop">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`app-bottom-nav-item ${active ? 'active' : ''}`}
            >
              <div className="app-bottom-nav-icon-wrapper">
                <Icon size={24} weight={active ? 'duotone' : 'regular'} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
