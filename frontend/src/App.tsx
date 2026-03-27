import { useState } from "react";
import axios from "axios";
import { MortgageForm } from "./components/MortgageForm";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { AnalysisResult, FormData } from "./types";

function App() {
  const [formData, setFormData] = useState<FormData>({
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
          <MortgageForm 
            formData={formData} 
            setFormData={setFormData}
            onAnalyze={handleAnalyze}
            loading={loading}
            error={error}
          />
          <ResultsDashboard result={result} />
        </div>
      </main>
    </div>
  );
}

export default App;