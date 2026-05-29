import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { useStore } from "../store.jsx";
import { mediaByPage } from "../media.js";
import { useBookingUI } from "../booking-ui.jsx";
import { money } from "../utils.js";

const detailPin = (price) =>
  L.divIcon({
    className: "price-marker-wrap",
    html: `<div class="price-marker active cat-default"><span class="pm-price">$${price}</span><span class="pm-stem"></span></div>`,
    iconSize: [64, 36],
    iconAnchor: [32, 36],
  });

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, hosts } = useStore();
  const { openBooking } = useBookingUI();
  const listing = listings.find((l) => l.id === id);

  const gallery = listing ? (mediaByPage[listing.title] || []).filter((u) => !u.includes("400x300")).slice(0, 8) : [];
  const images = listing ? [listing.image, ...gallery].filter((v, i, a) => a.indexOf(v) === i) : [];
  const [active, setActive] = useState(0);

  if (!listing) {
    return (
      <section className="section">
        <h2>Listing not found</h2>
        <p className="muted">That space may have been removed.</p>
        <Link className="primary-button" to="/explore">
          Back to Explore
        </Link>
      </section>
    );
  }

  const host = hosts.find((h) => h.name === listing.host);
  const stats = [
    listing.sqft && ["Sq Footage", listing.sqft.toLocaleString()],
    listing.crew && ["Crew / People", listing.crew],
    listing.hours && ["Hours cap", listing.hours],
    listing.pets && ["Pets", listing.pets],
    listing.checkIn && ["Check-in", listing.checkIn],
    listing.checkOut && ["Check-out", listing.checkOut],
  ].filter(Boolean);

  return (
    <section className="section detail-section">
      <button className="link-back" type="button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-head">
        <div>
          <p className="eyebrow">{listing.category}</p>
          <h1 className="detail-title">{listing.title}</h1>
          <p className="muted">
            {listing.city || "United States"} · {listing.rating ? `★ ${listing.rating.toFixed(1)} (${listing.reviews} reviews)` : "New listing"} · Hosted by {listing.host || "Phrazs host"}
          </p>
        </div>
        <div className="detail-price">
          <strong>{listing.priceLabel}</strong>
          <button className="primary-button" type="button" onClick={() => openBooking(listing)}>
            Book this space
          </button>
        </div>
      </div>

      <div className="gallery">
        <div className="gallery-main">
          <img src={images[active]} alt={listing.title} />
        </div>
        {images.length > 1 && (
          <div className="gallery-thumbs">
            {images.map((src, i) => (
              <button key={src} type="button" className={i === active ? "on" : ""} onClick={() => setActive(i)}>
                <img src={src} alt={`${listing.title} ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <h3>About this space</h3>
          <p>{listing.description}</p>

          <div className="detail-stats">
            {stats.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {listing.amenities?.length > 0 && (
            <>
              <h3>Amenities</h3>
              <ul className="pill-list">
                {listing.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          )}

          {listing.features?.length > 0 && (
            <>
              <h3>Features</h3>
              <ul className="pill-list">
                {listing.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}

          {listing.rules?.length > 0 && (
            <>
              <h3>Space rules</h3>
              <ul className="rule-list">
                {listing.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {listing.tags?.length > 0 && (
            <>
              <h3>Good for</h3>
              <ul className="pill-list">
                {listing.tags.map((t) => (
                  <li key={t}>
                    <Link to={`/explore?q=${encodeURIComponent(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="detail-side">
          <div className="book-card">
            <div className="book-card-price">
              <strong>{money(listing.price)}</strong>
              <span className="muted">/ hour</span>
            </div>
            <button className="primary-button block" type="button" onClick={() => openBooking(listing)}>
              Check availability
            </button>
            <p className="muted small center">Free to request · You won't be charged yet.</p>
          </div>

          {host && (
            <div className="host-mini">
              <img src={host.image} alt={host.name} />
              <div>
                <strong>{host.name}</strong>
                <p className="muted small">Member since {host.memberSince}</p>
                <p className="muted small">{host.rating ? `★ ${host.rating} (${host.reviews})` : "New host"}</p>
              </div>
            </div>
          )}

          {typeof listing.lat === "number" && (
            <div className="detail-map">
              <MapContainer center={[listing.lat, listing.lng]} zoom={13} scrollWheelZoom={false} className="leaflet-map small">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Marker position={[listing.lat, listing.lng]} icon={detailPin(listing.price)} />
              </MapContainer>
              <p className="muted small">{listing.city}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
