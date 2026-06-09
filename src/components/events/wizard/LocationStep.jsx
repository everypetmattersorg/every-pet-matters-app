import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LocationStep({ formData, onUpdate }) {
  const [searching, setSearching] = useState(false);

  const geocodeAddress = async (address) => {
    if (!address || address.length < 5) return;

    try {
      setSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        onUpdate("latitude", parseFloat(lat));
        onUpdate("longitude", parseFloat(lon));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleLocationChange = (e) => {
    const address = e.target.value;
    onUpdate("location", address);
    if (address.length > 5) {
      geocodeAddress(address);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Event Location</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Address *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="e.g., 123 Main St, Springfield, IL 62701"
            value={formData.location}
            onChange={handleLocationChange}
            className="pl-10 py-2"
          />
          {searching && <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin text-blue-500" />}
        </div>
        <p className="text-xs text-slate-500 mt-1">Enter a street address for automatic location mapping</p>
      </div>

      {formData.latitude && formData.longitude && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium">✓ Location Pinned</p>
          <p className="text-xs text-blue-700 mt-1">
            Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}