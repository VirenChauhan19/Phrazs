import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";

const FALLBACK_CENTER = [33.749, -84.388];

function categoryClass(category) {
  const c = (category || "").toLowerCase();
  if (c.includes("commercial")) return "cat-commercial";
  if (c.includes("residential")) return "cat-residential";
  if (c.includes("outdoor")) return "cat-outdoor";
  return "cat-default";
}

function priceIcon(item, active) {
  const rating = item.rating ? `<span class="pm-rate">★ ${item.rating.toFixed(1)}</span>` : "";
  return L.divIcon({
    className: "price-marker-wrap",
    html: `<div class="price-marker ${categoryClass(item.category)} ${active ? "active" : ""}">
        <span class="pm-price">$${item.price}</span>${rating}
        <span class="pm-stem"></span>
      </div>`,
    iconSize: [70, 36],
    iconAnchor: [35, 36],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -34],
  });
}

// Fit all visible pins whenever the filtered set changes.
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
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 13, animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, map]);
  return null;
}

// Gently bring the active pin into view (only moves if it's off-screen).
function FocusActive({ activeId, points }) {
  const map = useMap();
  useEffect(() => {
    if (!activeId) return;
    const p = points.find((x) => x.id === activeId);
    if (!p) return;
    map.panInside([p.lat, p.lng], { padding: [70, 70], animate: true, duration: 0.4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
  return null;
}

export default function MapView({ listings, activeId, onHover }) {
  const navigate = useNavigate();
  const { openBooking } = useBookingUI();
  const [map, setMap] = useState(null);

  const points = listings.filter((l) => typeof l.lat === "number" && typeof l.lng === "number");
  const center = points.length ? [points[0].lat, points[0].lng] : FALLBACK_CENTER;

  const fitAll = useCallback(() => {
    if (!map || !points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 12, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [56, 56], maxZoom: 13, animate: true });
  }, [map, points]);

  return (
    <div className="map-shell">
      <MapContainer
        ref={setMap}
        center={center}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <FitBounds points={points} />
        <FocusActive activeId={activeId} points={points} />
        {points.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={priceIcon(item, item.id === activeId)}
            zIndexOffset={item.id === activeId ? 1000 : 0}
            eventHandlers={{
              mouseover: () => onHover?.(item.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tip">
              <strong>{item.title}</strong>
              <span>{item.priceLabel}</span>
            </Tooltip>
            <Popup autoPan>
              <div className="map-popup">
                <img src={item.image} alt={item.title} />
                <span className={`map-popup-cat ${categoryClass(item.category)}`}>{item.category}</span>
                <strong>{item.title}</strong>
                <span className="muted small">
                  {item.city}
                  {item.sqft ? ` · ${item.sqft.toLocaleString()} sq ft` : ""}
                </span>
                <div className="map-popup-meta">
                  <span className="map-popup-price">{item.priceLabel}</span>
                  {item.rating ? <span className="map-popup-rating">★ {item.rating.toFixed(1)} ({item.reviews || 0})</span> : <span className="muted small">New</span>}
                </div>
                <div className="map-popup-actions">
                  <button type="button" onClick={() => navigate(`/listing/${item.id}`)}>
                    Details
                  </button>
                  <button type="button" className="accent" onClick={() => openBooking(item)}>
                    Book
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {points.length > 0 && (
        <div className="map-badge">
          {points.length} space{points.length === 1 ? "" : "s"} on map
        </div>
      )}

      {map && (
        <div className="map-controls">
          <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>
            −
          </button>
          <button type="button" className="map-controls__fit" aria-label="Fit all spaces" title="Fit all spaces" onClick={fitAll}>
            ⤢
          </button>
        </div>
      )}
    </div>
  );
}
