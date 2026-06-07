export async function fetchSolarData(address: string) {
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(address)}`,
    {
      method: "GET",
      headers: {
        "User-Agent": "SolarAnalyzer/1.0 (oyewusiiteoluwa@gmail.com)",
        "Referer": "https://solar-analyzer.vercel.app",
      },
      cache: "no-store",
    }
  );

  const text = await geoRes.text();

  if (text.trim().startsWith("<")) {
    throw new Error("Nominatim blocked the request (rate limit or missing headers)");
  }

  const geo = JSON.parse(text);

  if (!geo || geo.length === 0) {
    throw new Error("Could not geocode address");
  }

  const latitude = Number(geo[0].lat);
  const longitude = Number(geo[0].lon);

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`,
    { cache: "no-store" }
  );
  const weather = await weatherRes.json();

  const irradiance = weather?.hourly?.direct_radiation?.[0] ?? 1400;
  const temperature = weather?.hourly?.temperature_2m?.[0] ?? 10;
  const cloud_cover_raw = weather?.hourly?.cloudcover?.[0] ?? 40;
  const cloud_cover = cloud_cover_raw / 100;

  const aqiRes = await fetch(
    `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`,
    { cache: "no-store" }
  );
  const aqiJson = await aqiRes.json();

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
