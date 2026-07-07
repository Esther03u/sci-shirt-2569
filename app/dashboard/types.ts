export type DashTab = 'overview' | 'orders' | 'distributors' | 'settings';
export type Filter = 'all' | 'distributed' | 'pending';

export interface Order {
  rowIndex: number;
  displayId: string;
  name: string;
  phone: string;
  size: string;
  branch?: string;
  quantity: number;
  distribution: {
    id: string;
    distributed_at: string;
    distributors: { name: string };
  } | null;
}

export interface Stats { total: number; distributed: number; remaining: number; }
export interface DistStat { name: string; count: number; lastAt: string; }
export interface Distributor { id: string; name: string; email: string; role: 'admin' | 'distributor'; }
