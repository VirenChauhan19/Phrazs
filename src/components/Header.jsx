import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useStore } from "../store.jsx";

const tabs = [
  { to: "/", label: "Home", end: true },
  { to: "/explore", label: "Explore" },
  { to: "/hosts", label: "Hosts" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/admin", label: "Admin" },
];

export default function Header() {
  const { data } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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
          <NavLink key={tab.to} to={tab.to} end={tab.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <button className="ghost-button" type="button" onClick={() => setAuthOpen(true)}>
          Sign In
        </button>
        <Link className="primary-button" to="/about">
          List a Property
        </Link>
      </div>

      {authOpen && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setAuthOpen(false)}>
          <div className="modal-panel">
            <button className="modal-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Close">
              ✕
            </button>
            <h2>Sign In</h2>
            <label>
              Username or Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input type="password" placeholder="Password" />
            </label>
            <button className="primary-button" type="button" onClick={() => setAuthOpen(false)}>
              Sign In
            </button>
            <p className="form-note">Guest sign-in is a front-end placeholder. Owner access lives in the Admin tab.</p>
          </div>
        </div>
      )}
    </header>
  );
}
