"use client"

import { useState } from "react"
import type { AffordabilityResult } from "@/lib/types"

export function AffordabilitySimulator() {
  const [item, setItem] = useState("iPhone 15")
  const [price, setPrice] = useState(320_000)
  const [months, setMonths] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AffordabilityResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function check() {
    setLoading(true)
    setErr(null)
    setResult(null)
    try {
      const r = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: item, price, monthsAhead: months }),
      })
      if (!r.ok) throw new Error("Request failed")
      const d = (await r.json()) as AffordabilityResult
      setResult(d)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="mb-3 font-medium">Affordability Simulator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Item</label>
          <input
            className="input"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Price (PKR)</label>
          <input
            type="number"
            className="input"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Months ahead</label>
          <input
            type="number"
            min={0}
            max={36}
            className="input"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          />
        </div>
      </div>
      <button className="btn btn-primary mt-3" disabled={loading} onClick={check}>
        {loading ? "Checking…" : "Check"}
      </button>
      {err && <p className="mt-3 text-danger text-sm">{err}</p>}
      {result && (
        <div className="mt-4 space-y-1 text-sm">
          <div className={result.canAfford ? "text-success" : "text-danger"}>
            <strong>
              {result.canAfford
                ? "Yes — affordable"
                : `Not yet — short by PKR ${result.shortfall.toLocaleString("en-PK")}`}
            </strong>
          </div>
          <div className="text-muted">
            Available after buffer: PKR {result.available.toLocaleString("en-PK")} · Buffer (3-mo emergency):
            PKR {result.buffer.toLocaleString("en-PK")}
          </div>
          {!result.canAfford && result.monthsNeededAtCurrentRate >= 0 && (
            <div className="text-muted">
              Estimated months at current savings rate:{" "}
              <span className="text-warning">{result.monthsNeededAtCurrentRate}</span>
            </div>
          )}
          <div className="text-xs text-muted italic">{result.reason}</div>
        </div>
      )}
    </div>
  )
}
