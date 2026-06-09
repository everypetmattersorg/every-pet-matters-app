import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons for Leaflet in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function OrgMapView({ orgs }) {
  const withCoords = orgs.filter(o => o.latitude && o.longitude);
  const center = withCoords.length > 0
    ? [withCoords[0].latitude, withCoords[0].longitude]
    : [39.5, -98.35];
  const zoom = withCoords.length > 0 ? 10 : 4;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 400 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map(org => (
          <Marker key={org.id} position={[org.latitude, org.longitude]}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-slate-800 mb-1">{org.org_name || org.title}</p>
                {org.org_address && <p className="text-xs text-slate-500">{org.org_address}</p>}
                {org.org_city && <p className="text-xs text-slate-500">{org.org_city}, {org.org_state}</p>}
                {org.org_phone && <p className="text-xs text-slate-600 mt-1">📞 {org.org_phone}</p>}
                {org.org_website && (
                  <a href={org.org_website} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 underline mt-1 block">Visit website</a>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(org.org_services || []).map(s => (
                    <span key={s} className="text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}