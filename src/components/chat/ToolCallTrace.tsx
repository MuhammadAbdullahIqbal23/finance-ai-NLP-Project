"use client"

import { useState } from "react"

interface ToolInvocation {
  toolCallId?: string
  toolName: string
  state?: "partial-call" | "call" | "result"
  args?: Record<string, unknown>
  result?: unknown
}

export function ToolCallTrace({ invocations }: { invocations: ToolInvocation[] }) {
  const [open, setOpen] = useState(false)
  if (!invocations || invocations.length === 0) return null
  return (
    <div
      className="mt-2 rounded-lg border border-default text-xs"
      style={{ background: "rgba(124, 92, 255, 0.05)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-muted"
      >
        <span>
          🔧 {invocations.length} tool call{invocations.length === 1 ? "" : "s"}:{" "}
          <span className="text-primary">
            {invocations.map((i) => i.toolName).join(", ")}
          </span>
        </span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-3 pb-2 space-y-2 border-t border-default pt-2">
          {invocations.map((inv, idx) => (
            <div key={inv.toolCallId ?? idx} className="space-y-1">
              <div className="text-primary font-mono">{inv.toolName}</div>
              {inv.args && Object.keys(inv.args).length > 0 && (
                <details>
                  <summary className="text-muted cursor-pointer">args</summary>
                  <pre className="mt-1 rounded bg-black/40 p-2 overflow-auto text-[11px] leading-tight">
                    {JSON.stringify(inv.args, null, 2)}
                  </pre>
                </details>
              )}
              {inv.result !== undefined && (
                <details>
                  <summary className="text-muted cursor-pointer">result</summary>
                  <pre className="mt-1 rounded bg-black/40 p-2 overflow-auto text-[11px] leading-tight max-h-48">
                    {typeof inv.result === "string"
                      ? inv.result
                      : JSON.stringify(inv.result, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
