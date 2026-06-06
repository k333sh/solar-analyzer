export async function geocode(address: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "solar-analyzer-app" }
  });

  const data = await res.json();

  if (!data.length) {
    throw new Error("Address not found");
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon)
  };
}
