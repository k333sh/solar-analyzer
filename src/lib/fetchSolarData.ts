export async function fetchSolarData(address: string) {
  // 1. Try Nominatim
  const coords = await tryNominatim(address)
    || await tryOpenMeteo(address)
    || await tryPhoton(address);

  if (!coords) {
    throw new Error("Could not geocode address after multiple attempts.");
  }

  const { latitude, longitude } = coords;

  // 2. Weather + irradiance
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`,
    { cache: "no-store" }
  );
  const weather = await weatherRes.json();

  const irradiance = weather?.hourly?.direct_radiation?.[0] ?? 1400;
  const temperature = weather?.hourly?.temperature_2m?.[0] ?? 10;
  const cloud_cover_raw = weather?.hourly?.cloudcover?.[0] ?? 40;
  const cloud_cover = cloud_cover_raw / 100;

  // 3. AQI
  const aqiRes = await fetch(
    `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`,
    { cache: "no-store" }
  );
  const aqiJson = await aqiRes.json();

  const aqi = aqiJson?.results?.[0]?.measurements?.[0]?.value ?? 40;

  // 4. Shade factor
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

// -------------------------------
// GEOCODING HELPERS
// -------------------------------

async function tryNominatim(address: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          "User-Agent": "SolarAnalyzer/1.0",
        },
        cache: "no-store",
      }
    );

    const text = await res.text();
    if (text.trim().startsWith("<")) return null;

    const json = JSON.parse(text);
    if (!json?.length) return null;

    return {
      latitude: Number(json[0].lat),
      longitude: Number(json[0].lon),
    };
  } catch {
    return null;
  }
}

async function tryOpenMeteo(address: string) {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1`,
      { cache: "no-store" }
    );
    const json = await res.json();

    if (!json?.results?.length) return null;

    return {
      latitude: json.results[0].latitude,
      longitude: json.results[0].longitude,
    };
  } catch {
    return null;
  }
}

async function tryPhoton(address: string) {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`,
      { cache: "no-store" }
    );
    const json = await res.json();

    if (!json?.features?.length) return null;

    return {
      latitude: json.features[0].geometry.coordinates[1],
      longitude: json.features[0].geometry.coordinates[0],
    };
  } catch {
    return null;
  }
}
