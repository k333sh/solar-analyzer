"use server";

import { createClient } from "@supabase/supabase-js";
import { runSolarEngine } from "@/lib/solarEngine";
import { fetchSolarData } from "@/src/lib/fetchSolarData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function analyzeAndStore(formData: FormData) {
  const address = formData.get("address") as string;
  const roof_angle = Number(formData.get("roof_angle"));
  const roof_area = formData.get("roof_area")
    ? Number(formData.get("roof_area"))
    : null;
  const monthly_bill = Number(formData.get("monthly_bill"));

  // Fetch environmental + location data
  const env = await fetchSolarData(address);

  // Run the full engine with ALL required fields
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

  // Store in Supabase
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      address,
      roof_angle,
      roof_area,
      monthly_bill,
      result,
    })
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}
