const cache = {};

export async function geocodeCityState(city, state) {
  if (!city && !state) return null;
  const query = [city, state].filter(Boolean).join(', ');
  if (cache[query]) return cache[query];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'EveryPetMatters/1.0' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache[query] = coords;
      return coords;
    }
  } catch {
    // silently fail — map just won't show this marker
  }
  return null;
}

// Geocode an array of unique city/state pairs, returns a map of "city, state" -> {lat, lng}
// Throttled to 1 request at a time per Nominatim's usage policy (no concurrent requests).
export async function geocodeAll(pairs) {
  const unique = [...new Map(pairs.map(p => {
    const key = [p.city, p.state].filter(Boolean).join(', ').toLowerCase();
    return [key, p];
  })).values()];

  const results = [];
  for (const { city, state } of unique) {
    const key = [city, state].filter(Boolean).join(', ').toLowerCase();
    const wasCached = !!cache[key];
    const coords = await geocodeCityState(city, state);
    results.push([key, coords]);
    if (!wasCached) await new Promise((r) => setTimeout(r, 1000));
  }
  return Object.fromEntries(results.filter(([, v]) => v));
}
