import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "success" | "warning" | "danger"
}) {
  const toneClass = {
    default: "",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  }[tone]
  return (
    <div className="card">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  )
}
