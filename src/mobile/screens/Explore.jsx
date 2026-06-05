import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../../store.jsx";
import { useBookingUI } from "../../booking-ui.jsx";
import { stagger, fadeUp } from "../../motion.jsx";
import Tilt3D from "../Tilt3D.jsx";
import { useSaved } from "../useSaved.js";

export default function Explore() {
  const { listings } = useStore();
  const { openBooking } = useBookingUI();
  const navigate = useNavigate();
  const { isSaved, toggle } = useSaved();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "All");

  // Keep local state in sync when arriving from a deep link / category tap.
  useEffect(() => {
    setQuery(params.get("q") || "");
    setCategory(params.get("category") || "All");
  }, [params]);

  const categories = ["All", ...new Set(listings.map((l) => l.category))];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (category !== "All" && l.category !== category) return false;
      if (!q) return true;
      const haystack = [l.title, l.category, l.city, ...(l.tags || [])].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [listings, query, category]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (category !== "All") next.set("category", category);
    setParams(next, { replace: true });
  };

  const pickCategory = (c) => {
    setCategory(c);
    const next = new URLSearchParams(params);
    c === "All" ? next.delete("category") : next.set("category", c);
    setParams(next, { replace: true });
  };

  return (
    <div className="m-screen m-explore">
      <header className="m-explore__head">
        <h1>Explore spaces</h1>
        <form className="m-searchbar" onSubmit={onSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input type="search" placeholder="Search spaces…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" aria-label="Search">→</button>
        </form>
        <div className="m-chips m-chips--scroll">
          {categories.map((c) => (
            <button key={c} type="button" className={c === category ? "is-on" : ""} onClick={() => pickCategory(c)}>
              {c === "All" ? "All" : c}
            </button>
          ))}
        </div>
      </header>

      <p className="m-count">{results.length} {results.length === 1 ? "space" : "spaces"}</p>

      <motion.div
        className="m-grid"
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        key={`${query}-${category}`}
      >
        {results.map((item) => (
          <motion.div key={item.id} variants={fadeUp}>
            <Tilt3D className="m-card" max={11}>
              <div className="m-card__media" onClick={() => navigate(`/listing/${item.id}`)}>
                <img className="lift-1" src={item.image} alt={item.title} loading="lazy" />
                <span className="m-card__price lift-2">{item.priceLabel}/hr</span>
                <button
                  type="button"
                  className={`m-card__heart lift-2 ${isSaved(item.id) ? "is-saved" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(item.id);
                  }}
                  aria-label="Save"
                >
                  {isSaved(item.id) ? "♥" : "♡"}
                </button>
              </div>
              <div className="m-card__body lift-1">
                <div className="m-card__meta">
                  <span>{item.rating ? `★ ${item.rating.toFixed(1)}` : "New"}</span>
                  <span className="m-card__cat">{item.category}</span>
                </div>
                <h3 onClick={() => navigate(`/listing/${item.id}`)}>{item.title}</h3>
                <p>{item.city || "United States"}</p>
                <button type="button" className="m-btn m-btn--block" onClick={() => openBooking(item)}>
                  Book now
                </button>
              </div>
            </Tilt3D>
          </motion.div>
        ))}
      </motion.div>

      {results.length === 0 && (
        <div className="m-empty">
          <p>No spaces match that search.</p>
          <button type="button" className="m-btn" onClick={() => { setQuery(""); pickCategory("All"); }}>
            Clear filters
          </button>
        </div>
      )}

      <div className="m-spacer" />
    </div>
  );
}
