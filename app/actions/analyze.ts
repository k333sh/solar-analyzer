"use server";

import { runSolarEngine } from "@/lib/solarEngine";
import { fetchSolarData } from "@/src/lib/fetchSolarData";

export async function analyzeAndReturn(formData: FormData) {
  try {
    const address = formData.get("address") as string;
    const roof_angle = Number(formData.get("roof_angle"));
    const roof_area = formData.get("roof_area")
      ? Number(formData.get("roof_area"))
      : null;
    const monthly_bill = Number(formData.get("monthly_bill"));

    const env = await fetchSolarData(address);

    const result = runSolarEngine({
      address,
      roof_area,
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
    });

    return result;

  } catch (err) {
    console.error("SERVER ACTION ERROR:", err);
    return null;
  }
}
