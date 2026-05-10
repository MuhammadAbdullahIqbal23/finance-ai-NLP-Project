import { prisma } from "@/lib/db"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"

export async function GET() {
  const accounts = await prisma.account.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { name: "asc" },
  })
  return Response.json(accounts)
}
