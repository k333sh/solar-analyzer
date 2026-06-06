export async function fetchIrradiance(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=shortwave_radiation_sum&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  const daily = data.daily?.shortwave_radiation_sum?.[0] ?? 4.0;

  return daily * 365; // convert kWh/m²/day → kWh/m²/year
}
