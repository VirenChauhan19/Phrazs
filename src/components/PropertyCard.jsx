import { Link } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";

export default function PropertyCard({ item }) {
  const { openBooking } = useBookingUI();

  const stats = [
    item.sqft ? `Sq Footage: ${item.sqft.toLocaleString()}` : "",
    item.crew ? `Crew/People: ${item.crew}` : "",
    item.hours ? `Hours cap: ${item.hours}` : "",
    item.pets ? `Pets: ${item.pets}` : "",
  ].filter(Boolean);

  return (
    <article className="property-card">
      <Link className="property-media" to={`/listing/${item.id}`}>
        <img src={item.image} alt={item.title} loading="lazy" />
        <span className="property-price-tag">{item.priceLabel}</span>
      </Link>
      <div className="property-body">
        <div className="card-meta">
          {item.rating ? <span className="rating">★ {item.rating.toFixed(1)} ({item.reviews || 0})</span> : <span className="rating quiet">New</span>}
          <span>{item.category}</span>
        </div>
        <h3>
          <Link to={`/listing/${item.id}`}>{item.title}</Link>
        </h3>
        <p className="date">{item.city || "United States"} · Added {item.added}</p>
        <ul>
          {stats.map((stat) => (
            <li key={stat}>{stat}</li>
          ))}
        </ul>
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
    </article>
  );
}
