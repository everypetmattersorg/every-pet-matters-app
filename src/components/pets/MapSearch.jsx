import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

export default function MapSearch({ mapFilter = {}, onMapFilterChange }) {
  const [locating, setLocating] = useState(false);

  const handleMapClick = useCallback((latlng) => {
    onMapFilterChange({
      ...mapFilter,
      center: { lat: latlng.lat, lng: latlng.lng },
      active: true
    });
  }, [mapFilter, onMapFilterChange]);

  const handleUseMyLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onMapFilterChange({
          ...mapFilter,
          center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          active: true
        });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleClear = () => {
    onMapFilterChange({ center: null, radiusMiles: 10, active: false });
  };

  const defaultCenter = mapFilter?.center || { lat: 39.8283, lng: -98.5795 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-medium">
            {mapFilter.active
              ? `Searching within ${mapFilter.radiusMiles} mile${mapFilter.radiusMiles !== 1 ? 's' : ''} of selected point`
              : 'Click on the map to set a search location'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="rounded-lg text-xs h-8"
          >
            <Navigation className="w-3 h-3 mr-1" />
            {locating ? 'Locating...' : 'Use My Location'}
          </Button>
          {mapFilter.active && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="rounded-lg text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 320 }}>
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={mapFilter.center ? 10 : 4}
          style={{ width: '100%', height: '100%' }}
          key={mapFilter.center ? `${mapFilter.center.lat}-${mapFilter.center.lng}` : 'default'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {mapFilter.center && (
            <>
              <Marker position={[mapFilter.center.lat, mapFilter.center.lng]} icon={pinIcon} />
              <Circle
                center={[mapFilter.center.lat, mapFilter.center.lng]}
                radius={mapFilter.radiusMiles * 1609.34}
                pathOptions={{ color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.08, weight: 2 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Radius Slider */}
      {mapFilter.active && (
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Search Radius</span>
            <span className="font-semibold text-rose-600">{mapFilter.radiusMiles} miles</span>
          </div>
          <Slider
            min={1}
            max={100}
            step={1}
            value={[mapFilter.radiusMiles]}
            onValueChange={([val]) =>
              onMapFilterChange({ ...mapFilter, radiusMiles: val })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 mi</span>
            <span>50 mi</span>
            <span>100 mi</span>
          </div>
        </div>
      )}
    </div>
  );
}