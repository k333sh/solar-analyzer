"use server";

import { createClient } from "@supabase/supabase-js";
import { runSolarEngine } from "@/lib/solarEngine";
import { fetchSolarData, SolarEnvSuccess } from "@/src/lib/fetchSolarData";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// -------------------------------
// TYPE GUARD
// -------------------------------
function isEnvSuccess(env: any): env is SolarEnvSuccess {
  return env && !env.error;
}

// -------------------------------
// SERVER ACTION
// -------------------------------
export async function analyzeAndStore(formData: FormData) {
  try {
    console.log("SERVER ACTION STARTED");

    const address = formData.get("address") as string;
    const roof_angle = Number(formData.get("roof_angle"));
    const roof_area = formData.get("roof_area")
      ? Number(formData.get("roof_area"))
      : null;
    const monthly_bill = Number(formData.get("monthly_bill"));

    console.log("INPUTS:", { address, roof_angle, roof_area, monthly_bill });

    // Fetch environmental + location data
    const env = await fetchSolarData(address);
    console.log("FETCHED ENV DATA:", env);

    // ⭐ NEW: Handle geocoding/weather/AQI errors
    if (!isEnvSuccess(env)) {
      console.error("ENVIRONMENT DATA ERROR:", env.error);
      return { error: env.error };
    }

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

    console.log("ENGINE RESULT:", result);

    // Store in Supabase
    console.log("INSERTING INTO SUPABASE…");

    const { data, error } = await supabase
      .from("analyses")
      .insert({ result })
      .select("id")
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return { error: "Database insert failed." };
    }

    console.log("INSERTED ROW WITH ID:", data.id);

    return { id: data.id };

  } catch (err) {
    console.error("SERVER ACTION ERROR:", err);
    return { error: "Unexpected server error." };
  }
}
