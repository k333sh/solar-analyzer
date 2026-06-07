// -------------------------------
// TYPES
// -------------------------------
export type SolarEnvSuccess = {
  latitude: number;
  irradiance: number;
  temperature: number;
  aqi: number;
  cloud_cover: number;
  shade_factor: number;
  roof_azimuth: string;
  electricity_rate: number;
};

export type SolarEnvError = {
  error: string;
};

export type SolarEnv = SolarEnvSuccess | SolarEnvError;

// -------------------------------
// MAIN FUNCTION
// -------------------------------
export async function fetchSolarData(address: string): Promise<SolarEnv> {
  try {
    // 1. Try Nominatim
    const geo = await tryNominatim(address);

    // 2. Fallback to Open-Meteo geocoder
    const coords = geo || (await tryOpenMeteo(address));

    if (!coords) {
      return { error: "Could not find that location. Try a more specific address." };
    }

    const { latitude, longitude } = coords;

    // 3. Weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=direct_radiation,temperature_2m,cloudcover`,
      { cache: "no-store" }
    );
    const weather = await weatherRes.json();

    const irradiance = weather?.hourly?.direct_radiation?.[0];
    const temperature = weather?.hourly?.temperature_2m?.[0];
    const cloud_cover_raw = weather?.hourly?.cloudcover?.[0];

    if (
      irradiance == null ||
      temperature == null ||
      cloud_cover_raw == null
    ) {
      return { error: "Weather data unavailable for this location." };
    }

    const cloud_cover = cloud_cover_raw / 100;

    // 4. AQI
    const aqiRes = await fetch(
      `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}`,
      { cache: "no-store" }
    );
    const aqiJson = await aqiRes.json();

    const aqi = aqiJson?.results?.[0]?.measurements?.[0]?.value ?? null;

    if (aqi == null) {
      return { error: "Air quality data unavailable for this location." };
    }

    return {
      latitude,
      irradiance,
      temperature,
      aqi,
      cloud_cover,
      shade_factor: Math.max(0.2, 1 - cloud_cover),
      roof_azimuth: "S",
      electricity_rate: 0.12,
    };
  } catch (err) {
    return { error: "Unexpected error fetching solar data." };
  }
}

// -------------------------------
// HELPERS
// -------------------------------
async function tryNominatim(address: string) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: { "User-Agent": "SolarAnalyzer/1.0" },
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
