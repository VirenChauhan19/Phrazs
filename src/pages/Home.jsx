import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store.jsx";
import PropertyCard from "../components/PropertyCard.jsx";

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
    { n: "01", title: "Find a Property", text: "Browse and discover unique locations that bring your vision to life." },
    { n: "02", title: "Check Reviews", text: "Read firsthand accounts from past visitors and creative teams." },
    { n: "03", title: "Book a Space", text: "Book with ease and get your project rolling." },
  ];

  return (
    <>
      <section className="hero" style={{ "--hero": `url(${data.brand.heroImage})` }}>
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">Phrazs marketplace</p>
          <h1>Find the Perfect Backdrop for Your Story</h1>
          <p>Explore unique, curated spaces available for short-term rent, ideal for shoots, special events, and creative projects.</p>
          <form className="search-panel" onSubmit={runSearch}>
            <label>
              <span>Keywords</span>
              <input type="search" placeholder="Kitchen, studio, backyard" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label>
              <span>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Categories" : c}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit">
              Search
            </button>
          </form>
          <div className="quick-tags">
            {data.tags.slice(0, 6).map((tag) => (
              <button key={tag} type="button" onClick={() => navigate(`/explore?q=${encodeURIComponent(tag)}`)}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Top Categories</p>
            <h2>Explore the most popular categories.</h2>
          </div>
          <Link className="text-link" to="/explore">
            View all spaces →
          </Link>
        </div>
        <div className="category-grid">
          {data.categories.map((category) => (
            <article
              key={category.name}
              className="category-tile"
              onClick={() => navigate(`/explore?category=${encodeURIComponent(category.name)}`)}
            >
              <img src={category.image} alt={category.name} />
              <div>
                <span>{category.count} Listings</span>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="steps-band">
        <div>
          <p className="eyebrow">Get started</p>
          <h2>Your perfect space is just a few steps away</h2>
        </div>
        <div className="step-list">
          {steps.map((s) => (
            <article key={s.n}>
              <span>{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Top Properties</p>
            <h2>Check popular top-rated properties.</h2>
          </div>
          <Link className="text-link" to="/explore">
            See the map →
          </Link>
        </div>
        <div className="property-grid">
          {featured.map((item) => (
            <PropertyCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="testimonial-band">
        <div>
          <p className="eyebrow">What People Say</p>
          <h2>Honest feedback from guests and hosts.</h2>
        </div>
        <div className="testimonial-grid">
          {data.testimonials.map((t) => (
            <blockquote key={t.name}>
              <p>{t.quote}</p>
              <footer>
                {t.name}
                <span>{t.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}
