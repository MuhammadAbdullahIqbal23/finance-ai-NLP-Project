import { NextRequest } from "next/server"
import { getSnapshot } from "@/lib/finance/snapshot"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
  const data = await getSnapshot(DEMO_USER_ID)
  return Response.json(data)
}
