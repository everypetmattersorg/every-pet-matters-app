import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

export default function AdoptablePetsMap({ pets = [], onPetSelect }) {
  // Group pets by city/state, using _lat/_lng coords
  const markers = useMemo(() => {
    const groups = {};
    for (const pet of pets) {
      if (!pet._lat || !pet._lng) continue;
      const city = pet.rescue_city || pet.location || 'Unknown';
      const state = pet.rescue_state || '';
      const key = `${city}, ${state}`.trim().toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          lat: pet._lat,
          lng: pet._lng,
          label: state ? `${city}, ${state}` : city,
          pets: []
        };
      }
      groups[key].pets.push(pet);
    }
    return Object.values(groups);
  }, [pets]);

  const maxCount = useMemo(() => Math.max(...markers.map((m) => m.pets.length), 1), [markers]);
  const petsWithCoords = useMemo(() => pets.filter(p => p._lat && p._lng).length, [pets]);

  if (markers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-2 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm">No location data available</p>
          <p className="text-xs text-slate-400">Pets need coordinates populated to appear on the map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Pets by Location</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Mapped by rescue organization city/state</p>
        </div>
        <span className="text-sm font-semibold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
          {petsWithCoords} of {pets.length} mapped
        </span>
      </div>
      <MapContainer
        center={[38, -96]}
        zoom={4}
        style={{ height: '480px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ label, pets: locationPets, lat, lng }) => {
          const radius = 8 + Math.round((locationPets.length / maxCount) * 22);
          return (
            <CircleMarker
              key={`${lat},${lng}`}
              center={[lat, lng]}
              radius={radius}
              pathOptions={{
                fillColor: '#b1511d',
                fillOpacity: 0.75,
                color: '#fff',
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-slate-600 mt-1">{locationPets.length} pet{locationPets.length !== 1 ? 's' : ''}</div>
                <div className="mt-1 flex flex-wrap gap-1 max-w-[180px]">
                  {locationPets.slice(0, 5).map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => onPetSelect(pet)}
                      className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded hover:bg-orange-200 transition"
                    >
                      {pet.name}
                    </button>
                  ))}
                  {locationPets.length > 5 && (
                    <span className="text-xs text-slate-500">+{locationPets.length - 5} more</span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}