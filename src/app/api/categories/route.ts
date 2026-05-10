import { prisma } from "@/lib/db"

export const runtime = "nodejs"

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })
  return Response.json(categories)
}
