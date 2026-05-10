import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { buildSystemPrompt } from "@/lib/chat/prompt"
import { buildTools, DEMO_USER_ID } from "@/lib/chat/tools"

export const runtime = "nodejs"
export const maxDuration = 60

const localLLM = createOpenAI({
  apiKey: process.env.LOCAL_LLM_API_KEY ?? "lm-studio",
  baseURL: process.env.LOCAL_LLM_BASE_URL ?? "http://localhost:1234/v1",
})

const localModelId = process.env.LOCAL_LLM_MODEL

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
  if (!localModelId) {
    return Response.json(
      {
        error:
          "LOCAL_LLM_MODEL missing. Set it in .env.local to the model id reported by your local server (GET /v1/models).",
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
    model: localLLM(localModelId),
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
