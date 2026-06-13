import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { geocodeCityState } from '@/lib/geocode';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ShelterMap({ shelters, pets }) {
  const navigate = useNavigate();
  const [geocoded, setGeocoded] = useState({});

  useEffect(() => {
    const needsGeocode = shelters.filter(s => !(s.latitude && s.longitude));
    Promise.all(
      needsGeocode.map(async (s) => {
        // Try address first, fall back to shelter name (Nominatim handles business names)
        const query = s.address || s.shelter_name;
        const coords = await geocodeCityState(query, '');
        return [s.id, coords];
      })
    ).then(entries => {
      setGeocoded(Object.fromEntries(entries.filter(([, v]) => v)));
    });
  }, [shelters]);

  const sheltersWithCoords = useMemo(() =>
    shelters.map(s => ({
      ...s,
      _lat: s.latitude || geocoded[s.id]?.lat,
      _lng: s.longitude || geocoded[s.id]?.lng,
    })).filter(s => s._lat && s._lng),
  [shelters, geocoded]);

  const getPetCount = (shelterName) =>
    pets.filter(p => p.source === shelterName && p.adoption_status !== 'Adopted' && p.adoption_status !== 'Transferred').length;

  if (sheltersWithCoords.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-100 rounded-xl border text-muted-foreground text-sm">
        No shelters with location data available for map view.
      </div>
    );
  }

  const center = [sheltersWithCoords[0]._lat, sheltersWithCoords[0]._lng];

  return (
    <div className="h-[500px] rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sheltersWithCoords.map((shelter) => (
          <Marker key={shelter.id} position={[shelter._lat, shelter._lng]}>
            <Popup>
              <div className="space-y-1 min-w-[160px]">
                <p className="font-semibold text-sm">{shelter.shelter_name}</p>
                <p className="text-xs text-gray-500">🐾 {getPetCount(shelter.shelter_name)} pets available</p>
                <button
                  onClick={() => navigate(`/ShelterDetail?name=${encodeURIComponent(shelter.shelter_name)}`)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View shelter →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
