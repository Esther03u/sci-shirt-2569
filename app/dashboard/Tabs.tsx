import React, { useState, useMemo } from 'react';
import {
  ChartBar, Users, Package, CheckCircle, Clock,
  MagnifyingGlass, XCircle, Gear, TrendUp, CaretDown, CaretUp, Megaphone,
  Trophy, Medal, ShieldCheck, Shield, Star, ArrowsClockwise
} from '@phosphor-icons/react';
import { Order, Stats, DistStat, Filter, Distributor } from './types';

const SIZES = ['XS','S','M','L','XL','XXL','3XL'];
const SIZE_COLORS: Record<string, string> = {
  XS: 'var(--color-size-xs)', S: 'var(--color-size-s)', M: 'var(--color-size-m)',
  L: 'var(--color-size-l)', XL: 'var(--color-size-xl)', XXL: 'var(--color-size-xxl)', '3XL': 'var(--color-size-3xl)',
};

export function OverviewTab({
  stats, sizeBreakdown, maxSizeCount, pct, branchBreakdown, maxBranchCount, orders, distributorCount
}: {
  stats: Stats;
  sizeBreakdown: [string, { total: number; distributed: number }][];
  maxSizeCount: number;
  pct: number;
  branchBreakdown: [string, { total: number; distributed: number; remaining: number }][];
  maxBranchCount: number;
  orders: Order[];
  distributorCount: number;
}) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'distributed' | 'pending'>('distributed');

  const topBranch = branchBreakdown.length > 0 ? [...branchBreakdown].sort((a, b) => b[1].distributed - a[1].distributed)[0] : null;
  const mostRemainingBranch = branchBreakdown.length > 0 ? [...branchBreakdown].sort((a, b) => b[1].remaining - a[1].remaining)[0] : null;
  const mostRemainingSize = sizeBreakdown.length > 0 ? [...sizeBreakdown].sort((a, b) => (b[1].total - b[1].distributed) - (a[1].total - a[1].distributed))[0] : null;

  return (
    <>
      <h2 className="sr-only">ภาพรวม</h2>

      {/* Executive Insights */}
      {(topBranch || mostRemainingBranch) && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', padding: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
              <Megaphone size={16} weight="duotone" />
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-foreground)' }}>Executive Insights (สรุปภาพรวม)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {topBranch && topBranch[1].distributed > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🏆</span> มารับมากที่สุด
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 'var(--text-sm)' }}>{topBranch[0]}</div>
                  <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)' }}>{topBranch[1].distributed} คน</div>
                </div>
              </div>
            )}
            {mostRemainingBranch && mostRemainingBranch[1].remaining > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚠️</span> ค้างรับมากที่สุด
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 'var(--text-sm)' }}>{mostRemainingBranch[0]}</div>
                  <div style={{ color: 'var(--color-warning)', fontSize: 'var(--text-xs)' }}>{mostRemainingBranch[1].remaining} คน</div>
                </div>
              </div>
            )}
            {mostRemainingSize && (mostRemainingSize[1].total - mostRemainingSize[1].distributed) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', paddingTop: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📦</span> ไซส์ค้างเยอะสุด
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-foreground)', fontSize: 'var(--text-sm)' }}>ไซส์ {mostRemainingSize[0]}</div>
                  <div style={{ color: 'var(--color-warning)', fontSize: 'var(--text-xs)' }}>{mostRemainingSize[1].total - mostRemainingSize[1].distributed} ตัว</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: 'var(--space-3)', 
        marginBottom: 'var(--space-6)' 
      }}>
        {[
          { label: 'สั่งทั้งหมด',  value: stats.total,       icon: Package,     color: 'var(--color-primary)' },
          { label: 'แจกแล้ว',      value: stats.distributed,  icon: CheckCircle, color: 'var(--color-success)' },
          { label: 'ยังไม่แจก',    value: stats.remaining,    icon: Clock,       color: 'var(--color-warning)' },
          { label: 'ผู้แจก',       value: distributorCount,   icon: Users,       color: 'var(--color-accent)', hidePercent: true },
        ].map(({ label, value, icon: Icon, color, hidePercent }) => (
          <div key={label} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-card-label">{label}</span>
              <div style={{
                padding: 'var(--space-2)',
                background: `color-mix(in srgb, ${color} 20%, transparent)`,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
              }}>
                <Icon size={16} weight="duotone" style={{ color, display: 'block' }} />
              </div>
            </div>
            <span className="stat-card-value" style={{ color }}>{value}</span>
            {stats.total > 0 && !hidePercent && (
              <span className="stat-card-sub">{Math.round((value / stats.total) * 100)}% ของทั้งหมด</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', padding: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                <TrendUp size={16} weight="duotone" />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-foreground)' }}>ความคืบหน้าการแจก</h3>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-success-text)', fontSize: 'var(--text-xl)' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-2)' }}>
            <div style={{
              height: '100%', width: '100%',
              transform: `translateX(${pct - 100}%)`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
              borderRadius: 'var(--radius-full)',
              transition: 'transform var(--transition-slow)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <span>แจกแล้ว {stats.distributed} ตัว</span>
            <span>เหลือ {stats.remaining} ตัว</span>
          </div>
        </div>
      )}

      {/* Size Breakdown */}
      {sizeBreakdown.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <div style={{ display: 'flex', padding: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
              <ChartBar size={16} weight="duotone" />
            </div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-foreground)' }}>แยกตามไซส์</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
            {sizeBreakdown.map(([size, { total, distributed }]) => {
              const color = SIZE_COLORS[size] ?? 'var(--color-primary)';
              const distPct = total > 0 ? (distributed / total) * 100 : 0;
              return (
                <div key={size} style={{ padding: 'var(--space-3)', background: 'oklch(1 0 0 / 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, height: 28,
                      fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'var(--text-sm)', color,
                      background: `color-mix(in srgb, ${color} 12%, transparent)`, borderRadius: 'var(--radius-sm)',
                    }}>{size}</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color }}>{Math.round(distPct)}%</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                    รับแล้ว <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{distributed}</span> / {total}
                  </div>
                  <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${distPct}%`,
                      background: color, borderRadius: 'var(--radius-full)',
                      transition: 'width var(--transition-slow)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Branch Breakdown */}
      {branchBreakdown.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-6)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', padding: '4px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                <Users size={16} weight="duotone" />
              </div>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-foreground)' }}>แยกตามสาขาวิชา (Branch Performance)</h3>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
              <thead style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>
                <tr>
                  <th style={{ padding: 'var(--space-3) var(--space-5)', fontWeight: 600, width: '35%' }}>สาขา</th>
                  <th style={{ padding: 'var(--space-3) var(--space-2)', fontWeight: 600, width: '40%' }}>ความคืบหน้า</th>
                  <th style={{ padding: 'var(--space-3) var(--space-5)', fontWeight: 600, textAlign: 'right', width: '25%' }}>รับแล้ว / ทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {branchBreakdown.map(([branch, { total, distributed, remaining }]) => {
                  const distPct = total > 0 ? (distributed / total) * 100 : 0;
                  return (
                    <tr 
                      key={branch} 
                      onClick={() => setSelectedBranch(branch)}
                      style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background var(--transition-fast)', cursor: 'pointer' }} 
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'} 
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-5)', fontWeight: 600, color: 'var(--color-foreground)' }}>
                        {branch}
                        {remaining > 0 && <div style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: 2 }}>เหลือ {remaining} คน</div>}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: '100%',
                              transform: `translateX(${distPct - 100}%)`,
                              background: 'var(--color-primary)', borderRadius: 'var(--radius-full)',
                              transition: 'transform var(--transition-slow)',
                            }} />
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: 32, textAlign: 'right' }}>{Math.round(distPct)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-5)', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{distributed}</span> / {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {selectedBranch && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBranch(null)} />
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
            
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-foreground)' }}>สาขา: {selectedBranch}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>คลิกที่ชื่อเพื่อดูรายละเอียด</p>
              </div>
              <button onClick={() => setSelectedBranch(null)} className="btn btn-ghost" style={{ padding: 'var(--space-2)' }}>
                <XCircle size={24} weight="duotone" />
              </button>
            </div>

            <div style={{ padding: '0 var(--space-5)', borderBottom: '1px solid var(--glass-border)', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <button 
                  onClick={() => setModalTab('distributed')}
                  style={{
                    padding: 'var(--space-3) 0', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: modalTab === 'distributed' ? 700 : 500,
                    color: modalTab === 'distributed' ? 'var(--color-success)' : 'var(--color-text-muted)',
                    borderBottom: modalTab === 'distributed' ? '2px solid var(--color-success)' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
                  }}
                >
                  <CheckCircle size={18} weight={modalTab === 'distributed' ? 'duotone' : 'regular'} />
                  รับแล้ว ({orders.filter(o => (o.branch || 'ไม่ระบุ').trim() === selectedBranch && o.distribution).length})
                </button>
                <button 
                  onClick={() => setModalTab('pending')}
                  style={{
                    padding: 'var(--space-3) 0', border: 'none', background: 'none', cursor: 'pointer',
                    fontWeight: modalTab === 'pending' ? 700 : 500,
                    color: modalTab === 'pending' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                    borderBottom: modalTab === 'pending' ? '2px solid var(--color-warning)' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
                  }}
                >
                  <Clock size={18} weight={modalTab === 'pending' ? 'duotone' : 'regular'} />
                  ยังไม่รับ ({orders.filter(o => (o.branch || 'ไม่ระบุ').trim() === selectedBranch && !o.distribution).length})
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '0', background: 'var(--color-background)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 600, width: '40px' }}>#</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 600 }}>ชื่อ-สกุล</th>
                    <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 600 }}>เบอร์ / ไซส์</th>
                    {modalTab === 'distributed' && <th style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>ข้อมูลรับเสื้อ</th>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredList = orders.filter(o => (o.branch || 'ไม่ระบุ').trim() === selectedBranch && (modalTab === 'distributed' ? !!o.distribution : !o.distribution));
                    if (filteredList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={modalTab === 'distributed' ? 4 : 3} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>ไม่มีข้อมูลในหมวดนี้</td>
                        </tr>
                      );
                    }
                    return filteredList.map((o, idx) => (
                      <tr key={o.rowIndex} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          {o.displayId || o.rowIndex}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-foreground)', fontSize: 'var(--text-sm)' }}>
                          {o.name}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                          <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-muted)' }}>{o.phone}</div>
                          <span className="badge badge-primary" style={{ marginTop: 4 }}>ไซส์ {o.size || '-'}</span>
                        </td>
                        {modalTab === 'distributed' && (
                          <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>โดย {o.distribution?.distributors?.name ?? '-'}</div>
                            <div>{o.distribution ? new Date(o.distribution.distributed_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</div>
                          </td>
                        )}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export function OrdersTab({
  stats, filtered, filter, search, cancelId, cancelling,
  setFilter, setSearch, setCancelId, handleCancel
}: {
  stats: Stats;
  filtered: Order[];
  filter: Filter;
  search: string;
  cancelId: string | null;
  cancelling: boolean;
  setFilter: (f: Filter) => void;
  setSearch: (s: string) => void;
  setCancelId: (id: string | null) => void;
  handleCancel: (id: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedOrders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <h2 className="sr-only">รายการคำสั่งซื้อ</h2>
      <div className="toolbar">
        <div className="segmented-control" role="tablist">
          {(['all', 'distributed', 'pending'] as Filter[]).map(f => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className="tab-btn"
            >
              {f === 'all' ? `ทั้งหมด (${stats.total})` :
               f === 'distributed' ? `รับแล้ว (${stats.distributed})` :
               `รอ (${stats.remaining})`}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <label htmlFor="search-orders" className="sr-only">ค้นหาชื่อหรือเบอร์โทร</label>
          <input
            id="search-orders"
            type="search" className="input" placeholder="ค้นชื่อ / เบอร์ (Cmd+K)"
            value={search} onChange={e => setSearch(e.target.value)}
            aria-label="ค้นหาชื่อหรือเบอร์โทร"
            style={{ paddingLeft: '2.5rem', height: 40 }}
          />
          <MagnifyingGlass size={16} weight="bold" style={{
            position: 'absolute', left: '1rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
          ไม่มีข้อมูล
        </div>
      ) : (
        <>
          <div className="app-list">
            {paginatedOrders.map(order => (
              <div key={order.rowIndex} className="app-list-item">
                <div className="app-list-item-content">
                  <span className="app-list-title">
                    {order.displayId || order.rowIndex}. {order.name}
                  </span>
                  <span className="app-list-subtitle">
                    {order.phone} • ไซส์ {order.size || '-'}
                  </span>
                  {order.distribution ? (
                    <span className="app-list-subtitle" style={{ color: 'var(--color-success)', marginTop: 2, fontSize: 11 }}>
                      <CheckCircle size={12} weight="fill" style={{ verticalAlign: 'text-top', marginRight: 4 }} />
                      รับแล้วโดย {order.distribution.distributors?.name ?? '-'}
                    </span>
                  ) : (
                    <span className="app-list-subtitle" style={{ color: 'var(--color-warning)', marginTop: 2, fontSize: 11 }}>
                      <Clock size={12} weight="fill" style={{ verticalAlign: 'text-top', marginRight: 4 }} />
                      รอแจก
                    </span>
                  )}
                </div>
                <div className="app-list-trailing">
                  {order.distribution && (
                    cancelId === order.distribution.id ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexDirection: 'column' }}>
                        <button onClick={() => handleCancel(order.distribution!.id)} className="btn btn-danger btn-sm" disabled={cancelling} style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-xs)' }}>
                          {cancelling ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'ยืนยัน'}
                        </button>
                        <button onClick={() => setCancelId(null)} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.75rem', fontSize: 'var(--text-xs)' }}>ยกเลิก</button>
                      </div>
                    ) : (
                      <button onClick={() => setCancelId(order.distribution!.id)} className="btn btn-ghost btn-sm" title="ยกเลิกการแจก" aria-label="ยกเลิกการแจก" style={{ padding: '0.4rem' }}>
                        <XCircle size={20} weight="duotone" style={{ color: 'var(--color-destructive)' }} />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 'var(--space-4)', padding: 'var(--space-3)',
              background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'
            }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ก่อนหน้า
              </button>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                หน้า {currentPage} จาก {totalPages}
              </div>
              <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                ถัดไป
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export function DistributorsTab({
  distStats, showAllDist, setShowAllDist, distributors, handleToggleRole
}: {
  distStats: DistStat[];
  showAllDist: boolean;
  setShowAllDist: React.Dispatch<React.SetStateAction<boolean>>;
  distributors: Distributor[];
  handleToggleRole: (id: string, role: 'admin' | 'distributor') => void;
}) {
  const [confirmRoleId, setConfirmRoleId] = useState<string | null>(null);

  const mergedList = useMemo(() => {
    return distributors.map(d => {
      const stat = distStats.find(s => s.id === d.id);
      return {
        ...d,
        count: stat?.count || 0,
        lastAt: stat?.lastAt || null,
      };
    }).sort((a, b) => b.count - a.count);
  }, [distStats, distributors]);

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <h2 className="sr-only">รายชื่อผู้แจก</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', padding: '8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' }}>
            <Trophy size={24} weight="duotone" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-foreground)', letterSpacing: '-0.5px' }}>Leaderboard ผู้แจกเสื้อ</h3>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>ทีมงานทั้งหมด ({mergedList.length} คน)</p>
          </div>
        </div>
      </div>
      
      {mergedList.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <Users size={48} weight="duotone" style={{ color: 'var(--color-text-light)', marginBottom: 'var(--space-2)' }} />
          <p className="empty-state-title">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {(showAllDist ? mergedList : mergedList.slice(0, 5))
              .map((d, i) => {
                const isTop1 = i === 0 && d.count > 0;
                const isTop2 = i === 1 && d.count > 0;
                const isTop3 = i === 2 && d.count > 0;
                let bg = 'var(--color-surface)';
                let border = '1px solid var(--glass-border)';
                let rankColor = 'var(--color-text-muted)';
                let glow = 'none';

                if (isTop1) {
                  bg = 'linear-gradient(135deg, color-mix(in srgb, var(--color-warning) 15%, transparent), transparent)';
                  border = '1px solid var(--color-warning)';
                  rankColor = 'var(--color-warning)';
                  glow = '0 4px 20px -4px color-mix(in srgb, var(--color-warning) 40%, transparent)';
                } else if (isTop2) {
                  bg = 'linear-gradient(135deg, color-mix(in srgb, var(--color-text-muted) 15%, transparent), transparent)';
                  border = '1px solid var(--color-border)';
                  rankColor = 'var(--color-text-muted)';
                } else if (isTop3) {
                  bg = 'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent)';
                  border = '1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)';
                  rankColor = 'var(--color-accent)';
                }

                return (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: bg,
                    borderRadius: 'var(--radius-lg)',
                    border: border,
                    boxShadow: glow,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {isTop1 && (
                      <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--color-warning) 20%, transparent), transparent)', opacity: 0.5 }} />
                    )}
                    
                    <div style={{
                      width: 40, height: 40,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: isTop1 ? 'var(--color-warning)' : isTop2 ? 'var(--color-text-muted)' : isTop3 ? 'var(--color-accent)' : 'var(--color-border)',
                      color: (isTop1 || isTop2 || isTop3) ? '#fff' : 'var(--color-text)',
                      fontWeight: 800, fontSize: 'var(--text-md)',
                      boxShadow: isTop1 ? '0 0 10px var(--color-warning)' : 'none',
                      flexShrink: 0,
                    }}>
                      {isTop1 ? <Trophy size={20} weight="fill" /> : isTop2 ? <Medal size={20} weight="fill" /> : isTop3 ? <Medal size={20} weight="fill" /> : i + 1}
                    </div>

                    <div style={{ flex: '1 1 150px', zIndex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-foreground)', fontSize: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '0 1 auto' }}>{d.name}</span>
                        {d.role === 'admin' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px', background: 'var(--color-primary)', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>
                            <ShieldCheck size={12} weight="fill" /> Admin
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.email} {d.lastAt ? `• ล่าสุด: ${new Date(d.lastAt).toLocaleString('th-TH')}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', zIndex: 1, marginLeft: 'auto' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ 
                          fontSize: 'var(--text-xl)', 
                          fontWeight: 800, 
                          color: isTop1 ? 'var(--color-warning)' : 'var(--color-foreground)',
                          fontFamily: 'var(--font-heading)',
                          lineHeight: 1
                        }}>
                          {d.count}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>XP (ตัว)</span>
                      </div>
                      
                      <div style={{ width: '1px', height: '32px', background: 'var(--glass-border)' }} />
                      
                      {confirmRoleId === d.id ? (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexDirection: 'column' }}>
                          <button 
                            onClick={() => { handleToggleRole(d.id, d.role); setConfirmRoleId(null); }}
                            className={`btn btn-sm ${d.role === 'admin' ? 'btn-danger' : 'btn-primary'}`}
                            style={{ padding: '0.4rem 0.6rem', fontSize: '11px', minWidth: 80 }}
                          >
                            ยืนยัน
                          </button>
                          <button 
                            onClick={() => setConfirmRoleId(null)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '11px', minWidth: 80 }}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmRoleId(d.id)}
                          className={`btn btn-sm ${d.role === 'admin' ? 'btn-outline' : 'btn-ghost'}`}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '11px', minWidth: 80 }}
                          title={d.role === 'admin' ? "ถอดสิทธิ์ Admin" : "มอบสิทธิ์ Admin"}
                        >
                          {d.role === 'admin' ? (
                            <><Shield size={14} weight="duotone" /> ถอด Admin</>
                          ) : (
                            <><ShieldCheck size={14} weight="duotone" /> ให้ Admin</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          {mergedList.length > 5 && (
            <button onClick={() => setShowAllDist(p => !p)} className="btn btn-outline btn-full" style={{ minHeight: 44, borderRadius: 'var(--radius-lg)' }}>
              {showAllDist
                ? <><CaretUp size={16} weight="bold" /> ย่อหน้าต่าง</>
                : <><CaretDown size={16} weight="bold" /> ดูผู้เล่นทั้งหมด ({mergedList.length} คน)</>}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SettingsTab({
  announcementText, setAnnouncementText, savingAnnouncement, announcementOk, handleSaveAnnouncement,
  regCode, setRegCode, savingCode, handleSaveRegCode, saveOk, stats,
  syncing, syncOk, handleSync
}: {
  announcementText: string;
  setAnnouncementText: (s: string) => void;
  savingAnnouncement: boolean;
  announcementOk: boolean;
  handleSaveAnnouncement: () => void;
  regCode: string;
  setRegCode: (s: string) => void;
  savingCode: boolean;
  saveOk: boolean;
  handleSaveRegCode: () => void;
  stats: Stats;
  syncing: boolean;
  syncOk: boolean;
  handleSync: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 600, margin: '0 auto' }}>
      <h2 className="sr-only">ตั้งค่าระบบ</h2>
      
      {saveOk && (
        <div className="alert alert-success" style={{ margin: '0 var(--space-4)' }}>
          <CheckCircle size={16} weight="duotone" style={{ flexShrink: 0 }} />
          บันทึกสำเร็จ!
        </div>
      )}

      {/* Manual Sync */}
      <div>
        <div style={{ padding: '0 var(--space-4) var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          ดึงข้อมูลล่าสุด
        </div>
        <div className="app-list" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="app-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', padding: 6, background: 'var(--color-warning)', color: '#fff', borderRadius: 'var(--radius-md)' }}>
                <ArrowsClockwise size={18} weight="fill" />
              </div>
              <span style={{ fontWeight: 600 }}>ดึงข้อมูลจาก Google Sheets</span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
              ระบบถูกตั้งค่าให้อ่านข้อมูลจากฐานข้อมูลของตัวเองเพื่อความรวดเร็ว 
              หากมีการแก้ไขข้อมูลใน Google Sheets กรุณากดปุ่มด้านล่างเพื่อซิงค์ข้อมูลล่าสุด
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-3)' }}>
              {syncOk && <span style={{ color: 'var(--color-success-text)', fontSize: 'var(--text-sm)' }}>ซิงค์สำเร็จ!</span>}
              <button onClick={handleSync} className="btn btn-warning btn-sm" disabled={syncing} style={{ minWidth: 120 }}>
                {syncing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'ซิงค์ข้อมูลเดี๋ยวนี้'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ประกาศระบบ */}
      <div>
        <div style={{ padding: '0 var(--space-4) var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          ประกาศสำหรับนักศึกษา
        </div>
        <div className="app-list" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="app-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', padding: 6, background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-md)' }}>
                <Megaphone size={18} weight="fill" />
              </div>
              <span style={{ fontWeight: 600 }}>ข้อความประกาศหน้าเว็บ</span>
            </div>
            <textarea
              className="input"
              placeholder="เช่น รับเสื้อได้ที่ห้อง 101 วันที่ 10 ต.ค. เวลา 13:00 - 16:00 น.\n(เว้นว่างไว้เพื่อปิดการแสดงผล)"
              value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
              style={{ minHeight: 100, resize: 'vertical', marginBottom: 'var(--space-3)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-3)' }}>
              {announcementOk && <span style={{ color: 'var(--color-success-text)', fontSize: 'var(--text-sm)' }}>บันทึกแล้ว</span>}
              <button onClick={handleSaveAnnouncement} className="btn btn-primary btn-sm" disabled={savingAnnouncement} style={{ minWidth: 100 }}>
                {savingAnnouncement ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
        <p style={{ padding: 'var(--space-2) var(--space-4) 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          ข้อความนี้จะแสดงในหน้าระบบค้นหาของนักศึกษา รองรับการขึ้นบรรทัดใหม่
        </p>
      </div>

      {/* ความปลอดภัย */}
      <div>
        <div style={{ padding: '0 var(--space-4) var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          ความปลอดภัย
        </div>
        <div className="app-list" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="app-list-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
              <div style={{ display: 'flex', padding: 6, background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}>
                <Gear size={18} weight="fill" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>รหัสสมัครบัญชีผู้แจก</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>ให้ผู้แจกใช้สมัครที่หน้า /register</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                type="text" className="input"
                placeholder="รหัสใหม่..."
                value={regCode} onChange={e => setRegCode(e.target.value)}
                style={{ width: 120, height: 32, fontSize: 'var(--text-sm)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              />
              <button onClick={handleSaveRegCode} className="btn btn-primary btn-sm" disabled={savingCode || !regCode.trim()}>
                {savingCode ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'เปลี่ยน'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ข้อมูลระบบ */}
      <div>
        <div style={{ padding: '0 var(--space-4) var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          ข้อมูลระบบ
        </div>
        <div className="app-list" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {[
            { label: 'แหล่งข้อมูล', value: 'Google Sheets', icon: <Package size={18} weight="fill" />, color: '#10b981' },
            { label: 'Cache TTL', value: '5 นาที', icon: <Clock size={18} weight="fill" />, color: '#f59e0b' },
            { label: 'จำนวนคำสั่งซื้อรวม', value: `${stats.total} รายการ`, icon: <Users size={18} weight="fill" />, color: '#3b82f6' },
          ].map(({ label, value, icon, color }, idx, arr) => (
            <div key={label} className="app-list-item" style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--glass-border)', padding: 'var(--space-3) var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', padding: 6, background: color, color: '#fff', borderRadius: 'var(--radius-md)' }}>
                  {icon}
                </div>
                <span style={{ fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
