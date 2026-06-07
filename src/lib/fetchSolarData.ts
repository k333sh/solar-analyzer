export async function fetchSolarData(address: string) {
  // -------------------------------
  // 1. GEOCODING (with fallback)
  // -------------------------------

  let latitude: number | null = null;
  let longitude: number | null = null;

  // Try Nominatim first
  try {
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

    // Detect HTML (rate limit)
    if (!text.trim().startsWith("<")) {
      const geo = JSON.parse(text);
      if (geo && geo.length > 0) {
        latitude = Number(geo[0].lat);
        longitude = Number(geo[0].lon);
      }
    }
  } catch (err) {
    console.warn("Nominatim failed:", err);
  }

  // Fallback: Open-Meteo geocoder
  if (latitude === null || longitude === null) {
    try {
      const geo2 = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1`,
        { cache: "no-store" }
      ).then((r) => r.json());

      if (geo2?.results?.length > 0) {
        latitude = geo2.results[0].latitude;
        longitude = geo2.results[0].longitude;
      }
    } catch (err) {
      console.warn("Open-Meteo geocoder failed:", err);
    }
  }

  // FINAL FALLBACK — NEVER BREAK
  if (latitude === null || longitude === null) {
    console.warn("Using fallback coordinates");
    latitude = 40.7128;   // New York fallback
    longitude = -74.0060;
  }

  // -------------------------------
  // 2. WEATHER + IRRADIANCE
  // -------------------------------
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`,
    { cache: "no-store" }
  );
  const weather = await weatherRes.json();

  const irradiance = weather?.hourly?.direct_radiation?.[0] ?? 1400;
  const temperature = weather?.hourly?.temperature_2m?.[0] ?? 10;
  const cloud_cover_raw = weather?.hourly?.cloudcover?.[0] ?? 40;
  const cloud_cover = cloud_cover_raw / 100;

  // -------------------------------
  // 3. AQI
  // -------------------------------
  const aqiRes = await fetch(
    `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`,
    { cache: "no-store" }
  );
  const aqiJson = await aqiRes.json();

  const aqi =
    aqiJson?.results?.[0]?.measurements?.[0]?.value ?? 40;

  // -------------------------------
  // 4. SHADE FACTOR
  // -------------------------------
  const shade_factor = Math.max(0.2, 1 - cloud_cover);

  // -------------------------------
  // 5. RETURN FINAL DATA
  // -------------------------------
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
