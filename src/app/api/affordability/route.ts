import { buildContext, affordability } from "@/lib/finance/rules"
import { DEMO_USER_ID } from "@/lib/chat/tools"
import { z } from "zod"

const Schema = z.object({
  itemName: z.string().default("Item"),
  price: z.number().int().positive(),
  monthsAhead: z.number().int().min(0).max(36).default(0),
})

export const runtime = "nodejs"

export async function POST(req: Request) {
  const body = await req.json()
  const args = Schema.parse(body)
  const ctx = await buildContext(DEMO_USER_ID)
  return Response.json(affordability(ctx, args))
}
