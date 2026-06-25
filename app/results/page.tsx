"use client";

import { useEffect, useState } from "react";
import "./results.css";
import LineGraph from "@/components/LineGraph";
import BackButton from "@/components/BackButton";

function fmt(value: any, digits = 2) {
  return typeof value === "number" && !isNaN(value)
    ? value.toFixed(digits)
    : "—";
}

function explainScore(score: number) {
  const pct = score * 100;

  if (pct >= 80) return "Excellent solar potential. Strong financial return.";
  if (pct >= 60) return "Good solar potential. Likely a smart investment.";
  if (pct >= 40) return "Moderate solar potential. Average returns.";
  if (pct >= 20) return "Low solar potential. Performance reduced.";
  return "Very poor solar potential.";
}

export default function ResultsPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("solar_result");
    if (stored) {
      setResult(JSON.parse(stored));
    }
  }, []);

  if (!result) {
    return <div className="page">No analysis found. Run a new one.</div>;
  }

  const summary = result.summary;
  const breakdown = result.breakdown;

  const scorePct = Math.round((summary?.score ?? 0) * 100);
  const annual = summary?.annual_kwh ?? 0;

  // ⭐ NRCan-based monthly solar distribution
  const monthlyFractions = [
    0.02, 0.04, 0.07, 0.10, 0.12, 0.13,
    0.13, 0.12, 0.10, 0.07, 0.04, 0.02
  ];

  // ⭐ Convert annual → monthly kWh
  const productionCurve = monthlyFractions.map(f => f * annual);

  // ⭐ Month labels
  const monthLabels = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  return (
    <div className="page">
      <h1 className="title">Solar Analysis Results</h1>

      <div className="card">
        <h2 className="card-title">Solar Score</h2>
        <div className="score">{scorePct}%</div>

        <div className="score-bar">
          <div className="score-fill" style={{ width: `${scorePct}%` }}></div>
        </div>

        <p className="explain">{explainScore(summary?.score ?? 0)}</p>
      </div>

      <div className="card">
        <h2 className="card-title">Energy Production Over Time</h2>
        <LineGraph dataPoints={productionCurve} labels={monthLabels} />
      </div>

      <div className="card">
        <h2 className="card-title">Summary</h2>
        <p><strong>Annual Production:</strong> {fmt(summary?.annual_kwh, 0)} kWh</p>
        <p><strong>Payback Period:</strong> {fmt(summary?.payback_years, 1)} years</p>
      </div>

      <div className="card">
        <h2 className="card-title">Efficiency Breakdown</h2>
        <p><strong>Temperature Loss:</strong> {fmt(breakdown?.efficiency?.temp_loss, 3)}</p>
        <p><strong>AQI Loss:</strong> {fmt(breakdown?.efficiency?.aqi_loss, 3)}</p>
        <p><strong>Cloud Loss:</strong> {fmt(breakdown?.efficiency?.cloud_loss, 3)}</p>
        <p><strong>Tilt Loss:</strong> {fmt(breakdown?.efficiency?.tilt_loss, 3)}</p>
        <p><strong>Shade Loss:</strong> {fmt(breakdown?.efficiency?.shade_loss, 3)}</p>
        <p><strong>System Loss:</strong> {fmt(breakdown?.efficiency?.system_loss, 3)}</p>
        <p><strong>Final Efficiency:</strong> {fmt(breakdown?.efficiency?.final_efficiency, 3)}</p>
      </div>

      <div className="card">
        <h2 className="card-title">Financial</h2>
        <p><strong>Annual Savings:</strong> ${fmt(breakdown?.financial?.annual_savings, 2)}</p>
        <p><strong>ROI:</strong> {fmt(breakdown?.financial?.roi, 1)}%</p>
        <p><strong>Payback Years:</strong> {fmt(breakdown?.financial?.payback_years, 1)}</p>
      </div>

      <div className="btn-row">
        <BackButton />
      </div>
    </div>
  );
}
