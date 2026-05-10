/**
 * Output number-grounding check.
 *
 * Extracts every PKR figure and percentage from the assistant text and verifies
 * it appears (within tolerance) in either:
 *   - any tool-result JSON in this turn, or
 *   - the LIVE_CONTEXT block embedded in the system prompt.
 *
 * If a number can't be grounded, we tag the response so the UI can surface a
 * "guard" warning. We don't strip — we surface, so failures are visible at viva.
 */

const PKR_RE = /(?:PKR|Rs\.?|rupees?)\s*[\d,]+(?:\.\d+)?/gi
const PERCENT_RE = /\b\d+(?:\.\d+)?\s*%/g

function parseAmount(s: string) {
  const digits = s.replace(/[^\d.]/g, "")
  return parseFloat(digits)
}

function collectNumbersFromAny(value: unknown, out: Set<number>) {
  if (value == null) return
  if (typeof value === "number") {
    if (Number.isFinite(value)) out.add(Math.round(value))
    return
  }
  if (typeof value === "string") {
    for (const m of value.matchAll(PKR_RE)) out.add(Math.round(parseAmount(m[0])))
    for (const m of value.matchAll(PERCENT_RE)) out.add(Math.round(parseFloat(m[0])))
    // raw integers in strings
    const ints = value.match(/\b\d{2,}\b/g)
    if (ints) for (const i of ints) out.add(parseInt(i, 10))
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) collectNumbersFromAny(v, out)
    return
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>))
      collectNumbersFromAny(v, out)
  }
}

export interface ValidationResult {
  grounded: boolean
  ungroundedAmounts: number[]
  ungroundedPercents: number[]
}

export function validateOutput(
  text: string,
  toolResults: unknown[],
  systemPrompt: string,
): ValidationResult {
  const allowed = new Set<number>()
  for (const r of toolResults) collectNumbersFromAny(r, allowed)
  collectNumbersFromAny(systemPrompt, allowed)

  const matchClose = (n: number) => {
    for (const a of allowed) {
      if (a === 0 && n !== 0) continue
      const tol = Math.max(2, a * 0.02) // 2% or 2 absolute
      if (Math.abs(a - n) <= tol) return true
    }
    return false
  }

  const ungroundedAmounts: number[] = []
  for (const m of text.matchAll(PKR_RE)) {
    const v = Math.round(parseAmount(m[0]))
    if (!matchClose(v) && v >= 100) ungroundedAmounts.push(v)
  }
  const ungroundedPercents: number[] = []
  for (const m of text.matchAll(PERCENT_RE)) {
    const v = Math.round(parseFloat(m[0]))
    if (!matchClose(v)) ungroundedPercents.push(v)
  }
  return {
    grounded: ungroundedAmounts.length === 0 && ungroundedPercents.length === 0,
    ungroundedAmounts,
    ungroundedPercents,
  }
}
