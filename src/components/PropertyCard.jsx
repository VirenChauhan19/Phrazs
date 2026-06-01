import { Link } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";
import { motion, fadeUp } from "../motion.jsx";

export default function PropertyCard({ item }) {
  const { openBooking } = useBookingUI();

  const stats = [
    item.sqft ? { label: "Sq ft", value: item.sqft.toLocaleString() } : null,
    item.crew ? { label: "Crew", value: item.crew } : null,
    item.hours ? { label: "Hrs/day", value: item.hours } : null,
  ].filter(Boolean);

  return (
    <motion.article
      className="property-card"
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <Link className="property-media" to={`/listing/${item.id}`}>
        <img src={item.image} alt={item.title} loading="lazy" />
        <span className="property-price-tag">{item.priceLabel}</span>
        <span className="property-media__veil" aria-hidden="true" />
        <span className="property-media__cta" aria-hidden="true">View space →</span>
      </Link>
      <div className="property-body">
        <div className="card-meta">
          {item.rating ? (
            <span className="rating">★ {item.rating.toFixed(1)} <em>({item.reviews || 0})</em></span>
          ) : (
            <span className="rating quiet">New</span>
          )}
          <span className="card-cat">{item.category}</span>
        </div>
        <h3>
          <Link to={`/listing/${item.id}`}>{item.title}</Link>
        </h3>
        <p className="date">{item.city || "United States"}</p>
        {stats.length > 0 && (
          <ul className="card-stats">
            {stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="property-footer">
          <strong>{item.priceLabel}</strong>
          <div className="card-actions">
            <Link className="text-link" to={`/listing/${item.id}`}>
              Details
            </Link>
            <button className="primary-button small" type="button" onClick={() => openBooking(item)}>
              Book
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
