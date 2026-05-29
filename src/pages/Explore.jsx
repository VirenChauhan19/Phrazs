import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import MapView from "../components/MapView.jsx";

export default function Explore() {
  const { listings } = useStore();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState("featured");
  const [activeId, setActiveId] = useState(null);

  // When a map marker is hovered, highlight and scroll its card into view.
  const focusFromMap = (id) => {
    setActiveId(id);
    if (id) document.getElementById(`result-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const categories = ["All", ...new Set(listings.map((l) => l.category))];

  useEffect(() => {
    setQuery(params.get("q") || "");
    setCategory(params.get("category") || "All");
  }, [params]);

  const syncParams = (q, cat) => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (cat !== "All") next.set("category", cat);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let result = listings.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const haystack = [item.title, item.category, item.pets, item.host, item.description, item.city, ...(item.tags || [])].join(" ").toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
    result = result.slice();
    if (sort === "priceLow") result.sort((a, b) => a.price - b.price);
    if (sort === "priceHigh") result.sort((a, b) => b.price - a.price);
    if (sort === "spaceHigh") result.sort((a, b) => (b.sqft || 0) - (a.sqft || 0));
    if (sort === "ratingHigh") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return result;
  }, [listings, query, category, sort]);

  return (
    <section className="section explore-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Explore spaces</p>
          <h2>Browse every Phrazs location on the live map.</h2>
        </div>
      </div>

      <form
        className="explore-search"
        onSubmit={(e) => {
          e.preventDefault();
          syncParams(query, category);
        }}
      >
        <input type="search" placeholder="Search kitchens, studios, backyards…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            syncParams(query, e.target.value);
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Categories" : c}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="spaceHigh">Sq Footage: High to Low</option>
          <option value="ratingHigh">Rating: High to Low</option>
        </select>
        <button className="primary-button" type="submit">
          Search
        </button>
      </form>

      <div className="filter-group">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? "active" : ""}
            onClick={() => {
              setCategory(c);
              syncParams(query, c);
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="explore-layout">
        <div className="explore-results">
          <p className="results-count">{filtered.length} space{filtered.length === 1 ? "" : "s"} found</p>
          {filtered.length ? (
            <div className="property-grid two">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  id={`result-${item.id}`}
                  className={activeId === item.id ? "hl" : ""}
                  onMouseEnter={() => setActiveId(item.id)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  <PropertyCard item={item} />
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No spaces match that search yet. Try a different keyword or category.</p>
          )}
        </div>
        <div className="explore-map">
          <MapView listings={filtered} activeId={activeId} onHover={focusFromMap} />
        </div>
      </div>
    </section>
  );
}
