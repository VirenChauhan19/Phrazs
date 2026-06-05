import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useStore } from "../../store.jsx";
import { useBookingUI } from "../../booking-ui.jsx";
import { stagger, fadeUp } from "../../motion.jsx";
import { money } from "../../utils.js";
import { useSaved } from "../useSaved.js";

export default function Listing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings } = useStore();
  const { openBooking } = useBookingUI();
  const { isSaved, toggle } = useSaved();
  const reduce = useReducedMotion();
  const ref = useRef(null);

  const item = listings.find((l) => l.id === id);

  // Scroll-driven parallax: the hero image scales/drifts as you scroll up.
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 360], [0, 90]);
  const imgScale = useTransform(scrollY, [0, 360], [1.05, 1.28]);
  const titleY = useTransform(scrollY, [0, 320], [0, -28]);
  const overlay = useTransform(scrollY, [0, 320], [0.25, 0.7]);

  if (!item) {
    return (
      <div className="m-screen m-empty m-empty--full">
        <p>That space could not be found.</p>
        <button type="button" className="m-btn" onClick={() => navigate("/explore")}>
          Back to explore
        </button>
      </div>
    );
  }

  const saved = isSaved(item.id);
  const stats = [
    item.sqft ? { label: "Sq ft", value: item.sqft.toLocaleString() } : null,
    item.crew ? { label: "Max crew", value: item.crew } : null,
    item.hours ? { label: "Hrs / day", value: item.hours } : null,
    { label: "Rating", value: item.rating ? `★ ${item.rating.toFixed(1)}` : "New" },
  ].filter(Boolean);

  return (
    <div className="m-listing" ref={ref}>
      <div className="m-listing__hero">
        <motion.img
          src={item.image}
          alt={item.title}
          style={reduce ? undefined : { y: imgY, scale: imgScale }}
        />
        <motion.span className="m-listing__overlay" style={reduce ? undefined : { opacity: overlay }} aria-hidden="true" />

        <div className="m-listing__heronav">
          <button type="button" className="m-iconbtn m-iconbtn--glass" onClick={() => navigate(-1)} aria-label="Back">
            ‹
          </button>
          <button
            type="button"
            className={`m-iconbtn m-iconbtn--glass ${saved ? "is-saved" : ""}`}
            onClick={() => toggle(item.id)}
            aria-label="Save"
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>

        <motion.div className="m-listing__herotext" style={reduce ? undefined : { y: titleY }}>
          <span className="m-listing__chip">{item.category}</span>
          <h1>{item.title}</h1>
          <p>{item.city || "United States"} · Hosted by {item.host || "Phrazs host"}</p>
        </motion.div>
      </div>

      <div className="m-listing__sheet">
        <motion.ul
          className="m-stats"
          variants={stagger(0.07)}
          initial="hidden"
          animate="show"
        >
          {stats.map((s) => (
            <motion.li key={s.label} variants={fadeUp}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </motion.li>
          ))}
        </motion.ul>

        <section className="m-listing__sec">
          <h2>About this space</h2>
          <p>{item.description}</p>
        </section>

        {item.amenities?.length > 0 && (
          <section className="m-listing__sec">
            <h2>Amenities</h2>
            <div className="m-taglist">
              {item.amenities.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          </section>
        )}

        {item.features?.length > 0 && (
          <section className="m-listing__sec">
            <h2>Features</h2>
            <div className="m-taglist">
              {item.features.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          </section>
        )}

        {item.rules?.length > 0 && (
          <section className="m-listing__sec">
            <h2>House rules</h2>
            <ul className="m-rules">
              {item.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="m-listing__sec m-listing__sec--meta">
          <div><span>Check-in</span><strong>{item.checkIn || "Flexible"}</strong></div>
          <div><span>Check-out</span><strong>{item.checkOut || "Flexible"}</strong></div>
          <div><span>Pets</span><strong>{item.pets || "Ask host"}</strong></div>
        </section>

        <div className="m-spacer m-spacer--lg" />
      </div>

      <div className="m-bookbar">
        <div className="m-bookbar__price">
          <strong>{money(item.price)}</strong>
          <span>/ hour</span>
        </div>
        <button type="button" className="m-btn m-btn--lg" onClick={() => openBooking(item)}>
          Book this space
        </button>
      </div>
    </div>
  );
}
