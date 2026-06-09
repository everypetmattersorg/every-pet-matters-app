import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

async function geocodeLocation(locationStr) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&countrycodes=us,ca,mx&limit=1&format=json`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'PetPawtner/1.0' }
  });
  const data = await res.json();
  if (data?.[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all pets missing coords but having a location
    const allPets = await base44.asServiceRole.entities.Pet.list('-created_date', 10000);
    const petsToGeocode = allPets.filter(p => p.location && (!p._lat || !p._lng));

    // Deduplicate locations
    const locationMap = {};
    for (const pet of petsToGeocode) {
      const key = pet.location.trim().toLowerCase();
      if (!locationMap[key]) locationMap[key] = [];
      locationMap[key].push(pet.id);
    }

    const uniqueLocations = Object.keys(locationMap);
    let updated = 0;

    for (const locKey of uniqueLocations) {
      const originalLocation = petsToGeocode.find(
        p => p.location.trim().toLowerCase() === locKey
      )?.location;

      if (!originalLocation) continue;

      const coords = await geocodeLocation(originalLocation);

      if (coords) {
        // Update all pets at this location
        for (const petId of locationMap[locKey]) {
          await base44.asServiceRole.entities.Pet.update(petId, {
            _lat: coords.lat,
            _lng: coords.lng
          });
          updated++;
        }
      }

      // Respect Nominatim rate limit: 1 request/sec
      await new Promise(r => setTimeout(r, 1100));
    }

    return Response.json({
      success: true,
      locationsProcessed: uniqueLocations.length,
      petsUpdated: updated
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});