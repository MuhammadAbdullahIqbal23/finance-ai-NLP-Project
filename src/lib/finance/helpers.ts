import { prisma } from "@/lib/db"
import type { CategoryStat } from "@/lib/types"

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}
export function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
export function monthsAgo(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() - n, 1)
}
export function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export const fmtPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n)

export function mean(xs: number[]) {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}
export function stdev(xs: number[]) {
  if (xs.length <= 1) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export async function categoryStats(
  userId: number,
  from: Date,
  to: Date,
): Promise<CategoryStat[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to }, type: "expense" },
    include: { category: true },
  })
  const map = new Map<number, CategoryStat>()
  for (const r of rows) {
    if (!r.category) continue
    const k = r.category.id
    if (!map.has(k)) {
      map.set(k, {
        categoryId: r.category.id,
        category: r.category.name,
        total: 0,
        count: 0,
        isEssential: r.category.isEssential,
        isHighRisk: r.category.isHighRisk,
      })
    }
    const s = map.get(k)!
    s.total += Math.abs(r.amount)
    s.count += 1
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export async function monthlyTotals(userId: number, from: Date, to: Date) {
  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } },
    select: { date: true, amount: true, type: true },
  })
  const buckets = new Map<string, { income: number; expense: number; savings: number }>()
  for (const r of rows) {
    const k = ymKey(r.date)
    if (!buckets.has(k)) buckets.set(k, { income: 0, expense: 0, savings: 0 })
    const b = buckets.get(k)!
    if (r.type === "income") b.income += r.amount
    else if (r.type === "expense") b.expense += Math.abs(r.amount)
    else if (r.type === "transfer" && r.amount < 0) b.savings += Math.abs(r.amount)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, ...v }))
}

export async function getTransactions(userId: number, from: Date, to: Date) {
  return prisma.transaction.findMany({
    where: { userId, date: { gte: from, lte: to } },
    include: { category: true, account: true },
    orderBy: { date: "desc" },
  })
}
