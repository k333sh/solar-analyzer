"use server";

import { runSolarEngine } from "@/lib/solarEngine";
import { saveResult } from "@/lib/resultStore";
import { geocode } from "@/lib/api/geocode";
import { fetchWeather } from "@/lib/api/weather";
import { fetchAQI } from "@/lib/api/aqi";
import { fetchIrradiance } from "@/lib/api/irradiance";
import { fetchCloudCover } from "@/lib/api/cloud";
import { fetchShadeFactor } from "@/lib/api/shade";


export async function analyzeAndStore(formData: FormData) {
  const address = String(formData.get("address") || "");
  const roof_area = formData.get("roof_area");
  const roof_angle = formData.get("roof_angle");
  const monthly_bill = formData.get("monthly_bill");

  if (!address || !roof_angle || !monthly_bill) {
    throw new Error("Missing required fields");
  }

  // 1. GEOLOCATION
  const { lat, lon } = await geocode(address);

  // 2. WEATHER
  const weather = await fetchWeather(lat, lon);

  // 3. AIR QUALITY
  const aqi = await fetchAQI(lat, lon);

  // 4. IRRADIANCE
  const irradiance = await fetchIrradiance(lat, lon);

  // 5. CLOUD COVER
  const cloud_cover = await fetchCloudCover(lat, lon);

  // 6. SHADING
  const shade_factor = await fetchShadeFactor(lat, lon);

  // 7. BUILD INPUTS FOR ENGINE
  const inputs = {
    address,
    roof_area: roof_area ? Number(roof_area) : null,
    roof_angle: Number(roof_angle),
    roof_azimuth: "S", // TODO: detect from roof geometry
    monthly_bill: Number(monthly_bill),

    irradiance,
    temperature: weather.temperature,
    aqi,
    cloud_cover,
    shade_factor,
    latitude: lat,
    electricity_rate: weather.electricity_rate ?? 0.12
  };

  const result = runSolarEngine(inputs);
  const id = saveResult(result);

  return id;
}
