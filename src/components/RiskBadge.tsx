export function RiskBadge({
  band,
  score,
}: {
  band: "low" | "moderate" | "high"
  score: number
}) {
  const cls =
    band === "low" ? "badge-low" : band === "moderate" ? "badge-mod" : "badge-high"
  return (
    <span className={`badge ${cls}`}>
      Risk {score}/100 · {band}
    </span>
  )
}
