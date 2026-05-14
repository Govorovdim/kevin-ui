// ─── Household ───────────────────────────────────────────────────────────────
export interface Household {
  id: number;
  name: string;
  member_count: number;
  invite_token: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ─── Income ──────────────────────────────────────────────────────────────────
export interface Income {
  id: number;
  year: number;
  month: number;
  title: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// ─── Expense ─────────────────────────────────────────────────────────────────
export interface Expense {
  id: number;
  year: number;
  month: number;
  title: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// ─── Asset ───────────────────────────────────────────────────────────────────
export interface Asset {
  id: number;
  title: string;
  ticker: string | null;
  amount: number | null;
  bought_price: number | null;
  current_price: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Liability ────────────────────────────────────────────────────────────────
export interface Liability {
  id: number;
  title: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

// ─── Overview ─────────────────────────────────────────────────────────────────
export interface MonthSummary {
  month: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
}

export interface YearOverview {
  year: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  portfolio_value: number;
  total_debt: number;
  net_worth: number;
  months: MonthSummary[];
}

export interface MonthOverview {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  portfolio_value: number;
  total_debt: number;
  net_worth: number;
  income: Income[];
  expenses: Expense[];
  assets: Asset[];
  liabilities: Liability[];
}
