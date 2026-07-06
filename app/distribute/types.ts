export interface OrderResult {
  order: Record<string, string | number | undefined>;
  distribution: Record<string, unknown> | null;
}

export interface MyStats {
  myStats: { total: number; today: number };
  overall: { distributed: number };
  recentFive: { sheet_row_id: string; phone: string; distributed_at: string }[];
}

export interface OrderRow {
  rowIndex: number;
  displayId: string;
  name: string;
  phone: string;
  size: string;
  quantity: number;
  slipUrl: string | null;
  distribution: { distributed_at: string; distributors?: { name: string } } | null;
}

export type Tab = 'search' | 'scan' | 'all';
