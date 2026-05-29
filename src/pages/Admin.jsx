import { useState, useMemo } from "react";
import { useStore } from "../store.jsx";
import { useAuth } from "../auth.jsx";
import { ADMIN_EMAIL, ADMIN_PASSCODE } from "../data.js";
import { money } from "../utils.js";

const TABS = [
  ["overview", "Dashboard"],
  ["bookings", "Bookings"],
  ["active", "Active Bookings"],
  ["completed", "Completed"],
  ["payments", "Payments"],
  ["payouts", "Payouts"],
  ["calendar", "Calendar"],
  ["users", "Users"],
  ["listings", "Listings"],
  ["hosts", "Hosts"],
  ["media", "Media"],
  ["content", "Pages / Settings"],
  ["inquiries", "Inquiries"],
  ["raw", "Tools / Export"],
];

function Table({ columns, rows }) {
  if (!rows.length) return <p className="empty-state">Nothing here yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((c) => (
                <td key={c.label}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Status = ({ children }) => <span className="status">{children}</span>;

export default function Admin() {
  const store = useStore();
  const { data, media, listings, hosts, bookings, payments, payouts, calendar, users, inquiries, userBookingCount, exportData, resetUserData } = store;
  const { isAdmin, signIn, signOut } = useAuth();

  const [tab, setTab] = useState("overview");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const metrics = useMemo(() => {
    const paidGross = payments.reduce((s, p) => s + (p.gross || 0), 0);
    const active = bookings.filter((b) => ["Active", "Confirmed", "Pending Payment"].includes(b.status)).length;
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const avg = Math.round(listings.reduce((s, l) => s + (l.price || 0), 0) / listings.length);
    return [
      ["Listings", listings.length],
      ["Hosts", hosts.length],
      ["Users", users.length],
      ["Bookings", bookings.length],
      ["Active", active],
      ["Completed", completed],
      ["Gross Revenue", money(paidGross)],
      ["Avg. Rate", money(avg)],
    ];
  }, [payments, bookings, listings, hosts, users]);

  const login = (e) => {
    e.preventDefault();
    if (signIn(email, pass)) {
      setError("");
    } else {
      setError("That email or passcode is not authorized for admin access.");
    }
  };

  const logout = () => {
    signOut();
    setPass("");
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phrazs-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <section className="section admin-section">
        <div className="admin-lock">
          <p className="eyebrow">Owner Only</p>
          <h2>Admin Dashboard</h2>
          <p>
            This tab is separate from the public site. Sign in with the owner email to view listings, hosts, users, bookings, active and completed jobs,
            payments, payouts, calendar, inquiries, media, and export tools.
          </p>
          <form className="admin-login" onSubmit={login}>
            <label>
              Owner email
              <input type="email" placeholder="contact@phrazs.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Admin passcode
              <input type="password" placeholder="Owner passcode" value={pass} onChange={(e) => setPass(e.target.value)} required />
            </label>
            <button className="primary-button" type="submit">
              Unlock Admin
            </button>
            {error && <p className="form-note">{error}</p>}
            <p className="form-note muted">Demo credentials: {ADMIN_EMAIL} / {ADMIN_PASSCODE}</p>
          </form>
        </div>
      </section>
    );
  }

  const activeBookings = bookings.filter((b) => ["Active", "Confirmed", "Pending Payment"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "Completed");

  return (
    <section className="section admin-section">
      <div className="admin-dashboard">
        <div className="wp-adminbar">
          <div className="wp-adminbar__start">
            <span className="wp-logo">P</span>
            <strong>Phrazs</strong>
            <span>Dashboard</span>
            {userBookingCount > 0 && <span className="live-badge">{userBookingCount} new this session</span>}
          </div>
          <div className="wp-adminbar__end">
            <button type="button" onClick={download}>
              Export JSON
            </button>
            <button type="button" onClick={logout}>
              Log Out
            </button>
          </div>
        </div>

        <div className="wp-admin-layout">
          <aside className="wp-sidebar">
            <div className="wp-sidebar__brand">Phrazs Admin</div>
            <div className="admin-tabs" role="tablist">
              {TABS.map(([key, label]) => (
                <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="wp-content">
            <div className="wp-content__header">
              <h2>{TABS.find(([k]) => k === tab)?.[1]}</h2>
            </div>
            <div className="metric-grid">
              {metrics.map(([label, value]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>

            <div className="admin-panel">
              {tab === "overview" && (
                <>
                  <div className="admin-overview">
                    <article>
                      <h3>Booking Statuses</h3>
                      <ul>
                        {data.bookingStructure.statuses.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </article>
                    <article>
                      <h3>Payment Fields</h3>
                      <ul>
                        {data.bookingStructure.paymentFields.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </article>
                    <article>
                      <h3>Calendar Rules</h3>
                      <ul>
                        {data.bookingStructure.calendarRules.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </article>
                  </div>
                  <h3 className="panel-heading">Upcoming Work</h3>
                  <Table
                    rows={bookings.filter((b) => b.status !== "Completed")}
                    columns={[
                      { label: "Booking", render: (b) => (<><strong>{b.id}</strong><small>{b.property}</small></>) },
                      { label: "Guest", render: (b) => (<>{b.guest}<small>{b.guestEmail}</small></>) },
                      { label: "Host", render: (b) => b.host },
                      { label: "Date", render: (b) => (<>{b.date}<small>{b.start} – {b.end}</small></>) },
                      { label: "Status", render: (b) => <Status>{b.status}</Status> },
                      { label: "Payment", render: (b) => <Status>{b.paymentStatus}</Status> },
                      { label: "Total", render: (b) => money(b.total) },
                    ]}
                  />
                </>
              )}

              {tab === "bookings" && (
                <Table
                  rows={bookings}
                  columns={[
                    { label: "Booking", render: (b) => (<><strong>{b.id}</strong><small>{b.property}</small>{b.source === "guest-booking" && <small className="tag-new">NEW</small>}</>) },
                    { label: "Guest", render: (b) => (<>{b.guest}<small>{b.guestEmail}</small></>) },
                    { label: "Host", render: (b) => b.host },
                    { label: "Schedule", render: (b) => (<>{b.start}<small>{b.end}</small></>) },
                    { label: "Crew", render: (b) => b.crew },
                    { label: "Hours", render: (b) => b.hours },
                    { label: "Status", render: (b) => <Status>{b.status}</Status> },
                    { label: "Payment", render: (b) => <Status>{b.paymentStatus}</Status> },
                    { label: "Total", render: (b) => money(b.total) },
                  ]}
                />
              )}

              {tab === "active" && (
                <Table
                  rows={activeBookings}
                  columns={[
                    { label: "Booking", render: (b) => (<><strong>{b.id}</strong><small>{b.property}</small></>) },
                    { label: "Date", render: (b) => b.date },
                    { label: "Status", render: (b) => <Status>{b.status}</Status> },
                    { label: "Payment", render: (b) => <Status>{b.paymentStatus}</Status> },
                    { label: "Guest", render: (b) => b.guest },
                    { label: "Host", render: (b) => b.host },
                    { label: "Host Payout", render: (b) => money(b.hostPayout) },
                    { label: "Total", render: (b) => money(b.total) },
                  ]}
                />
              )}

              {tab === "completed" && (
                <Table
                  rows={completedBookings}
                  columns={[
                    { label: "Booking", render: (b) => (<><strong>{b.id}</strong><small>{b.property}</small></>) },
                    { label: "Completed", render: (b) => b.date },
                    { label: "Guest", render: (b) => b.guest },
                    { label: "Host", render: (b) => b.host },
                    { label: "Payment", render: (b) => <Status>{b.paymentStatus}</Status> },
                    { label: "Platform Fee", render: (b) => money(b.platformFee) },
                    { label: "Host Payout", render: (b) => money(b.hostPayout) },
                    { label: "Total", render: (b) => money(b.total) },
                  ]}
                />
              )}

              {tab === "payments" && (
                <Table
                  rows={payments}
                  columns={[
                    { label: "Payment", render: (p) => (<><strong>{p.id}</strong><small>{p.bookingId}</small></>) },
                    { label: "Processor", render: (p) => p.processor },
                    { label: "Method", render: (p) => (<>{p.method}<small>{p.cardBrand} ending {p.last4}</small></>) },
                    { label: "Gross", render: (p) => money(p.gross) },
                    { label: "Fees", render: (p) => money(p.fees) },
                    { label: "Net", render: (p) => money(p.net) },
                    { label: "Status", render: (p) => <Status>{p.status}</Status> },
                    { label: "Captured", render: (p) => p.capturedAt },
                  ]}
                />
              )}

              {tab === "payouts" && (
                <Table
                  rows={payouts}
                  columns={[
                    { label: "Payout", render: (p) => (<><strong>{p.id}</strong><small>{p.bookingId}</small></>) },
                    { label: "Host", render: (p) => p.host },
                    { label: "Amount", render: (p) => money(p.amount) },
                    { label: "Status", render: (p) => <Status>{p.status}</Status> },
                    { label: "Payout Date", render: (p) => p.payoutDate },
                  ]}
                />
              )}

              {tab === "calendar" && (
                <div className="calendar-grid">
                  {calendar.map((c, i) => (
                    <article className="calendar-card" key={c.bookingId || i}>
                      <span>{c.date}</span>
                      <strong>{c.property}</strong>
                      <p>{c.time}</p>
                      <em>
                        {c.status}
                        {c.bookingId ? ` · ${c.bookingId}` : ""}
                      </em>
                    </article>
                  ))}
                </div>
              )}

              {tab === "users" && (
                <Table
                  rows={users}
                  columns={[
                    { label: "User", render: (u) => (<><strong>{u.name}</strong><small>{u.id}</small></>) },
                    { label: "Email", render: (u) => <a href={`mailto:${u.email}`}>{u.email}</a> },
                    { label: "Role", render: (u) => u.role },
                    { label: "Status", render: (u) => <Status>{u.status}</Status> },
                    { label: "Joined", render: (u) => u.joined },
                    { label: "Bookings", render: (u) => u.bookings },
                    { label: "Lifetime Value", render: (u) => money(u.lifetimeValue) },
                  ]}
                />
              )}

              {tab === "listings" && (
                <Table
                  rows={listings}
                  columns={[
                    { label: "Listing", render: (l) => (<><strong>{l.title}</strong><small>{l.id}</small></>) },
                    { label: "Category", render: (l) => l.category },
                    { label: "City", render: (l) => l.city || "—" },
                    { label: "Price", render: (l) => l.priceLabel },
                    { label: "Space", render: (l) => (l.sqft ? l.sqft.toLocaleString() : "N/A") },
                    { label: "Crew", render: (l) => l.crew || "N/A" },
                    { label: "Host", render: (l) => l.host || "N/A" },
                  ]}
                />
              )}

              {tab === "hosts" && (
                <Table
                  rows={hosts}
                  columns={[
                    { label: "Host", render: (h) => <strong>{h.name}</strong> },
                    { label: "Member Since", render: (h) => h.memberSince },
                    { label: "Rating", render: (h) => (h.rating ? `${h.rating} (${h.reviews})` : "N/A") },
                    { label: "Languages", render: (h) => h.languages.join(", ") || "N/A" },
                    { label: "Services", render: (h) => h.services.join(", ") || "N/A" },
                    { label: "Listings", render: (h) => h.listings },
                  ]}
                />
              )}

              {tab === "media" && (
                <Table
                  rows={media}
                  columns={[
                    { label: "Preview", render: (m) => <img className="table-thumb" src={m.url} alt={m.page} loading="lazy" /> },
                    { label: "Page / Use", render: (m) => <strong>{m.page}</strong> },
                    { label: "Image URL", render: (m) => (<a href={m.url} target="_blank" rel="noreferrer">{m.url}</a>) },
                  ]}
                />
              )}

              {tab === "content" && (
                <div className="content-columns">
                  {[["Booking Structure", data.bookingStructure], ["Brand", data.brand], ["Legal", data.legal], ["Source", data.source]].map(([title, obj]) => (
                    <article key={title}>
                      <h3>{title}</h3>
                      <pre>{JSON.stringify(obj, null, 2)}</pre>
                    </article>
                  ))}
                </div>
              )}

              {tab === "inquiries" && (
                <Table
                  rows={inquiries}
                  columns={[
                    { label: "ID", render: (l) => l.id },
                    { label: "Name", render: (l) => l.name },
                    { label: "Email", render: (l) => <a href={`mailto:${l.email}`}>{l.email}</a> },
                    { label: "Interest", render: (l) => l.interest },
                    { label: "Status", render: (l) => <Status>{l.status}</Status> },
                    { label: "Message", render: (l) => l.message },
                  ]}
                />
              )}

              {tab === "raw" && (
                <div className="tools-panel">
                  <div className="tools-actions">
                    <button className="primary-button" type="button" onClick={download}>
                      Export full dataset (JSON)
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => {
                        if (confirm("Clear all bookings, payments, payouts, and inquiries created in this browser? Seeded data stays.")) resetUserData();
                      }}
                    >
                      Reset session data
                    </button>
                  </div>
                  <pre className="raw-data">{JSON.stringify(exportData(), null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
