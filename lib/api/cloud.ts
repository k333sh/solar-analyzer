export async function fetchCloudCover(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover`;

  const res = await fetch(url);
  const data = await res.json();

  return (data.current?.cloud_cover ?? 35) / 100;
}
