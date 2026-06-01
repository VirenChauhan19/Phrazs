import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import { motion, Reveal, RevealGroup, fadeUp, fade, EASE } from "../motion.jsx";

export default function Home() {
  const { data, listings } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(listings.map((l) => l.category))];
  const featured = listings.slice(0, 6);

  const runSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "All") params.set("category", category);
    navigate(`/explore?${params.toString()}`);
  };

  const steps = [
    { n: "01", title: "Find a space", text: "Browse curated locations that bring your shoot to life." },
    { n: "02", title: "Check the vibe", text: "Real photos, honest reviews, and the details that matter." },
    { n: "03", title: "Book by the hour", text: "Lock your dates, pay securely, and start creating." },
  ];

  const stats = [
    { value: `${listings.length}+`, label: "Curated spaces" },
    { value: "4.9", label: "Avg. rating" },
    { value: "1hr", label: "Min. booking" },
    { value: "15%", label: "Flat service fee" },
  ];

  const headline = ["Find", "the", "perfect", "backdrop"];

  return (
    <>
      <section className="hero" style={{ "--hero": `url(${data.brand.heroImage})` }}>
        <motion.div
          className="hero-media"
          aria-hidden="true"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
        />
        <div className="hero-content">
          <motion.p className="eyebrow" variants={fade} initial="hidden" animate="show">
            Phrazs · the marketplace for shoots
          </motion.p>
          <h1 className="hero-title" aria-label="Find the perfect backdrop for your story">
            {headline.map((word, i) => (
              <motion.span
                key={word + i}
                className={word === "backdrop" ? "accent-word" : ""}
                initial={{ y: "110%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.08 }}
              >
                {word === "backdrop" ? <em>{word}</em> : word}{" "}
              </motion.span>
            ))}
            <motion.span
              className="hero-title__tail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
            >
              for your story.
            </motion.span>
          </h1>
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          >
            Unique, camera-ready locations for photo shoots, films, events, and creative projects — booked by the hour.
          </motion.p>

          <motion.form
            className="search-panel"
            onSubmit={runSearch}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
          >
            <label>
              <span>Keywords</span>
              <input type="search" placeholder="Kitchen, studio, rooftop…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              Search spaces
            </button>
          </motion.form>

          <motion.div
            className="quick-tags"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <span className="quick-tags__label">Popular:</span>
            {data.tags.slice(0, 6).map((tag) => (
              <button key={tag} type="button" onClick={() => navigate(`/explore?q=${encodeURIComponent(tag)}`)}>
                {tag}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="hero-stats"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 1 } } }}
          initial="hidden"
          animate="show"
        >
          {stats.map((s) => (
            <motion.div key={s.label} className="hero-stat" variants={fadeUp}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Top categories</p>
            <h2>Explore the most popular sets.</h2>
          </div>
          <Link className="text-link" to="/explore">
            View all spaces →
          </Link>
        </Reveal>
        <RevealGroup className="category-grid">
          {data.categories.map((cat) => (
            <motion.article
              key={cat.name}
              className="category-tile"
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={() => navigate(`/explore?category=${encodeURIComponent(cat.name)}`)}
            >
              <img src={cat.image} alt={cat.name} />
              <div>
                <span>{cat.count} listings</span>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </div>
            </motion.article>
          ))}
        </RevealGroup>
      </section>

      <section className="steps-band">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2>Your perfect space is three steps away.</h2>
        </Reveal>
        <RevealGroup className="step-list" gap={0.12}>
          {steps.map((s) => (
            <motion.article key={s.n} variants={fadeUp}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.article>
          ))}
        </RevealGroup>
      </section>

      <section className="section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">Top properties</p>
            <h2>Popular, top-rated spaces.</h2>
          </div>
          <Link className="text-link" to="/explore">
            See the map →
          </Link>
        </Reveal>
        <RevealGroup className="property-grid">
          {featured.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </RevealGroup>
      </section>

      <section className="testimonial-band">
        <Reveal>
          <p className="eyebrow">What people say</p>
          <h2>Loved by creators and hosts.</h2>
        </Reveal>
        <RevealGroup className="testimonial-grid">
          {data.testimonials.map((t) => (
            <motion.blockquote key={t.name} variants={fadeUp}>
              <p>{t.quote}</p>
              <footer>
                {t.name}
                <span>{t.role}</span>
              </footer>
            </motion.blockquote>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
