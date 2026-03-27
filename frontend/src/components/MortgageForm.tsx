import { ArrowRight, AlertTriangle } from "lucide-react";
import { FormData } from "../types";

interface MortgageFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onAnalyze: () => void;
  loading: boolean;
  error: string | null;
}

export function MortgageForm({
  formData,
  setFormData,
  onAnalyze,
  loading,
  error,
}: MortgageFormProps) {
  return (
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
        onClick={onAnalyze}
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
  );
}
