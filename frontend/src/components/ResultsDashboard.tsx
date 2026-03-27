import { TrendingUp, AlertTriangle } from "lucide-react";
import { AnalysisResult } from "../types";

interface ResultsDashboardProps {
  result: AnalysisResult | null;
}

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  if (!result) {
    return (
      <section>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px", background: "#fafafa" }}>
          <TrendingUp size={48} color="#ccc" style={{ marginBottom: "16px" }} />
          <p style={{ color: "#999", textAlign: "center" }}>Enter your details to generate your <br />Time-to-Decision analysis.</p>
        </div>
      </section>
    );
  }

  const dailyLoss = result.dailyCostOfWaiting ?? 0;
  const isCritical = dailyLoss > 10;
  const isModerate = dailyLoss > 0 && dailyLoss <= 10;
  const isHealthy = dailyLoss <= 0;

  const impactColor = isCritical ? "#da2c20ff" : isModerate ? "#ce5e02ff" : "#245c55ff";
  const impactBg = isCritical ? "#fadbd5ff" : isModerate ? "#f8e9d7ff" : "#c2f4ecff";
  const impactLabel = isCritical ? "Critical Impact" : isModerate ? "Moderate Impact" : "Healthy Position";
  const impactBorder = isCritical ? "#f8d1d4ff" : isModerate ? "#fbe7adff" : "#e6f2f0";

  return (
    <section>
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Hero: Daily Loss */}
        <div style={{ background: impactBg, padding: "40px 32px", textAlign: "center", borderBottom: `1px solid ${impactBorder}` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{ background: impactColor, color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {impactLabel}
            </div>
          </div>
          <div style={{ fontSize: "16px", color: impactColor, opacity: 0.8, marginBottom: "8px", fontWeight: 500 }}>
            {isHealthy ? "Your mortgage strategy is" : "You are losing"}
          </div>
          <div style={{ fontSize: "64px", fontWeight: 800, color: impactColor, lineHeight: 1, letterSpacing: "-2px" }}>
            {isHealthy ? "Optimized" : `$${dailyLoss.toFixed(0)}`}{!isHealthy && <span style={{ fontSize: "24px", letterSpacing: "0" }}>/day</span>}
          </div>
          <div style={{ fontSize: "18px", color: impactColor, opacity: 0.8, marginTop: "12px", fontWeight: 500 }}>
            {isHealthy ? "No daily loss detected" : "by waiting to switch"}
          </div>
        </div>

        <div style={{ padding: "32px" }}>
          {/* Monthly Gain */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid var(--perch-border)" }}>
            <div>
              <h3 style={{ fontSize: "14px", color: "var(--perch-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Monthly Gain</h3>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--perch-green)" }}>+${result.monthlyInterestSavings.toLocaleString()} / mo</p>
            </div>
            <div style={{ background: "var(--perch-green-light)", color: "var(--perch-green)", padding: "12px 20px", borderRadius: "8px", fontWeight: 600 }}>
              Stop the bleed
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
            <div style={{ padding: "16px", background: "var(--perch-bg-alt)", borderRadius: "12px", border: "1px solid var(--perch-border)" }}>
              <div style={{ fontSize: "11px", color: "var(--perch-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Break-Even</div>
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {result.paybackPeriodMonths === -1 ? "N/A" : `${result.paybackPeriodMonths} Months`}
              </div>
            </div>
            <div style={{ padding: "16px", background: "var(--perch-bg-alt)", borderRadius: "12px", border: "1px solid var(--perch-border)" }}>
              <div style={{ fontSize: "11px", color: "var(--perch-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Total Net Benefit</div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: result.netBenefitNow > 0 ? "var(--perch-green)" : "#d93025" }}>
                ${result.netBenefitNow.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Context Footer */}
          {result.netBenefitNow > 0 && (
            <div style={{ marginTop: "32px", padding: "16px", background: "#f8faf9", borderRadius: "8px", fontSize: "13px", color: "#666", display: "flex", gap: "12px", alignItems: "start" }}>
              <AlertTriangle size={16} color="#ed6c02" style={{ marginTop: "2px", flexShrink: 0 }} />
              <span>Delay only makes sense if you expect rates to drop below <strong>{result.breakEvenRate}%</strong> before your next renewal.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
