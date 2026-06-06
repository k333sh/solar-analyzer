export async function fetchWeather(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    temperature: data.current?.temperature_2m ?? 15,
    electricity_rate: 0.12 // placeholder until you add real utility data
  };
}
