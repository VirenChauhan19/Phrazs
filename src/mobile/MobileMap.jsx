import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView.jsx";

/**
 * Mobile map experience: a full-height live map with a swipeable card carousel
 * docked at the bottom. Tapping a pin scrolls the carousel to that space;
 * swiping the carousel pans the map to the centred space (Airbnb-style).
 */
export default function MobileMap({ items, activeId, setActiveId }) {
  const navigate = useNavigate();
  const railRef = useRef(null);
  const suppress = useRef(false); // ignore scroll events during programmatic scroll
  const cardRefs = useRef(new Map());
  const ticking = useRef(false); // rAF throttle for the scroll-sync
  const fromMap = useRef(false); // true when selection came from a pin tap (not the carousel)

  // Pin taps select + recentre the carousel; carousel scrolls must NOT recentre
  // themselves (that would fight the user's finger).
  const selectFromMap = (id) => {
    fromMap.current = true;
    setActiveId(id);
  };

  // Only spaces with coordinates appear on the map — keep the carousel in sync.
  const points = items.filter((l) => typeof l.lat === "number" && typeof l.lng === "number");

  // Centre the active card in the carousel ONLY when the selection came from a
  // pin tap — otherwise we'd yank the carousel while the user is scrolling it.
  useEffect(() => {
    if (!activeId || !fromMap.current) return;
    fromMap.current = false;
    const el = cardRefs.current.get(activeId);
    if (!el) return;
    suppress.current = true;
    el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    const t = setTimeout(() => (suppress.current = false), 450);
    return () => clearTimeout(t);
  }, [activeId]);

  // As the carousel settles on a card, select it (which pans the map). Throttled
  // to one measurement per frame so flick-scrolling stays smooth.
  const onScroll = () => {
    if (suppress.current || ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const rail = railRef.current;
      if (!rail) return;
      const mid = rail.scrollLeft + rail.clientWidth / 2;
      let best = null;
      let bestDist = Infinity;
      for (const [id, el] of cardRefs.current) {
        const center = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = id;
        }
      }
      if (best && best !== activeId) setActiveId(best);
    });
  };

  return (
    <div className="m-map">
      <div className="m-map__canvas">
        <MapView listings={points} activeId={activeId} onSelect={selectFromMap} showPopups={false} />
      </div>

      <div className="m-map__rail" ref={railRef} onScroll={onScroll}>
        {points.map((item) => (
          <button
            key={item.id}
            type="button"
            ref={(el) => {
              if (el) cardRefs.current.set(item.id, el);
              else cardRefs.current.delete(item.id);
            }}
            className={`m-mapcard ${item.id === activeId ? "is-active" : ""}`}
            onClick={() => navigate(`/listing/${item.id}`)}
          >
            <img src={item.image} alt={item.title} loading="lazy" />
            <div className="m-mapcard__body">
              <span className="m-mapcard__meta">
                {item.rating ? `★ ${item.rating.toFixed(1)}` : "New"} · {item.category}
              </span>
              <strong>{item.title}</strong>
              <span className="m-mapcard__price">{item.priceLabel} <em>/hr</em></span>
            </div>
          </button>
        ))}
        {points.length === 0 && <p className="m-map__empty">No spaces with a location match your search.</p>}
      </div>
    </div>
  );
}
