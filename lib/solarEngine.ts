// lib/solarEngine.ts

export type SolarInputs = {
  address: string;
  num_panels: number;          // NEW
  roof_angle: number;
  roof_azimuth: string;
  monthly_bill: number;

  irradiance: number;          // still useful for display
  temperature: number;
  aqi: number;
  cloud_cover: number;
  shade_factor: number;
  latitude: number;
  electricity_rate: number;

  specific_yield: number;      // NEW (NRCan kWh/kWp/year)
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
// EFFICIENCY ENGINE (corrected)
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

  // Temperature loss (mild)
  const temp_loss = 1 - Math.max(0, (temperature - 25) * 0.003);

  // AQI loss (mild)
  const aqi_loss = 1 - (aqi / 500) * 0.15;

  // Cloud loss (softened)
  const cloud_loss = 1 - cloud_cover * 0.40;

  // Orientation
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

  // Tilt loss (softened)
  const tilt_loss = 1 - Math.abs(roof_angle - latitude) * 0.005;

  // Shade loss (softened)
  const shade_loss = 0.5 + (shade_factor * 0.5);

  // System loss
  const system_loss = 0.90;

  // Multiply all losses
  let final_efficiency =
    temp_loss *
    aqi_loss *
    cloud_loss *
    orientation_loss *
    tilt_loss *
    shade_loss *
    system_loss;

  // LOW-END CLAMP ONLY
  if (final_efficiency < 0.14) final_efficiency = 0.14;

  // NO HIGH-END CLAMP — Sahara can go above 0.25 now

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
  const { num_panels, specific_yield } = inputs;

  const panel_watt = 400; // assume 400W panels
  const kwp = (num_panels * panel_watt) / 1000;

  // Base production from NRCan PV potential
  let annual_kwh = kwp * specific_yield;

  // Apply efficiency losses
  annual_kwh = annual_kwh * eff;

  // Minimum realistic production
  if (!annual_kwh || annual_kwh < 2000) {
    annual_kwh = 2000;
  }

  return { annual_kwh, kwp };
}


// ----------------------------
// FINANCIAL ENGINE (corrected)
// ----------------------------

function computeFinancial(inputs: SolarInputs, annual_kwh: number, kwp: number) {
  const { electricity_rate, monthly_bill } = inputs;

  const annual_savings = annual_kwh * electricity_rate;
  const annual_bill = monthly_bill * 12;

  const system_cost = kwp * 2500; // CAD average $2.5/W

  let payback_years = system_cost / annual_savings;
  let roi = (annual_savings / system_cost) * 100;

  if (!isFinite(payback_years) || payback_years > 50) payback_years = 50;
  if (!isFinite(roi) || roi < 0) roi = 0;

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
  const financial = computeFinancial(inputs, production.annual_kwh, production.kwp);

  const solar_quality = efficiency.final_efficiency;
  const financial_quality = financial.financial_quality;

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

