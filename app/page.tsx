"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analyzeAndStore } from "./actions/analyze";

import "./globals.css";
import "./home.css";

export default function HomePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // FORM STATE
  const [address, setAddress] = useState("");
  const [roofAngle, setRoofAngle] = useState("");
  const [roofArea, setRoofArea] = useState("");
  const [monthlyBill, setMonthlyBill] = useState("");

  // PREFILL BUTTON
  function prefill() {
    setAddress("1600 Pennsylvania Ave NW, Washington, DC");
    setRoofAngle("30");
    setRoofArea("80");
    setMonthlyBill("120");
  }

  // SUBMIT HANDLER (PATCHED)
  async function handleAnalyze(formData: FormData) {
    startTransition(async () => {

      const result = await analyzeAndStore(formData);

      if (!result || typeof result !== "number") {
        alert("Could not analyze this address. Try a different one.");
        return;
      }

      const id = result;

      // ⭐ POLL SUPABASE UNTIL THE ROW EXISTS (bulletproof)
      let attempts = 0;
      let exists = false;

      while (attempts < 8 && !exists) {
        const res = await fetch(`/api/check?id=${id}`);
        const json = await res.json();
        if (json.exists) {
          exists = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 150));
        attempts++;
      }

      router.push(`/results?id=${id}`);
    });
  }


  return (
    <div className="home-layout">

      {/* LEFT HERO PANEL */}
      <section className="home-left">
        <h1 className="home-title">SOLAR ANALYZER</h1>

        <p className="home-subtitle">
          <em>Solar intelligence calculator for efficiency and need assessment.</em>
        </p>

        <button className="btn-prefill" onClick={prefill}>
          Prefill Example
        </button>
      </section>

      {/* RIGHT INPUT PANEL */}
      <section className="home-right">
        <form action={handleAnalyze} className="input-grid">

          {/* ADDRESS */}
          <div className="input-card">
            <img src="/icons/house.png" className="input-icon" />
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

          {/* ROOF ANGLE */}
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

          {/* ROOF AREA */}
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

          {/* MONTHLY BILL */}
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

          {/* SUBMIT BUTTON */}
          <button
            className="btn-run"
            type="submit"
            disabled={isPending}
          >
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
