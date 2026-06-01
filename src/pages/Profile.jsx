import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../user-auth.jsx";
import { money, prettyDate } from "../utils.js";

export default function Profile() {
  const { enabled, isLoggedIn, loading, user, profile, displayName, updateProfile, listBookings } = useUserAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    setName(profile?.full_name || "");
    setPhone(profile?.phone || "");
  }, [profile]);

  useEffect(() => {
    let active = true;
    if (isLoggedIn) listBookings().then((rows) => active && setBookings(rows));
    return () => { active = false; };
  }, [isLoggedIn, listBookings]);

  if (!enabled) {
    return (
      <section className="section">
        <p className="eyebrow">Account</p>
        <h2>Profiles aren't available yet</h2>
        <p className="lead">User accounts are still being set up. Check back soon.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="section">
        <h2>Loading your profile…</h2>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="section">
        <p className="eyebrow">Account</p>
        <h2>Sign in to view your profile</h2>
        <p className="lead">Use the Sign In button in the top-right to log in or create an account.</p>
        <Link className="primary-button" to="/explore">Explore spaces</Link>
      </section>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved("");
    try {
      await updateProfile({ full_name: name, phone });
      setSaved("Saved!");
    } catch (err) {
      setSaved(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Hi, {displayName?.split(" ")[0] || "there"} 👋</h2>
        </div>
      </div>

      <div className="profile-grid">
        <form className="profile-card" onSubmit={handleSave}>
          <h3>Your details</h3>
          <label>
            Full name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Phone
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={user?.email || ""} disabled />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <p className="form-note muted">{saved}</p>}
        </form>

        <div className="profile-card">
          <div className="section-heading" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Recent bookings</h3>
            <Link className="text-link" to="/bookings">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="muted small">No bookings yet. <Link className="text-link" to="/explore">Find a space →</Link></p>
          ) : (
            <div className="profile-bookings">
              {bookings.slice(0, 4).map((b) => (
                <div className="profile-booking" key={b.id}>
                  <div>
                    <strong>{b.property}</strong>
                    <span className="muted small">{prettyDate(b.date)}{b.days > 1 ? ` → ${prettyDate(b.end_date)}` : ""}</span>
                  </div>
                  <strong>{money(b.total)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
