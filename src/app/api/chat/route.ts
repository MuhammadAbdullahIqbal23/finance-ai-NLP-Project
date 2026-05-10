import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { buildSystemPrompt } from "@/lib/chat/prompt"
import { buildTools, DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"
export const maxDuration = 60

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith("REPLACE_WITH_")) {
    return Response.json(
      {
        error:
          "GROQ_API_KEY missing or placeholder. Edit .env.local and put a fresh key from https://console.groq.com/keys",
      },
      { status: 500 },
    )
  }

  const { messages } = await req.json()

  const system = await buildSystemPrompt(DEMO_USER_ID)
  const tools = buildTools(DEMO_USER_ID)

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system,
    messages,
    tools,
    maxSteps: 6,
    temperature: 0.3,
    onError({ error }) {
      console.error("[chat] streamText error", error)
    },
  })

  return result.toDataStreamResponse()
}
