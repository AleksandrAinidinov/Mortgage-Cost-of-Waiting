import { useState } from "react";
import axios from "axios";
import { MortgageForm } from "./components/MortgageForm";
import { ResultsDashboard } from "./components/ResultsDashboard";
import { Header } from "./components/Header";
import { AnalysisResult, FormData } from "./types";

function App() {
  const [formData, setFormData] = useState<FormData>({
    currentRate: 5.75,
    remainingBalance: 500000,
    maturityDate: "03/25/2028",
    homeValue: 800000,
    waitMonths: 3,
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
      <Header />

      {/* Header 2*/}
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