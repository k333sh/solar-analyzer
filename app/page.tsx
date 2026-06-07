"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeAndReturn } from "./actions/analyze";

import "./globals.css";
import "./home.css";

export default function HomePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [address, setAddress] = useState("");
  const [roofAngle, setRoofAngle] = useState("");
  const [roofArea, setRoofArea] = useState("");
  const [monthlyBill, setMonthlyBill] = useState("");

  function prefill() {
    setAddress("1600 Pennsylvania Ave NW, Washington, DC");
    setRoofAngle("30");
    setRoofArea("80");
    setMonthlyBill("120");
  }

  async function handleAnalyze(formData: FormData) {
    startTransition(async () => {
      const result = await analyzeAndReturn(formData);

      if (!result) {
        alert("Could not analyze this address. Try a different one.");
        return;
      }

      sessionStorage.setItem("solar_result", JSON.stringify(result));

      router.push("/results");
    });
  }

  return (
    <div className="home-layout">
      <section className="home-left">
        <h1 className="home-title">SOLAR ANALYZER</h1>
        <p className="home-subtitle">
          <em>Solar intelligence calculator for efficiency and need assessment.</em>
        </p>
        <button className="btn-prefill" onClick={prefill}>
          Prefill Example
        </button>
      </section>

      <section className="home-right">
        <form action={handleAnalyze} className="input-grid">

          <div className="input-card">
            <img src="/icons/House.png" className="input-icon" />
            <label className="input-card-label">Address</label>
            <input
              name="address"
              className="input-card-control"
              placeholder="Enter site address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="input-card">
            <img src="/icons/protractor.png" className="input-icon" />
            <label className="input-card-label">Roof Angle (°)</label>
            <input
              name="roof_angle"
              className="input-card-control"
              placeholder="e.g. 30"
              value={roofAngle}
              onChange={(e) => setRoofAngle(e.target.value)}
              required
            />
          </div>

          <div className="input-card">
            <img src="/icons/triangle.png" className="input-icon" />
            <label className="input-card-label">Roof Area (m²)</label>
            <input
              name="roof_area"
              className="input-card-control"
              placeholder="Optional"
              value={roofArea}
              onChange={(e) => setRoofArea(e.target.value)}
            />
          </div>

          <div className="input-card">
            <img src="/icons/cash.png" className="input-icon" />
            <label className="input-card-label">Monthly Bill ($)</label>
            <input
              name="monthly_bill"
              className="input-card-control"
              placeholder="e.g. 120"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              required
            />
          </div>

          <button className="btn-run" type="submit" disabled={isPending}>
            {isPending ? "Analyzing..." : "Run Analysis"}
          </button>

        </form>
      </section>

      <footer className="footer">
        © 2026 Solar Analyzer — Designed with precision.
      </footer>
    </div>
  );
}
