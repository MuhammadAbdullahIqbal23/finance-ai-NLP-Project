export type Window = "this_month" | "last_month" | "last_3_months"

export interface CategoryStat {
  categoryId: number
  category: string
  total: number
  count: number
  isEssential: boolean
  isHighRisk: boolean
}

export interface FinancialSnapshot {
  asOf: string
  balances: { name: string; type: string; balance: number }[]
  totalBalance: number
  liquidBalance: number
  income: { thisMonth: number; lastMonth: number; threeMonthAvg: number }
  spend: {
    thisMonthMTD: number
    thisMonthProjected: number
    lastMonth: number
    threeMonthAvg: number
  }
  savings: { thisMonth: number; threeMonthAvg: number; rate: number }
  topCategoriesMTD: CategoryStat[]
  monthlyTotals: { month: string; income: number; expense: number; savings: number }[]
}

export interface ForecastResult {
  total: { blend: number; low: number; high: number }
  byCategory: Record<string, { blend: number; low: number; high: number }>
  method: string
  asOf: string
}

export interface RiskScoreResult {
  score: number
  band: "low" | "moderate" | "high"
  breakdown: {
    spendToIncome: number
    volatility: number
    savingsRateInverse: number
    highRiskShare: number
    anomalyShare: number
  }
  reasons: string[]
}

export interface AffordabilityResult {
  itemName: string
  price: number
  monthsAhead: number
  available: number
  buffer: number
  shortfall: number
  canAfford: boolean
  monthsNeededAtCurrentRate: number
  reason: string
}

export interface InstallmentResult {
  price: number
  months: number
  apr: number
  monthly: number
  ratio: number
  safe: boolean
  reason: string
}
