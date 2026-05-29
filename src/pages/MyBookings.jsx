import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useBookingUI } from "../booking-ui.jsx";
import { money, prettyDate, shortDate } from "../utils.js";

export default function MyBookings() {
  const { myBookings, listings } = useStore();
  const { showToast } = useBookingUI();

  if (!myBookings.length) {
    return (
      <section className="section">
        <p className="eyebrow">Your trips</p>
        <h2>My Bookings</h2>
        <p className="lead">You haven't booked a space yet. When you do, your confirmation and details show up right here.</p>
        <div className="empty-state" style={{ display: "grid", gap: 16, justifyItems: "start" }}>
          <p style={{ margin: 0 }}>Browse spaces and book one in a couple of taps — no account required.</p>
          <Link className="primary-button" to="/explore">
            Explore spaces
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your trips</p>
          <h2>My Bookings</h2>
        </div>
        <p className="results-count" style={{ margin: 0 }}>
          {myBookings.length} {myBookings.length === 1 ? "booking" : "bookings"}
        </p>
      </div>

      <div className="booking-list">
        {myBookings.map((b) => {
          const listing = listings.find((l) => l.id === b.propertyId);
          const multiDay = b.days > 1;
          return (
            <article className="booking-receipt" key={b.id}>
              {listing && (
                <Link to={`/listing/${b.propertyId}`} className="booking-receipt__media">
                  <img src={listing.image} alt={b.property} loading="lazy" />
                </Link>
              )}
              <div className="booking-receipt__body">
                <div className="booking-receipt__head">
                  <div>
                    <span className="chip">{b.id}</span>
                    <h3>{b.property}</h3>
                    <p className="muted small">Hosted by {b.host}</p>
                  </div>
                  <div className="booking-receipt__status">
                    <span className="status">{b.status}</span>
                    <span className="status paid">{b.paymentStatus}</span>
                  </div>
                </div>

                <div className="booking-receipt__facts">
                  <div>
                    <span>{multiDay ? "Dates" : "Date"}</span>
                    <strong>{multiDay ? `${prettyDate(b.date)} → ${prettyDate(b.endDate)}` : prettyDate(b.date)}</strong>
                  </div>
                  <div>
                    <span>{multiDay ? "Days" : "Time"}</span>
                    <strong>{multiDay ? `${b.days} days` : `${b.start.slice(-5)}–${b.end.slice(-5)}`}</strong>
                  </div>
                  <div>
                    <span>{multiDay ? "Total hrs" : "Hours"}</span>
                    <strong>{b.hours}</strong>
                  </div>
                  <div>
                    <span>Crew</span>
                    <strong>{b.crew}</strong>
                  </div>
                  <div>
                    <span>Total paid</span>
                    <strong>{money(b.total)}</strong>
                  </div>
                </div>

                {multiDay && Array.isArray(b.schedule) && (
                  <div className="schedule-chips">
                    {b.schedule.map((d) => (
                      <span className="chip" key={d.date}>
                        {shortDate(d.date)} · {d.hours}h
                      </span>
                    ))}
                  </div>
                )}

                {b.notes && <p className="muted small booking-receipt__notes">“{b.notes}”</p>}

                <div className="booking-receipt__actions">
                  <Link className="ghost-button" to={`/listing/${b.propertyId}`}>
                    View space
                  </Link>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => showToast(`Confirmation for ${b.id} was sent to ${b.guestEmail}.`)}
                  >
                    Resend confirmation
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
