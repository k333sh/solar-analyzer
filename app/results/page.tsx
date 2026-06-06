export const runtime = "nodejs";

import "./results.css";
import { getResult } from "@/lib/resultStore";
import LineGraph from "@/components/LineGraph";
import BackButton from "@/components/BackButton";

// Score explanation helper
function explainScore(score: number) {
    const pct = score * 100;

    if (pct >= 80) return "Excellent solar potential. Strong financial return and high annual production.";
    if (pct >= 60) return "Good solar potential. Solar is likely a smart investment for this property.";
    if (pct >= 40) return "Moderate solar potential. Solar may still work, but returns are average.";
    if (pct >= 20) return "Low solar potential. Shading, tilt, or climate reduce performance.";
    return "Very poor solar potential. Solar is unlikely to be cost‑effective here.";
}

export default async function ResultsPage(props: {
    searchParams: Promise<{ id?: string }>;
}) {
    const { id } = await props.searchParams;

    if (!id) return <div className="page">No result id provided.</div>;

    const data = getResult(id);
    if (!data) return <div className="page">Result not found or expired.</div>;

    const { summary, breakdown } = data;
    const scorePct = Math.round(summary.score * 100);

    // Fake 3-year production curve for graph
    const productionCurve = [
        summary.annual_kwh,
        summary.annual_kwh * 1.01,
        summary.annual_kwh * 1.02,
    ];

    return (
        <div className="page">
            <h1 className="title">Solar Analysis Results</h1>

            {/* SCORE CARD */}
            <div className="card">
                <h2 className="card-title">Solar Score</h2>
                <div className="score">{scorePct}%</div>

                <div className="score-bar">
                    <div className="score-fill" style={{ width: `${scorePct}%` }}></div>
                </div>

                <p className="explain">{explainScore(summary.score)}</p>

                <div className="timeline">
                    {[...Array(Math.round(summary.payback_years)).keys()].map((year) => (
                        <div key={year} className="timeline-year"></div>
                    ))}
                </div>
                <div className="timeline-label">Years Until Payback</div>
            </div>

            {/* GRAPH CARD */}
            <div className="card">
                <h2 className="card-title">Energy Production Over Time</h2>
                <LineGraph dataPoints={productionCurve} />
            </div>

            {/* SUMMARY CARD */}
            <div className="card">
                <h2 className="card-title">Summary</h2>
                <p><strong>Annual Production:</strong> {summary.annual_kwh.toFixed(0)} kWh</p>
                <p><strong>Payback Period:</strong> {summary.payback_years.toFixed(1)} years</p>
            </div>

            {/* EFFICIENCY CARD */}
            <div className="card">
                <h2 className="card-title">Efficiency Breakdown</h2>
                <p><strong>Temperature Loss:</strong> {breakdown.efficiency.temp_loss.toFixed(3)}</p>
                <p><strong>AQI Loss:</strong> {breakdown.efficiency.aqi_loss.toFixed(3)}</p>
                <p><strong>Cloud Loss:</strong> {breakdown.efficiency.cloud_loss.toFixed(3)}</p>
                <p><strong>Tilt Loss:</strong> {breakdown.efficiency.tilt_loss.toFixed(3)}</p>
                <p><strong>Shade Loss:</strong> {breakdown.efficiency.shade_loss.toFixed(3)}</p>
                <p><strong>System Loss:</strong> {breakdown.efficiency.system_loss.toFixed(3)}</p>
                <p><strong>Final Efficiency:</strong> {breakdown.efficiency.final_efficiency.toFixed(3)}</p>
            </div>

            {/* FINANCIAL CARD */}
            <div className="card">
                <h2 className="card-title">Financial</h2>
                <p><strong>Annual Savings:</strong> ${breakdown.financial.annual_savings.toFixed(2)}</p>
                <p><strong>ROI:</strong> {breakdown.financial.roi.toFixed(1)}%</p>
                <p><strong>Payback Years:</strong> {breakdown.financial.payback_years.toFixed(1)}</p>
            </div>
            <div className="btn-row">
                <BackButton />
            </div>
        </div>
    );
}
