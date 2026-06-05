import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE } from "../motion.jsx";
import BottomTabs from "./BottomTabs.jsx";

import Discover from "./screens/Discover.jsx";
import Explore from "./screens/Explore.jsx";
import Listing from "./screens/Listing.jsx";
import Saved from "./screens/Saved.jsx";
import Profile from "./screens/Profile.jsx";

// Existing pages reused for secondary routes so nothing in the app breaks.
import MyBookings from "../pages/MyBookings.jsx";
import CheckoutSuccess from "../pages/CheckoutSuccess.jsx";
import About from "../pages/About.jsx";
import Hosts from "../pages/Hosts.jsx";
import Blog from "../pages/Blog.jsx";
import Terms from "../pages/Terms.jsx";
import Admin from "../pages/Admin.jsx";

const pageVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97, rotateX: 9 },
  enter: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, y: -16, scale: 0.97, rotateX: -6, transition: { duration: 0.28, ease: EASE } },
};

// Immersive screens (listing) own position:fixed chrome, so their page wrapper
// must stay transform-free — animate opacity only to avoid trapping fixed kids.
const fadeVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: EASE } },
};

// Lightweight chrome for reused desktop pages: a frosted back bar + scroll area.
function LegacyPage({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="m-legacy">
      <div className="m-topbar">
        <button type="button" className="m-iconbtn" onClick={() => navigate(-1)} aria-label="Back">
          ‹
        </button>
        <span className="m-topbar__title">{title}</span>
        <Link to="/" className="m-iconbtn" aria-label="Home">
          ⌂
        </Link>
      </div>
      <div className="m-legacy__body">{children}</div>
    </div>
  );
}

export default function MobileApp() {
  const location = useLocation();
  const reduce = useReducedMotion();

  // Keep each route at the top when it mounts.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  const isFull = location.pathname.startsWith("/listing/"); // immersive screens hide the tab bar

  return (
    <div className={`mobile-shell ${isFull ? "is-full" : ""}`}>
      <div className="m-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="m-page"
            variants={reduce ? undefined : isFull ? fadeVariants : pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Routes location={location}>
              <Route path="/" element={<Discover />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/listing/:id" element={<Listing />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bookings" element={<LegacyPage title="My Bookings"><MyBookings /></LegacyPage>} />
              <Route path="/checkout-success" element={<LegacyPage title="Confirmation"><CheckoutSuccess /></LegacyPage>} />
              <Route path="/about" element={<LegacyPage title="About"><About /></LegacyPage>} />
              <Route path="/hosts" element={<LegacyPage title="Hosts"><Hosts /></LegacyPage>} />
              <Route path="/blog" element={<LegacyPage title="Blog"><Blog /></LegacyPage>} />
              <Route path="/terms" element={<LegacyPage title="Terms"><Terms /></LegacyPage>} />
              <Route path="/admin" element={<LegacyPage title="Admin"><Admin /></LegacyPage>} />
              <Route path="*" element={<Discover />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {!isFull && <BottomTabs />}
    </div>
  );
}
