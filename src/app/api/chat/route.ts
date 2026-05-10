import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { buildSystemPrompt } from "@/lib/chat/prompt"
import { buildTools, DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"
export const maxDuration = 60

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const CHAT_COOLDOWN_MS = 8000
let lastChatRequestAt = 0

function getClientErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "")
  const lower = message.toLowerCase()

  if (lower.includes("rate limit") || lower.includes("tpm") || lower.includes("429")) {
    return "Rate limit reached. Please wait a few seconds and try again."
  }

  return "Chat temporarily unavailable. Please try again."
}

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

  const now = Date.now()
  const elapsed = now - lastChatRequestAt
  if (elapsed < CHAT_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((CHAT_COOLDOWN_MS - elapsed) / 1000)
    return Response.json(
      {
        error: "Rate limit reached. Please wait a few seconds and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    )
  }
  lastChatRequestAt = now

  const { messages } = await req.json()

  const system = await buildSystemPrompt(DEMO_USER_ID)
  const tools = buildTools(DEMO_USER_ID)

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system,
    messages,
    tools,
    maxRetries: 0,
    maxSteps: 6,
    temperature: 0.3,
    onError({ error }) {
      console.error("[chat] streamText error", error)
    },
  })

  return result.toDataStreamResponse({
    getErrorMessage: getClientErrorMessage,
  })
}
