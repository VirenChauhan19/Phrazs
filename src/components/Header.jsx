import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { useAuth } from "../auth.jsx";

const baseTabs = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/hosts", label: "Hosts" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
];

export default function Header() {
  const { data } = useStore();
  const { isAdmin, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tabs = isAdmin ? [...baseTabs, { to: "/admin", label: "Admin" }] : baseTabs;

  const closeAuth = () => {
    setAuthOpen(false);
    setError("");
    setBusy(false);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    // tiny delay so the button's loading state is perceptible
    setTimeout(() => {
      const ok = signIn(email, pass);
      if (ok) {
        setPass("");
        closeAuth();
        navigate("/admin");
      } else {
        setError("Those credentials are not authorized. Use your owner email and admin passcode.");
        setBusy(false);
      }
    }, 320);
  };

  const handleSignOut = () => {
    signOut();
    setMenuOpen(false);
    navigate("/");
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
        ) : (
          <button className="ghost-button" type="button" onClick={() => setAuthOpen(true)}>
            Sign In
          </button>
        )}
        <Link className="primary-button" to="/about">
          List a Property
        </Link>
      </div>

      {authOpen && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && closeAuth()}>
          <div className="modal-panel modal-pop">
            <button className="modal-close" type="button" onClick={closeAuth} aria-label="Close">
              ✕
            </button>
            <p className="eyebrow">Owner Access</p>
            <h2>Sign In</h2>
            <p className="muted small" style={{ margin: "-6px 0 4px" }}>
              Sign in with the owner credentials to unlock the Admin dashboard.
            </p>
            <form className="auth-form" onSubmit={handleSignIn}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="contact@phrazs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Admin passcode"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </label>
              <button className="primary-button block" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : "Sign In"}
              </button>
              {error && <p className="form-note shake">{error}</p>}
            </form>
            <p className="form-note muted">Demo credentials live on the Admin lock screen.</p>
          </div>
        </div>
      )}
    </header>
  );
}
