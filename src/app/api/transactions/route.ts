import { prisma } from "@/lib/db"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? 20))
  const category = searchParams.get("category") ?? undefined

  const where = {
    userId: DEMO_USER_ID,
    ...(category ? { category: { name: category } } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ])

  return Response.json({ items, total, page, pageSize })
}
