// lib/solarEngine.ts

export type SolarInputs = {
  address: string;
  roof_area?: number | null;
  roof_angle: number;
  roof_azimuth: string;
  monthly_bill: number;
  irradiance: number;     // kWh/m²/year
  temperature: number;    // °C
  aqi: number;            // Air Quality Index
  cloud_cover: number;    // 0–1
  shade_factor: number;   // 0–1
  latitude: number;       // degrees
  electricity_rate: number;
};

export type SolarResult = {
  summary: {
    score: number;
    annual_kwh: number;
    payback_years: number;
  };
  breakdown: {
    efficiency: Record<string, number>;
    production: Record<string, number>;
    financial: Record<string, number>;
  };
};

// ----------------------------
// EFFICIENCY ENGINE (patched)
// ----------------------------

function computeEfficiency(inputs: SolarInputs) {
  const {
    temperature,
    aqi,
    cloud_cover,
    roof_azimuth,
    roof_angle,
    shade_factor,
    latitude
  } = inputs;

  const temp_loss = 1 - Math.max(0, (temperature - 25) * 0.003);
  const aqi_loss = 1 - (aqi / 500) * 0.15;

  // Softer cloud loss
  const cloud_loss = 1 - cloud_cover * 0.40;

  const orientation_map: Record<string, number> = {
    "S": 1.0,
    "SE": 0.97,
    "SW": 0.97,
    "E": 0.92,
    "W": 0.92,
    "NE": 0.80,
    "NW": 0.80,
    "N": 0.70
  };
  const orientation_loss = orientation_map[roof_azimuth] ?? 0.90;

  const tilt_loss = 1 - Math.abs(roof_angle - latitude) * 0.005;

  // Softer shade loss
  const shade_loss = 0.5 + (shade_factor * 0.5);

  const system_loss = 0.90;

  let final_efficiency =
    temp_loss *
    aqi_loss *
    cloud_loss *
    orientation_loss *
    tilt_loss *
    shade_loss *
    system_loss;

  // Clamp to realistic range
  if (final_efficiency < 0.15) final_efficiency = 0.15;
  if (final_efficiency > 0.25) final_efficiency = 0.25;

  return {
    temp_loss,
    aqi_loss,
    cloud_loss,
    orientation_loss,
    tilt_loss,
    shade_loss,
    system_loss,
    final_efficiency
  };
}

// ----------------------------
// PRODUCTION ENGINE
// ----------------------------

function computeProduction(inputs: SolarInputs, eff: number) {
  const { irradiance, roof_area } = inputs;

  const assumed_kw = 6;
  let annual_kwh;

  if (!roof_area) {
    annual_kwh = assumed_kw * 1000 * eff;
  } else {
    const panel_efficiency = 0.20;
    annual_kwh = irradiance * roof_area * panel_efficiency * eff;
  }

  if (!annual_kwh || annual_kwh < 2000) {
    annual_kwh = 2000;
  }

  return { annual_kwh };
}

// ----------------------------
// FINANCIAL ENGINE (patched)
// ----------------------------

function computeFinancial(inputs: SolarInputs, annual_kwh: number) {
  const { electricity_rate, monthly_bill } = inputs;

  const annual_savings = annual_kwh * electricity_rate;
  const annual_bill = monthly_bill * 12;

  const system_size_kw = 6;
  const system_cost = system_size_kw * 2500;

  let payback_years = system_cost / annual_savings;
  let roi = (annual_savings / system_cost) * 100;

  if (!isFinite(payback_years) || payback_years > 50) payback_years = 50;
  if (!isFinite(roi) || roi < 0) roi = 0;

  // NEW: financial pressure (higher bill = higher incentive)
  const financial_pressure = annual_bill / system_cost;
  const financial_quality = Math.min(1, financial_pressure);

  return {
    annual_savings,
    annual_bill,
    financial_quality,
    system_cost,
    payback_years,
    roi
  };
}

// ----------------------------
// MASTER ENGINE (70% sunlight, 30% financial)
// ----------------------------

export function runSolarEngine(inputs: SolarInputs): SolarResult {
  const efficiency = computeEfficiency(inputs);
  const production = computeProduction(inputs, efficiency.final_efficiency);
  const financial = computeFinancial(inputs, production.annual_kwh);

  const solar_quality = efficiency.final_efficiency; // 0.15–0.25
  const financial_quality = financial.financial_quality; // 0–1

  const score = Math.min(
    1,
    solar_quality * 0.7 + financial_quality * 0.3
  );

  return {
    summary: {
      score,
      annual_kwh: production.annual_kwh,
      payback_years: financial.payback_years
    },
    breakdown: {
      efficiency,
      production,
      financial
    }
  };
}
