import { buildContext, riskScore } from "@/lib/finance/rules"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"

export async function GET() {
  const ctx = await buildContext(DEMO_USER_ID)
  return Response.json(riskScore(ctx))
}
