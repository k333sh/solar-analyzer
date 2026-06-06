// lib/fetchSolarData.ts

export async function fetchSolarData(address: string) {
  // 1. Geocode using Nominatim (OpenStreetMap)
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    {
      headers: {
        "User-Agent": "solar-analyzer-app/1.0 (contact@example.com)"
      }
    }
  );

  const geo = await geoRes.json();

  if (!geo || geo.length === 0) {
    throw new Error("Could not geocode address");
  }

  const latitude = Number(geo[0].lat);
  const longitude = Number(geo[0].lon);

  // 2. Fetch irradiance, temperature, cloud cover
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`
  );

  const weather = await weatherRes.json();

  const irradiance = weather?.hourly?.direct_radiation?.[0] ?? 1200;
  const temperature = weather?.hourly?.temperature_2m?.[0] ?? 15;
  const cloud_cover_raw = weather?.hourly?.cloudcover?.[0] ?? 40;

  // Convert 0–100 → 0–1
  const cloud_cover = cloud_cover_raw / 100;

  // 3. Fetch AQI
  const aqiRes = await fetch(
    `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`
  );

  const aqiJson = await aqiRes.json();

  const aqi =
    aqiJson?.results?.[0]?.measurements?.[0]?.value ?? 50;

  // 4. Shade factor (simple model)
  const shade_factor = Math.max(0.2, 1 - cloud_cover);

  // 5. Default roof azimuth (south-facing)
  const roof_azimuth = "S";

  // 6. Electricity rate (CAD/kWh)
  const electricity_rate = 0.12;

  return {
    latitude,
    irradiance,
    temperature,
    aqi,
    cloud_cover,
    shade_factor,
    roof_azimuth,
    electricity_rate,
  };
}
