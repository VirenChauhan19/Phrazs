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
  const spotlight = featured[1] || featured[0];
  const tags = data.tags.slice(0, 8);
  const quickTags = ["Music Video", "Podcast", "Photo Studios", "Rooftop"].filter((tag) =>
    data.tags.includes(tag)
  );
  const avgPrice = Math.round(
    listings.reduce((sum, item) => sum + (Number(item.price) || 0), 0) / Math.max(listings.length, 1)
  );

  const submit = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : "/explore");
  };

  return (
    <div className="m-screen m-discover">
      <motion.header
        className="m-home-head"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="m-home-brand">
          <span className="m-home-brand__mark">P</span>
          <div>
            <strong>Phrazs</strong>
            <span>Atlanta and beyond</span>
          </div>
        </div>
        <button type="button" className="m-home-head__action" onClick={() => navigate("/explore")}>Map</button>
      </motion.header>

      <motion.section
        className="m-home-hero"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.64, ease: EASE, delay: 0.06 }}
      >
        <div className="m-home-hero__copy">
          <p className="m-eyebrow">Creative locations</p>
          <h1>
            Book a space that already feels like a <em>scene</em>.
          </h1>
          <p>Studios, homes, rooftops, and ready-to-shoot rooms for your next production.</p>
        </div>

        {spotlight && (
          <button
            type="button"
            className="m-spotlight"
            onClick={() => navigate(`/listing/${spotlight.id}`)}
            aria-label={`Open ${spotlight.title}`}
          >
            <img src={spotlight.image} alt={spotlight.title} />
            <span className="m-spotlight__veil" />
            <span className="m-spotlight__body">
              <span>{spotlight.category}</span>
              <strong>{spotlight.title}</strong>
              <em>{spotlight.priceLabel}</em>
            </span>
          </button>
        )}

        <div className="m-home-stats" aria-label="Marketplace highlights">
          <span>
            <strong>{listings.length}</strong>
            spaces
          </span>
          <span>
            <strong>{data.categories.length}</strong>
            vibes
          </span>
          <span>
            <strong>${avgPrice}</strong>
            avg
          </span>
        </div>
      </motion.section>

      <form className="m-searchbar m-searchbar--home" onSubmit={submit}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Studio, rooftop, kitchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" aria-label="Search">Go</button>
      </form>

      <div className="m-quickrail" aria-label="Popular searches">
        {quickTags.map((tag) => (
          <button key={tag} type="button" onClick={() => navigate(`/explore?q=${encodeURIComponent(tag)}`)}>
            {tag}
          </button>
        ))}
      </div>

      <section className="m-block">
        <div className="m-block__head">
          <h2>Today's edit</h2>
          <span className="m-hint">swipe</span>
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
