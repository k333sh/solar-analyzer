export async function fetchAQI(lat: number, lon: number) {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`;

  const res = await fetch(url);
  const data = await res.json();

  return data.data?.aqi ?? 40;
}
