export async function fetchShadeFactor(lat: number, lon: number) {
  // Simple placeholder:
  // High latitudes → more shading
  if (lat > 50) return 0.85;
  if (lat > 40) return 0.90;
  return 0.95;
}
