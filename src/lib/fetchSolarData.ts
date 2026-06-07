export async function fetchSolarData(address: string) {
  let latitude: number | null = null;
  let longitude: number | null = null;

  // 1. Try Nominatim
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          "User-Agent": "SolarAnalyzer/1.0",
          "Referer": "https://solar-analyzer.vercel.app",
        },
        cache: "no-store",
      }
    );

    const text = await geoRes.text();

    if (!text.startsWith("<")) {
      const geo = JSON.parse(text);
      if (geo.length > 0) {
        latitude = Number(geo[0].lat);
        longitude = Number(geo[0].lon);
      }
    }
  } catch {}

  // 2. Fallback: Open-Meteo geocoder
  if (!latitude || !longitude) {
    try {
      const geo2 = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1`,
        { cache: "no-store" }
      ).then(r => r.json());

      if (geo2?.results?.length > 0) {
        latitude = geo2.results[0].latitude;
        longitude = geo2.results[0].longitude;
      }
    } catch {}
  }

  // 3. Final fallback
  if (!latitude || !longitude) {
    latitude = 40.7128;
    longitude = -74.0060;
  }

  // Weather
  const weather = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`,
    { cache: "no-store" }
  ).then(r => r.json());

  const irradiance = weather?.hourly?.direct_radiation?.[0] ?? 1400;
  const temperature = weather?.hourly?.temperature_2m?.[0] ?? 10;
  const cloud_cover_raw = weather?.hourly?.cloudcover?.[0] ?? 40;
  const cloud_cover = cloud_cover_raw / 100;

  // AQI
  const aqiJson = await fetch(
    `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`,
    { cache: "no-store" }
  ).then(r => r.json());

  const aqi = aqiJson?.results?.[0]?.measurements?.[0]?.value ?? 40;

  const shade_factor = Math.max(0.2, 1 - cloud_cover);

  return {
    latitude,
    irradiance,
    temperature,
    aqi,
    cloud_cover,
    shade_factor,
    roof_azimuth: "S",
    electricity_rate: 0.12,
  };
}
