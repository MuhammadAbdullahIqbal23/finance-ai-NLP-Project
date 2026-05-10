import { runForecast } from "@/lib/forecast/engine"
import { ForecastChart } from "@/components/charts/ForecastChart"
import { AffordabilitySimulator } from "@/components/AffordabilitySimulator"
import { buildContext, goalProgress, savingsRecommendation } from "@/lib/finance/rules"
import { DEMO_USER_ID } from "@/lib/chat/tools"
import { fmtPKR } from "@/lib/finance/helpers"

export const dynamic = "force-dynamic"

export default async function ForecastPage() {
  const forecast = await runForecast(DEMO_USER_ID)
  const ctx = await buildContext(DEMO_USER_ID)
  const goals = await goalProgress(DEMO_USER_ID, ctx)
  const sav = savingsRecommendation(ctx)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Forecast & Planning</h1>
        <p className="text-muted text-sm">Next-month projections and goal planning.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <ForecastChart forecast={forecast} />
        </div>
        <div className="space-y-3">
          <AffordabilitySimulator />
          <div className="card">
            <h3 className="mb-3 font-medium">Savings Recommendation</h3>
            <p className="text-3xl font-semibold">
              {fmtPKR(sav.recommendedMonthlyTransfer)}
              <span className="text-sm text-muted font-normal"> /mo</span>
            </p>
            <p className="mt-2 text-xs text-muted">{sav.reason}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
              <div>
                <div className="text-[10px] uppercase">20% rule</div>
                <div className="text-white">{fmtPKR(sav.targetByRule)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Avg expenses</div>
                <div className="text-white">{fmtPKR(sav.expectedExpenses)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase">Headroom</div>
                <div className="text-white">{fmtPKR(sav.headroom)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 font-medium">Savings Goals</h3>
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100))
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted ml-2 text-xs">
                      target {new Date(g.targetDate).toLocaleDateString("en-PK")}
                    </span>
                  </div>
                  <div className="text-muted text-xs">
                    {fmtPKR(g.current)} / {fmtPKR(g.target)}
                  </div>
                </div>
                <div
                  className="mt-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      background: g.onTrack ? "var(--success)" : "var(--warning)",
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted">{g.reason}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
