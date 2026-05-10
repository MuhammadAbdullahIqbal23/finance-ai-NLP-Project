/**
 * Conversation memory: load recent turns, save new ones.
 * Implementation matches plan §9.8.
 */
import { prisma } from "@/lib/db"

const HISTORY_LIMIT = 10

export async function getOrCreateConversation(userId: number, conversationId?: number) {
  if (conversationId) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (conv && conv.userId === userId) return conv
  }
  return prisma.conversation.create({ data: { userId } })
}

export async function loadHistory(conversationId: number) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant" | "tool",
    content: r.content,
    toolCalls: r.toolCalls ? JSON.parse(r.toolCalls) : undefined,
    toolResults: r.toolResults ? JSON.parse(r.toolResults) : undefined,
  }))
}

export async function persistMessage(args: {
  conversationId: number
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: unknown
  toolResults?: unknown
}) {
  return prisma.message.create({
    data: {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls ? JSON.stringify(args.toolCalls) : null,
      toolResults: args.toolResults ? JSON.stringify(args.toolResults) : null,
    },
  })
}
