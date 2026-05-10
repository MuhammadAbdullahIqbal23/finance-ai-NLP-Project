import { runForecast } from "@/lib/forecast/engine"
import { DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"

export async function GET() {
  return Response.json(await runForecast(DEMO_USER_ID))
}
