import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function RescueDirectoryMap({ rescues }) {
  const withCoords = rescues.filter((r) => r.latitude && r.longitude);
  const center = withCoords.length > 0
    ? [withCoords[0].latitude, withCoords[0].longitude]
    : [39.5, -98.35];

  if (withCoords.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-slate-500 text-lg">No rescues with location data to display on the map.</p>
        <p className="text-slate-400 text-sm mt-1">Rescues need latitude/longitude coordinates set to appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "560px" }}>
      <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {withCoords.map((rescue) => (
          <Marker key={rescue.id} position={[rescue.latitude, rescue.longitude]}>
            <Popup>
              <div className="p-1 min-w-[160px]">
                {rescue.logo_url && (
                  <img src={rescue.logo_url} alt={rescue.name} className="w-full h-20 object-cover rounded mb-2" />
                )}
                <p className="font-bold text-slate-900 text-sm">{rescue.name}</p>
                <p className="text-xs text-slate-500 mb-2">{rescue.address}</p>
                <Link
                  to={`${createPageUrl("RescueProfile")}?email=${rescue.email}`}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View Profile →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}