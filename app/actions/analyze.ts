"use server";

import { runSolarEngine } from "@/lib/solarEngine";
import { fetchSolarData } from "@/src/lib/fetchSolarData";

export async function analyzeAndReturn(formData: FormData) {
  try {
    const address = formData.get("address") as string;
    const roof_angle = Number(formData.get("roof_angle"));
    const num_panels = Number(formData.get("num_panels"));
    const monthly_bill = Number(formData.get("monthly_bill"));

    // Fetch environmental data (irradiance, AQI, cloud, temp, etc.)
    const env = await fetchSolarData(address);

    // Run the new solar engine (panel-based)
    const result = runSolarEngine({
      address,
      num_panels,
      roof_angle,
      roof_azimuth: env.roof_azimuth,
      monthly_bill,
      irradiance: env.irradiance,
      temperature: env.temperature,
      aqi: env.aqi,
      cloud_cover: env.cloud_cover,
      shade_factor: env.shade_factor,
      latitude: env.latitude,
      electricity_rate: env.electricity_rate,
      specific_yield: env.specific_yield, // NEW: NRCan PV potential
    });

    return result;

  } catch (err) {
    console.error("SERVER ACTION ERROR:", err);
    return null;
  }
}
