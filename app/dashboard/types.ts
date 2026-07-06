export type DashTab = 'overview' | 'orders' | 'distributors' | 'settings';
export type Filter = 'all' | 'distributed' | 'pending';

export interface Order {
  rowIndex: number;
  name: string;
  phone: string;
  size: string;
  quantity: number;
  distribution: {
    id: string;
    distributed_at: string;
    distributors: { name: string };
  } | null;
}

export interface Stats { total: number; distributed: number; remaining: number; }
export interface DistStat { name: string; count: number; lastAt: string; }
