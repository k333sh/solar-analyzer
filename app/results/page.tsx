export const runtime = "nodejs";

import "./results.css";
import { createClient } from "@supabase/supabase-js";
import LineGraph from "@/components/LineGraph";
import BackButton from "@/components/BackButton";

// Safe formatter
function fmt(value: any, digits = 2) {
    return typeof value === "number" && !isNaN(value)
        ? value.toFixed(digits)
        : "—";
}

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

    // Supabase client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the stored analysis
    const { data, error } = await supabase
        .from("analyses")
        .select("result")
        .eq("id", id)
        .single();

    if (error || !data) {
        return <div className="page">Result not found or expired.</div>;
    }

    // Extract result safely
    const result = data.result;
    const summary = result.summary;
    const breakdown = result.breakdown;

    const scorePct = Math.round((summary?.score ?? 0) * 100);

    // Fake 3-year production curve for graph
    const annual = summary?.annual_kwh ?? 0;
    const productionCurve = [annual, annual * 1.01, annual * 1.02];

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

                <p className="explain">{explainScore(summary?.score ?? 0)}</p>

                <div className="timeline">
                    {[...Array(Math.round(summary?.payback_years ?? 0)).keys()].map((year) => (
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
                <p><strong>Annual Production:</strong> {fmt(summary?.annual_kwh, 0)} kWh</p>
                <p><strong>Payback Period:</strong> {fmt(summary?.payback_years, 1)} years</p>
            </div>

            {/* EFFICIENCY CARD */}
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

            {/* FINANCIAL CARD */}
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
