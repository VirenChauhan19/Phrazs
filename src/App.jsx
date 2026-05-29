import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { BookingUIProvider } from "./booking-ui.jsx";
import Home from "./pages/Home.jsx";
import Explore from "./pages/Explore.jsx";
import ListingDetail from "./pages/ListingDetail.jsx";
import Hosts from "./pages/Hosts.jsx";
import Blog from "./pages/Blog.jsx";
import About from "./pages/About.jsx";
import Admin from "./pages/Admin.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Terms from "./pages/Terms.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname]);
  return null;
}

// Elements that should glide into view as the user scrolls.
const REVEAL_SELECTOR = [
  ".section-heading",
  ".category-tile",
  ".property-card",
  ".host-card",
  ".blog-card",
  ".media-card",
  ".step-list > article",
  ".metric-grid > article",
  ".testimonial-grid > blockquote",
  ".detail-stats > div",
  ".contact-form",
  ".admin-overview > article",
  ".booking-receipt",
].join(",");

function ScrollReveal({ pathname }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let cleanup = null;

    // Let the routed view paint before we measure positions.
    const raf = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
      if (!els.length) return;

      if (prefersReduced || !("IntersectionObserver" in window)) {
        els.forEach((el) => el.classList.add("reveal", "in-view"));
        return;
      }

      // Stagger siblings sharing a parent so grids cascade in.
      const byParent = new Map();
      els.forEach((el) => {
        el.classList.add("reveal");
        const group = byParent.get(el.parentElement) || [];
        group.push(el);
        byParent.set(el.parentElement, group);
      });
      byParent.forEach((group) =>
        group.forEach((el, i) => {
          el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
        })
      );

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach((el) => observer.observe(el));
      cleanup = () => observer.disconnect();
    });

    return () => {
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <BookingUIProvider>
      <ScrollToTop />
      <ScrollReveal pathname={location.pathname} />
      <Header />
      <main>
        <div className="route-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/hosts" element={<Hosts />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/about" element={<About />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </BookingUIProvider>
  );
}
