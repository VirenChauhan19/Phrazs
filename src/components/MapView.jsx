import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";

function priceIcon(label, active) {
  return L.divIcon({
    className: "price-marker-wrap",
    html: `<div class="price-marker ${active ? "active" : ""}">${label}</div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });
}

// Pan/zoom the map to fit all visible pins whenever the filtered set changes.
function FitBounds({ points }) {
  const map = useMap();
  const signature = points.map((p) => p.id).join("|");
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, map]);
  return null;
}

export default function MapView({ listings, activeId, onHover }) {
  const navigate = useNavigate();
  const { openBooking } = useBookingUI();
  const points = listings.filter((l) => typeof l.lat === "number" && typeof l.lng === "number");
  const center = points.length ? [points[0].lat, points[0].lng] : [33.749, -84.388];

  return (
    <div className="map-shell">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={priceIcon(`$${item.price}`, item.id === activeId)}
            eventHandlers={{
              mouseover: () => onHover?.(item.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Popup>
              <div className="map-popup">
                <img src={item.image} alt={item.title} />
                <strong>{item.title}</strong>
                <span className="muted small">{item.city} · {item.priceLabel}</span>
                <div className="map-popup-actions">
                  <button type="button" onClick={() => navigate(`/listing/${item.id}`)}>Details</button>
                  <button type="button" className="accent" onClick={() => openBooking(item)}>Book</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
