import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useAuth } from "../auth.jsx";
import { useUserAuth } from "../user-auth.jsx";

const baseTabs = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/hosts", label: "Hosts" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
];

export default function Header() {
  const { data, userBookingCount } = useStore();
  const { isAdmin, signIn: adminSignIn, signOut: adminSignOut } = useAuth();
  const userAuth = useUserAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  // "signin" / "signup" = guest user accounts (Supabase). "admin" = owner passcode.
  const [mode, setMode] = useState(userAuth.enabled ? "signin" : "admin");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const showMyBookings = userAuth.isLoggedIn || (!userAuth.enabled && userBookingCount > 0);
  const tabs = [
    ...baseTabs,
    ...(showMyBookings ? [{ to: "/bookings", label: "My Bookings" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const openAuth = (nextMode) => {
    setMode(nextMode || (userAuth.enabled ? "signin" : "admin"));
    setError("");
    setInfo("");
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setError("");
    setInfo("");
    setBusy(false);
    setForm({ name: "", email: "", phone: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "admin") {
        const ok = await adminSignIn(form.email, form.password);
        if (ok) {
          closeAuth();
          navigate("/admin");
        }
      } else if (mode === "signup") {
        const { needsConfirmation } = await userAuth.signUp(form);
        if (needsConfirmation) {
          setInfo("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
          setForm((f) => ({ ...f, password: "" }));
        } else {
          closeAuth();
          navigate("/profile");
        }
      } else {
        await userAuth.signIn(form.email, form.password);
        closeAuth();
        navigate("/profile");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (isAdmin) await adminSignOut();
    else await userAuth.signOut();
    setMenuOpen(false);
    navigate("/");
  };

  const titles = {
    signin: "Welcome back",
    signup: "Create your account",
    admin: "Owner sign in",
  };
  const subtitles = {
    signin: "Sign in to see your bookings and manage your profile.",
    signup: "Join Phrazs to book spaces and track your trips.",
    admin: "Sign in with the owner credentials to unlock the Admin dashboard.",
  };

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Phrazs home" onClick={() => setMenuOpen(false)}>
        <img src={data.brand.logo} alt="Phrazs" />
      </Link>

      <button className="menu-toggle" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
        ☰
      </button>

      <nav className={`main-nav ${menuOpen ? "open" : ""}`} aria-label="Primary navigation">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `${isActive ? "active" : ""} ${tab.to === "/admin" ? "nav-admin" : ""}`.trim()}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        {isAdmin ? (
          <>
            <span className="user-chip" title="Signed in as owner">
              <span className="user-chip__dot" />
              Owner
            </span>
            <button className="ghost-button" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : userAuth.isLoggedIn ? (
          <>
            <Link className="user-chip user-chip--link" to="/profile" title="View your profile">
              <span className="user-chip__dot" />
              {userAuth.displayName?.split(" ")[0] || "Profile"}
            </Link>
            <button className="ghost-button" type="button" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <button className="ghost-button" type="button" onClick={() => openAuth()}>
            Sign In
          </button>
        )}
        <Link className="primary-button" to="/about">
          List a Property
        </Link>
      </div>

      {authOpen && createPortal(
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}>
          <div className="modal-panel modal-pop">
            <button className="modal-close" type="button" onClick={closeAuth} aria-label="Close">
              ✕
            </button>

            {mode !== "admin" && userAuth.enabled && (
              <div className="auth-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "on" : ""} onClick={() => { setMode("signin"); setError(""); }}>
                  Sign In
                </button>
                <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setError(""); }}>
                  Create Account
                </button>
              </div>
            )}

            <p className="eyebrow">{mode === "admin" ? "Owner Access" : "Phrazs Account"}</p>
            <h2>{titles[mode]}</h2>
            <p className="muted small" style={{ margin: "-6px 0 4px" }}>{subtitles[mode]}</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <label>
                    Full name
                    <input type="text" placeholder="Jordan Cole" value={form.name} onChange={(e) => set({ name: e.target.value })} autoFocus required />
                  </label>
                  <label>
                    Phone (optional)
                    <input type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                  </label>
                </>
              )}
              <label>
                Email
                <input
                  type="email"
                  placeholder={mode === "admin" ? "contact@phrazs.com" : "you@example.com"}
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  autoFocus={mode !== "signup"}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder={mode === "admin" ? "Admin passcode" : mode === "signup" ? "At least 6 characters" : "Your password"}
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  minLength={mode === "admin" ? undefined : 6}
                  required
                />
              </label>
              <button className="primary-button block" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : mode === "signup" ? "Create Account" : "Sign In"}
              </button>
              {info && <p className="form-note" style={{ color: "var(--accent-dark)" }}>{info}</p>}
              {error && <p className="form-note shake">{error}</p>}
            </form>

            {mode !== "admin" ? (
              <p className="form-note muted">
                Owner?{" "}
                <button type="button" className="text-link" onClick={() => { setMode("admin"); setError(""); setInfo(""); }}>
                  Sign in to the dashboard
                </button>
              </p>
            ) : userAuth.enabled ? (
              <p className="form-note muted">
                Not the owner?{" "}
                <button type="button" className="text-link" onClick={() => { setMode("signin"); setError(""); }}>
                  Sign in to your account
                </button>
              </p>
            ) : (
              <p className="form-note muted">Admin credentials are verified by the backend.</p>
            )}
          </div>
        </div>
        ,
        document.body
      )}
    </header>
  );
}
