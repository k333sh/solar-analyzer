// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import { runSolarEngine } from "@/lib/solarEngine";

function estimateSpecificYield(lat: number, lon: number): number {
  if (lat > 49 && lat < 51 && lon > -98 && lon < -96) return 1350; // Winnipeg
  if (lat > 50 && lat < 52 && lon > -115 && lon < -113) return 1450; // Calgary
  if (lat > 53 && lat < 54 && lon > -114 && lon < -112) return 1400; // Edmonton
  if (lat > 43 && lat < 44 && lon > -80 && lon < -78) return 1250; // Toronto
  if (lat > 45 && lat < 46 && lon > -76 && lon < -74) return 1300; // Ottawa
  if (lat > 49 && lat < 50 && lon > -124 && lon < -122) return 1100; // Vancouver
  if (lat > 45 && lat < 46 && lon > -74 && lon < -73) return 1200; // Montreal
  if (lat > 44 && lat < 45 && lon > -64 && lon < -63) return 1250; // Halifax

  return 1200; // default Canada average
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      address,
      roof_area,
      roof_angle,
      roof_azimuth,
      monthly_bill
    } = body;

    if (!address || !roof_angle || !monthly_bill) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // 1) GEOCODE ADDRESS → LAT/LON
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "solar-analyzer-demo"
        }
      }
    );

    const geoJson = await geoRes.json();
    if (!Array.isArray(geoJson) || geoJson.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Could not geocode address." },
        { status: 400 }
      );
    }

    const lat = parseFloat(geoJson[0].lat);
    const lon = parseFloat(geoJson[0].lon);

    // 2) WEATHER (TEMP + CLOUD COVER) – Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,cloudcover&timezone=auto`
    );
    const weatherJson = await weatherRes.json();

    const temps: number[] = weatherJson?.hourly?.temperature_2m ?? [];
    const clouds: number[] = weatherJson?.hourly?.cloudcover ?? [];

    const avgTemp =
      temps.length > 0
        ? temps.reduce((a, b) => a + b, 0) / temps.length
        : 12;

    const avgCloud =
      clouds.length > 0
        ? clouds.reduce((a, b) => a + b, 0) / clouds.length / 100
        : 0.35; // convert % → 0–1

    // 3) AQI – OpenAQ (fallback if missing)
    const aqiRes = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=10000&limit=1`
    );
    const aqiJson = await aqiRes.json();

    let aqi = 40; // default "good"
    const firstResult = aqiJson?.results?.[0];
    if (firstResult && Array.isArray(firstResult.measurements)) {
      const pm25 = firstResult.measurements.find(
        (m: any) => m.parameter === "pm25"
      );
      if (pm25 && typeof pm25.value === "number") {
        // crude mapping PM2.5 → AQI-ish
        aqi = Math.min(500, pm25.value * 5);
      }
    }

    // 4) SOLAR IRRADIANCE – NASA POWER
    const nasaRes = await fetch(
      `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&latitude=${lat}&longitude=${lon}&format=JSON`
    );
    const nasaJson = await nasaRes.json();

    const irrData =
      nasaJson?.properties?.parameter?.ALLSKY_SFC_SW_DWN ?? null;

    // NASA gives monthly values; average them and scale
    let irradiance = 1400; // fallback
    if (irrData) {
      const vals = Object.values(irrData) as number[];
      if (vals.length > 0) {
        const avgDaily =
          vals.reduce((a, b) => a + b, 0) / vals.length; // kWh/m²/day
        irradiance = avgDaily * 365; // → kWh/m²/year
      }
    }

    // 5) ELECTRICITY RATE – simple estimate from monthly bill
    // crude: assume 800 kWh/month baseline
    const estKwhPerMonth = 800;
    const electricity_rate =
      estKwhPerMonth > 0 ? Number(monthly_bill) / estKwhPerMonth : 0.12;

    // 6) RUN SOLAR ENGINE
    // 6) RUN SOLAR ENGINE
    const result = runSolarEngine({
      address,
      num_panels: Number(body.num_panels),
      roof_angle: Number(roof_angle),
      roof_azimuth: roof_azimuth || "S",
      monthly_bill: Number(monthly_bill),

      irradiance,
      temperature: avgTemp,
      aqi,
      cloud_cover: avgCloud,
      shade_factor: Math.max(0.2, 1 - avgCloud),
      latitude: lat,
      electricity_rate,

      specific_yield: estimateSpecificYield(lat, lon),
    });


    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error." },
      { status: 500 }
    );
  }
}
