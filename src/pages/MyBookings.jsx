import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useBookingUI } from "../booking-ui.jsx";
import { useUserAuth } from "../user-auth.jsx";
import { money, prettyDate, shortDate } from "../utils.js";

// Map a Supabase booking row into the shape this page renders.
function fromSupabase(row, email) {
  return {
    id: row.id,
    propertyId: row.listing_id,
    property: row.property,
    host: row.host,
    status: row.status,
    paymentStatus: row.payment_status,
    date: row.date,
    endDate: row.end_date,
    start: row.start_ts || "",
    end: row.end_ts || "",
    days: row.days,
    hours: row.hours,
    crew: row.crew,
    total: row.total,
    schedule: row.schedule,
    notes: row.notes,
    guestEmail: email,
  };
}

export default function MyBookings() {
  const { myBookings: localBookings, listings } = useStore();
  const { showToast } = useBookingUI();
  const { enabled, isLoggedIn, loading, user, listBookings } = useUserAuth();
  const [remoteBookings, setRemoteBookings] = useState([]);
  const [fetching, setFetching] = useState(enabled);

  useEffect(() => {
    let active = true;
    if (enabled && isLoggedIn) {
      setFetching(true);
      listBookings().then((rows) => {
        if (!active) return;
        setRemoteBookings(rows.map((r) => fromSupabase(r, user?.email)));
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
    return () => { active = false; };
  }, [enabled, isLoggedIn, listBookings, user]);

  // When Supabase is on, bookings live on the account. Otherwise fall back to local.
  const myBookings = enabled ? remoteBookings : localBookings;

  // Gate behind login only when accounts are actually available.
  if (enabled && !loading && !isLoggedIn) {
    return (
      <section className="section">
        <p className="eyebrow">Your trips</p>
        <h2>Sign in to see your bookings</h2>
        <p className="lead">Your bookings are saved to your Phrazs account. Use the Sign In button in the top-right to log in or create an account.</p>
        <Link className="primary-button" to="/explore">Explore spaces</Link>
      </section>
    );
  }

  if (enabled && (loading || fetching)) {
    return (
      <section className="section">
        <h2>Loading your bookings…</h2>
      </section>
    );
  }

  if (!myBookings.length) {
    return (
      <section className="section">
        <p className="eyebrow">Your trips</p>
        <h2>My Bookings</h2>
        <p className="lead">You haven't booked a space yet. When you do, your confirmation and details show up right here.</p>
        <div className="empty-state" style={{ display: "grid", gap: 16, justifyItems: "start" }}>
          <p style={{ margin: 0 }}>Browse spaces and book one in a couple of taps.</p>
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
                    <span className="chip">{String(b.id).slice(0, 8)}</span>
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
                    <strong>{multiDay ? `${b.days} days` : `${String(b.start).slice(-5)}-${String(b.end).slice(-5)}`}</strong>
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
                        {shortDate(d.date)} · {d.hours}h{d.start ? ` @ ${d.start}` : ""}
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
                    onClick={() => showToast(`Confirmation for ${String(b.id).slice(0, 8)} was sent to ${b.guestEmail}.`)}
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
