import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../../store.jsx";
import { stagger, fadeUp, EASE } from "../../motion.jsx";
import SwipeDeck from "../SwipeDeck.jsx";
import Tilt3D from "../Tilt3D.jsx";

export default function Discover() {
  const { listings, data } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const featured = listings.slice(0, 8);
  const rail = listings.slice(2, 9);
  const tags = data.tags.slice(0, 8);

  const submit = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : "/explore");
  };

  return (
    <div className="m-screen m-discover">
      <motion.header
        className="m-greet"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div>
          <p className="m-eyebrow">Phrazs</p>
          <h1>
            Find the perfect <em>backdrop</em>.
          </h1>
        </div>
      </motion.header>

      <form className="m-searchbar" onSubmit={submit}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Studio, rooftop, kitchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" aria-label="Search">→</button>
      </form>

      <section className="m-block">
        <div className="m-block__head">
          <h2>Featured spaces</h2>
          <span className="m-hint">swipe ↔</span>
        </div>
        <SwipeDeck items={featured} onOpen={(it) => navigate(`/listing/${it.id}`)} />
      </section>

      <section className="m-block">
        <div className="m-block__head">
          <h2>Browse by vibe</h2>
        </div>
        <div className="m-chips">
          {tags.map((tag) => (
            <button key={tag} type="button" onClick={() => navigate(`/explore?q=${encodeURIComponent(tag)}`)}>
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="m-block">
        <div className="m-block__head">
          <h2>Categories</h2>
          <button type="button" className="m-textlink" onClick={() => navigate("/explore")}>
            See all →
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

      <section className="m-block">
        <div className="m-block__head">
          <h2>Top rated</h2>
        </div>
        <div className="m-rail">
          {rail.map((item) => (
            <Tilt3D key={item.id} className="m-rail__card" max={10} onClick={() => navigate(`/listing/${item.id}`)}>
              <img className="lift-1" src={item.image} alt={item.title} loading="lazy" />
              <div className="m-rail__body lift-2">
                <strong>{item.title}</strong>
                <span>{item.priceLabel} / hr</span>
              </div>
            </Tilt3D>
          ))}
        </div>
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
