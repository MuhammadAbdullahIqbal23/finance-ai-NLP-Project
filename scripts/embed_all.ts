/**
 * One-shot script: embeds every Transaction's description into a 384-dim vector
 * via Transformers.js (Xenova/all-MiniLM-L6-v2) and stores it in the Transaction.embedding
 * column. Run once after seeding. Re-run after adding new transactions.
 */
import { PrismaClient } from "@prisma/client"
import { embed, float32ToBytes } from "../src/lib/rag/embed"
import { txText } from "../src/lib/rag/retrieve"

const prisma = new PrismaClient()

async function main() {
  const txs = await prisma.transaction.findMany({ include: { category: true } })
  console.log(`Embedding ${txs.length} transactions…`)
  let i = 0
  for (const t of txs) {
    const text = txText(t)
    const vec = await embed(text)
    await prisma.transaction.update({
      where: { id: t.id },
      data: { embedding: new Uint8Array(float32ToBytes(vec)) },
    })
    i++
    if (i % 25 === 0 || i === txs.length) console.log(`  ${i}/${txs.length}`)
  }
  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
