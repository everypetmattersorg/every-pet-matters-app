import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Navigation } from 'lucide-react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function AlertMapPicker({ lat, lng, radiusMiles, onLocationChange }) {
  const [locating, setLocating] = useState(false);
  const center = lat && lng ? [lat, lng] : [39.8283, -98.5795];

  const handleUseMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {lat && lng ? `📍 Location set` : 'Click the map to set your alert location'}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={handleUseMyLocation} disabled={locating} className="rounded-lg text-xs h-8">
          <Navigation className="w-3 h-3 mr-1" />
          {locating ? 'Locating...' : 'Use My Location'}
        </Button>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 260 }}>
        <MapContainer center={center} zoom={lat && lng ? 9 : 4} style={{ width: '100%', height: '100%' }} key={`${lat}-${lng}`}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={(latlng) => onLocationChange(latlng.lat, latlng.lng)} />
          {lat && lng && (
            <>
              <Marker position={[lat, lng]} />
              <Circle
                center={[lat, lng]}
                radius={radiusMiles * 1609.34}
                pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.08, weight: 2 }}
              />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}