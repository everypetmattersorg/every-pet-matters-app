import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function RescueMap({ latitude, longitude, rescueName, address }) {
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-80 bg-slate-100 rounded-2xl flex items-center justify-center">
        <p className="text-slate-500">Location not available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[latitude, longitude]} icon={defaultIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-slate-800">{rescueName}</p>
              {address && <p className="text-slate-600">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}