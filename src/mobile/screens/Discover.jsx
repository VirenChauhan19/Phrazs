import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../../store.jsx";
import { stagger, fadeUp, EASE } from "../../motion.jsx";
import { useSaved } from "../useSaved.js";
import Tilt3D from "../Tilt3D.jsx";

const HEART = (saved) => (saved ? "♥" : "♡");

export default function Discover() {
  const { listings, data } = useStore();
  const navigate = useNavigate();
  const { isSaved, toggle } = useSaved();
  const [query, setQuery] = useState("");

  const hero = listings[0];
  const quickTags = data.tags.slice(0, 10);

  // Rails are built from real data (tags + location). Only rails with enough
  // listings render, so the home never shows an empty or broken section.
  const rails = useMemo(() => {
    const byTag = (...tags) => {
      const seen = new Set();
      const out = [];
      for (const item of listings) {
        if (item.id === hero?.id) continue;
        if (tags.some((t) => item.tags?.includes(t)) && !seen.has(item.id)) {
          seen.add(item.id);
          out.push(item);
        }
      }
      return out;
    };
    const candidates = [
      { key: "near", title: "Near Atlanta", items: listings.filter((l) => (l.city || "").includes("Atlanta") && l.id !== hero?.id) },
      { key: "studios", title: "Photo & film studios", items: byTag("Photo Studios", "Studio Shoot", "Film Shoot") },
      { key: "podcast", title: "Podcast & interviews", items: byTag("Podcast", "Interview Shoot") },
      { key: "rooftop", title: "Rooftops & views", items: byTag("Rooftop") },
      { key: "events", title: "Events & gatherings", items: byTag("Wedding Halls", "Birthday Party", "Backyard") },
    ];
    return candidates
      .map((r) => ({ ...r, items: r.items.slice(0, 8) }))
      .filter((r) => r.items.length >= 2);
  }, [listings, hero?.id]);

  const submit = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : "/explore");
  };

  const openSaved = (e, id) => {
    e.stopPropagation();
    toggle(id);
  };

  return (
    <div className="m-screen m-discover m-home2">
      {hero && (
        <motion.section
          className="m-hero2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <img className="m-hero2__img" src={hero.image} alt={hero.title} />
          <span className="m-hero2__veil" aria-hidden="true" />

          <div className="m-hero2__top">
            <span className="m-hero2__brand">
              <span className="m-hero2__mark">P</span>
              Phrazs
            </span>
            <button type="button" className="m-hero2__explore" onClick={() => navigate("/explore")}>
              Explore
            </button>
          </div>

          <button
            type="button"
            className="m-hero2__feature"
            onClick={() => navigate(`/listing/${hero.id}`)}
            aria-label={`Open ${hero.title}`}
          >
            <span className="m-hero2__tag">Featured space</span>
            <strong>{hero.title}</strong>
            <span className="m-hero2__meta">
              {hero.city || "Atlanta, GA"} · <em>{hero.priceLabel}/hr</em>
            </span>
          </button>
        </motion.section>
      )}

      <form className="m-searchbar m-searchbar--float" onSubmit={submit}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search studios, rooftops, kitchens"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" aria-label="Search">Go</button>
      </form>

      <section className="m-block m-block--tight">
        <div className="m-block__head">
          <h2>Browse by vibe</h2>
        </div>
        <div className="m-chips m-chips--scroll">
          {quickTags.map((tag) => (
            <button key={tag} type="button" onClick={() => navigate(`/explore?q=${encodeURIComponent(tag)}`)}>
              {tag}
            </button>
          ))}
        </div>
      </section>

      {rails.map((rail) => (
        <section className="m-block" key={rail.key}>
          <div className="m-block__head">
            <h2>{rail.title}</h2>
            <button type="button" className="m-textlink" onClick={() => navigate("/explore")}>
              See all
            </button>
          </div>
          <div className="m-rail">
            {rail.items.map((it) => {
              const saved = isSaved(it.id);
              return (
                <div
                  key={it.id}
                  className="m-rail__card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/listing/${it.id}`)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/listing/${it.id}`)}
                >
                  <div className="m-rail__media">
                    <img src={it.image} alt={it.title} loading="lazy" />
                    <button
                      type="button"
                      className={`m-rail__heart ${saved ? "is-saved" : ""}`}
                      onClick={(e) => openSaved(e, it.id)}
                      aria-label={saved ? "Remove from saved" : "Save space"}
                    >
                      {HEART(saved)}
                    </button>
                  </div>
                  <div className="m-rail__body">
                    <strong>{it.title}</strong>
                    <span className="m-rail__loc">{it.city || "Atlanta, GA"}</span>
                    <span className="m-rail__price">{it.priceLabel} <em>/hr</em></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="m-block">
        <div className="m-block__head">
          <h2>Categories</h2>
          <button type="button" className="m-textlink" onClick={() => navigate("/explore")}>
            See all
          </button>
        </div>
        <motion.div
          className="m-cat-grid"
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {data.categories.map((cat) => (
            <motion.button
              key={cat.name}
              type="button"
              className="m-cat"
              variants={fadeUp}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/explore?category=${encodeURIComponent(cat.name)}`)}
            >
              <img src={cat.image} alt={cat.name} loading="lazy" />
              <span className="m-cat__veil" />
              <span className="m-cat__label">{cat.name}</span>
            </motion.button>
          ))}
        </motion.div>
      </section>

      <section className="m-cta">
        <Tilt3D className="m-cta__card" max={8}>
          <p className="m-eyebrow lift-1">List with Phrazs</p>
          <h2 className="lift-2">Turn your space into a set.</h2>
          <p className="lift-1">Earn by the hour hosting shoots, films, and events.</p>
          <button type="button" className="m-btn m-btn--light lift-2" onClick={() => navigate("/about")}>
            Become a host
          </button>
        </Tilt3D>
      </section>

      <div className="m-spacer" />
    </div>
  );
}
