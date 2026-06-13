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
export async function geocodeAll(pairs) {
  const unique = [...new Map(pairs.map(p => {
    const key = [p.city, p.state].filter(Boolean).join(', ').toLowerCase();
    return [key, p];
  })).values()];

  const results = await Promise.all(
    unique.map(async ({ city, state }) => {
      const coords = await geocodeCityState(city, state);
      const key = [city, state].filter(Boolean).join(', ').toLowerCase();
      return [key, coords];
    })
  );
  return Object.fromEntries(results.filter(([, v]) => v));
}
