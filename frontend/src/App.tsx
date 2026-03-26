import { useState } from "react";
import { ArrowRight, Flame, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";

interface AnalysisResult {
  monthlyInterestSavings: number;
  totalCostOfWaiting: number;
  dailyCostOfWaiting: number;
  paybackPeriodMonths: number;
  breakEvenRate: number;
  netBenefitNow: number;
  adjustedBenefit: number;
  offerTermYears: number;
  recommendation: "LOCK_NOW" | "WAIT";
  summary: string;
}

function App() {
  const [formData, setFormData] = useState({
    currentRate: 5.5,
    remainingBalance: 400000,
    maturityDate: "03/25/2028",
    homeValue: 800000,
    waitMonths: 6,
    lender: "TD Canada Trust",
    mortgageRateType: "Fixed",
  });

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/v1/strategy/analyze-full", formData);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.details || "Failed to analyze mortgage strategy.");
    } finally {
      setLoading(false);
    }
  };

  const dailyLoss = result?.dailyCostOfWaiting ?? 0;
  const isCritical = dailyLoss > 10;
  const isModerate = dailyLoss > 0 && dailyLoss <= 10;
  const isHealthy = dailyLoss <= 0;

  const impactColor = isCritical ? "#d93025" : isModerate ? "#ed6c02" : "var(--perch-green)";
  const impactBg = isCritical ? "#fff4f2" : isModerate ? "#fff9f2" : "var(--perch-green-light)";
  const impactLabel = isCritical ? "Critical Impact" : isModerate ? "Moderate Impact" : "Healthy Position";
  const impactBorder = isCritical ? "#f8d7da" : isModerate ? "#ffeeba" : "#e6f2f0";

  return (
    <div className="app">
      {/* Header */}
      <nav style={{ background: "white", borderBottom: "1px solid var(--perch-border)", padding: "16px 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="var(--perch-green)">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--perch-green)", letterSpacing: "-0.5px" }}>perch</span>
          </div>
          <div style={{ display: "flex", gap: "24px", fontSize: "14px", fontWeight: 500 }}>
            <span>Solutions</span>
            <span>Tools</span>
            <span>Learn</span>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header style={{ background: "var(--perch-green)", color: "white", padding: "64px 0", textAlign: "center" }}>
        <div className="container">
          <h1 style={{ color: "white", fontSize: "40px", marginBottom: "16px" }}>Are You Losing Money by Waiting?</h1>
          <p style={{ opacity: 0.9, fontSize: "18px" }}>Find out if switching now actually pays off.</p>
        </div>
      </header>

      <main className="container" style={{ marginTop: "-40px", paddingBottom: "100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>

          {/* Input Form */}
          <section className="card">
            <h2 style={{ marginBottom: "24px", fontSize: "20px" }}>What's your current mortgage offer?</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label>Current Rate (%)</label>
                <input
                  type="number" step="0.01"
                  value={formData.currentRate}
                  onChange={e => setFormData({ ...formData, currentRate: Number(e.target.value) })}
                />
              </div>
              <div>
                <label>Remaining Balance ($)</label>
                <input
                  type="number"
                  value={formData.remainingBalance}
                  onChange={e => setFormData({ ...formData, remainingBalance: Number(e.target.value) })}
                />
              </div>
              <div>
                <label>Maturity Date</label>
                <input
                  type="text" placeholder="MM/DD/YYYY"
                  value={formData.maturityDate}
                  onChange={e => setFormData({ ...formData, maturityDate: e.target.value })}
                />
              </div>
              <div>
                <label>Home Value ($)</label>
                <input
                  type="number"
                  value={formData.homeValue}
                  onChange={e => setFormData({ ...formData, homeValue: Number(e.target.value) })}
                />
              </div>
              <div>
                <label>Lender</label>
                <input
                  type="text"
                  value={formData.lender}
                  onChange={e => setFormData({ ...formData, lender: e.target.value })}
                />
              </div>
              <div>
                <label>Rate Type</label>
                <select
                  value={formData.mortgageRateType}
                  onChange={e => setFormData({ ...formData, mortgageRateType: e.target.value as any })}
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Variable">Variable</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <label>Wait Strategy (Months to simulate)</label>
              <input
                type="number"
                value={formData.waitMonths}
                onChange={e => setFormData({ ...formData, waitMonths: Number(e.target.value) })}
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Strategy"}
              {!loading && <ArrowRight size={20} />}
            </button>

            {error && (
              <div style={{ marginTop: "16px", color: "#d93025", fontSize: "14px", display: "flex", gap: "8px" }}>
                <AlertTriangle size={18} />
                {error}
              </div>
            )}
          </section>

          {/* Results Side */}
          <section>
            {result ? (
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
            ) : (
              <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px", background: "#fafafa" }}>
                <TrendingUp size={48} color="#ccc" style={{ marginBottom: "16px" }} />
                <p style={{ color: "#999", textAlign: "center" }}>Enter your details to generate your <br />Time-to-Decision analysis.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;