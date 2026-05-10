import { prisma } from "@/lib/db"
import { fmtPKR } from "@/lib/finance/helpers"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const dynamic = "force-dynamic"

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const category = params.category
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 25

  const where = {
    userId: DEMO_USER_ID,
    ...(category ? { category: { name: category } } : {}),
  }

  const [items, total, categories] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-muted text-sm">
            {total} total · page {page} / {pageCount}
          </p>
        </div>
      </header>

      <div className="card">
        <form className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <span className="text-muted">Category:</span>
          <a
            href="/transactions"
            className={`badge ${!category ? "badge-low" : "btn-ghost"}`}
          >
            All
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/transactions?category=${c.name}`}
              className={`badge ${category === c.name ? "badge-low" : "btn-ghost"}`}
              style={{ padding: "2px 8px" }}
            >
              {c.name}
            </a>
          ))}
        </form>

        <table className="w-full text-sm">
          <thead className="text-muted text-xs">
            <tr>
              <th className="text-left py-2">Date</th>
              <th className="text-left">Merchant</th>
              <th className="text-left">Category</th>
              <th className="text-left">Description</th>
              <th className="text-left">Type</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-default">
                <td className="py-2 text-muted">
                  {t.date.toISOString().slice(0, 10)}
                </td>
                <td>{t.merchant ?? "—"}</td>
                <td className="text-muted">{t.category?.name ?? "—"}</td>
                <td className="text-muted">
                  {t.description ?? "—"}
                  {t.isAnomaly && (
                    <span className="ml-2 badge badge-high">anomaly</span>
                  )}
                </td>
                <td className="text-muted text-xs uppercase">{t.type}</td>
                <td
                  className={`text-right ${t.type === "income" ? "text-success" : t.amount < 0 ? "text-danger" : ""}`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {fmtPKR(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between text-sm">
          <a
            href={`/transactions?${new URLSearchParams({
              ...(category ? { category } : {}),
              page: String(Math.max(1, page - 1)),
            })}`}
            className="btn btn-ghost"
            aria-disabled={page === 1}
          >
            ← Prev
          </a>
          <a
            href={`/transactions?${new URLSearchParams({
              ...(category ? { category } : {}),
              page: String(Math.min(pageCount, page + 1)),
            })}`}
            className="btn btn-ghost"
            aria-disabled={page >= pageCount}
          >
            Next →
          </a>
        </div>
      </div>
    </div>
  )
}
