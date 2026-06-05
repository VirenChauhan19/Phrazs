import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserAuth } from "../../user-auth.jsx";
import { useAuth } from "../../auth.jsx";
import { useStore } from "../../store.jsx";
import { useSaved } from "../useSaved.js";

const links = [
  { to: "/bookings", label: "My bookings", icon: "🧾" },
  { to: "/saved", label: "Saved spaces", icon: "♥" },
  { to: "/hosts", label: "Meet the hosts", icon: "✦" },
  { to: "/blog", label: "Journal", icon: "✎" },
  { to: "/about", label: "About Phrazs", icon: "◎" },
  { to: "/terms", label: "Terms", icon: "§" },
];

export default function Profile() {
  const userAuth = useUserAuth();
  const { isAdmin, signIn: adminSignIn, signOut: adminSignOut } = useAuth();
  const { userBookingCount } = useStore();
  const { count: savedCount } = useSaved();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const loggedIn = isAdmin || userAuth.isLoggedIn;
  const name = isAdmin ? "Owner" : userAuth.displayName?.split(" ")[0] || "Guest";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        const { needsConfirmation } = await userAuth.signUp(form);
        if (needsConfirmation) {
          setInfo("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
          set({ password: "" });
        }
      } else {
        // One sign-in for everyone: try the guest account, then the owner passcode.
        let userErr = null;
        if (userAuth.enabled) {
          try {
            await userAuth.signIn(form.email, form.password);
            return;
          } catch (err) {
            userErr = err;
          }
        }
        try {
          if (await adminSignIn(form.email, form.password)) return;
        } catch {
          /* not the owner */
        }
        throw userErr || new Error("That email or password is not recognized.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (isAdmin) await adminSignOut();
    else await userAuth.signOut();
    navigate("/");
  };

  return (
    <div className="m-screen m-profile">
      <motion.div
        className="m-profile__hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="m-avatar">{name.charAt(0).toUpperCase()}</div>
        <div>
          <h1>{loggedIn ? `Hi, ${name}` : "Welcome to Phrazs"}</h1>
          <p className="m-sub">
            {loggedIn ? "Manage your trips and saved spaces." : "Sign in to book and track your shoots."}
          </p>
        </div>
      </motion.div>

      <div className="m-profile__stats">
        <Link to="/bookings"><strong>{userBookingCount}</strong><span>Bookings</span></Link>
        <Link to="/saved"><strong>{savedCount}</strong><span>Saved</span></Link>
        <a href="#/explore"><strong>∞</strong><span>To explore</span></a>
      </div>

      {!loggedIn && (
        <form className="m-auth" onSubmit={submit}>
          <div className="m-auth__tabs">
            <button type="button" className={mode === "signin" ? "on" : ""} onClick={() => { setMode("signin"); setError(""); }}>
              Sign in
            </button>
            <button type="button" className={mode === "signup" ? "on" : ""} onClick={() => { setMode("signup"); setError(""); }}>
              Create account
            </button>
          </div>
          {mode === "signup" && (
            <>
              <input type="text" placeholder="Full name" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
              <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => set({ email: e.target.value })} required />
          <input
            type="password"
            placeholder={mode === "signup" ? "At least 6 characters" : "Password"}
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
            minLength={mode === "signup" ? 6 : undefined}
            required
          />
          <button type="submit" className="m-btn m-btn--block m-btn--lg" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          {info && <p className="m-auth__note ok">{info}</p>}
          {error && <p className="m-auth__note err">{error}</p>}
        </form>
      )}

      <nav className="m-menu">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="m-menu__row">
            <span className="m-menu__icon">{l.icon}</span>
            <span>{l.label}</span>
            <span className="m-menu__chev">›</span>
          </Link>
        ))}
        {isAdmin && (
          <Link to="/admin" className="m-menu__row">
            <span className="m-menu__icon">⚙</span>
            <span>Admin dashboard</span>
            <span className="m-menu__chev">›</span>
          </Link>
        )}
      </nav>

      {loggedIn && (
        <button type="button" className="m-btn m-btn--ghost m-btn--block" onClick={signOut}>
          Sign out
        </button>
      )}

      <div className="m-spacer" />
    </div>
  );
}
