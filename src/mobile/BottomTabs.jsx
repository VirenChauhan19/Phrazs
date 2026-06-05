import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSaved } from "./useSaved.js";

const Icon = {
  discover: (
    <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" />
  ),
  explore: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  saved: (
    <path d="M12 20s-7-4.6-9.3-9C1.2 8.3 2.6 5 6 5c2 0 3.2 1.2 4 2.4C10.8 6.2 12 5 14 5c3.4 0 4.8 3.3 3.3 6-2.3 4.4-9.3 9-9.3 9z" />
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
};

const tabs = [
  { to: "/", key: "discover", label: "Discover" },
  { to: "/explore", key: "explore", label: "Explore" },
  { to: "/saved", key: "saved", label: "Saved" },
  { to: "/profile", key: "profile", label: "You" },
];

export default function BottomTabs() {
  const { pathname } = useLocation();
  const { count } = useSaved();

  const activeKey =
    pathname === "/" ? "discover"
    : pathname.startsWith("/explore") || pathname.startsWith("/listing") ? "explore"
    : pathname.startsWith("/saved") ? "saved"
    : pathname.startsWith("/profile") || pathname.startsWith("/bookings") ? "profile"
    : "discover";

  return (
    <nav className="m-tabs" aria-label="Primary">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            className={`m-tab ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <motion.span
              className="m-tab__icon"
              animate={active ? { y: -2, scale: 1 } : { y: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {Icon[tab.key]}
              </svg>
              {tab.key === "saved" && count > 0 && <i className="m-tab__badge">{count}</i>}
            </motion.span>
            <span className="m-tab__label">{tab.label}</span>
            {active && <motion.span layoutId="tab-dot" className="m-tab__dot" transition={{ type: "spring", stiffness: 480, damping: 34 }} />}
          </Link>
        );
      })}
    </nav>
  );
}
