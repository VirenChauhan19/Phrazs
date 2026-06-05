import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { EASE } from "../motion.jsx";
import { useSaved } from "./useSaved.js";

const SPRING = { type: "spring", stiffness: 320, damping: 32 };

// Depth presentation for the cards stacked behind the active one.
const behind = (pos) => ({
  scale: 1 - pos * 0.06,
  y: pos * -18,
  opacity: pos > 2 ? 0 : 1 - pos * 0.16,
  zIndex: 10 - pos,
});

export default function SwipeDeck({ items, onOpen }) {
  const reduce = useReducedMotion();
  const { isSaved, toggle } = useSaved();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // last fling direction, for the exit animation

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [40, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -40], [1, 0]);
  const movedRef = useRef(false);

  const n = items.length;
  if (!n) return null;

  const advance = (d) => {
    setDir(d);
    setIndex((i) => (i + 1) % n);
    x.set(0);
  };

  const onDragEnd = (_e, info) => {
    const power = info.offset.x + info.velocity.x * 0.18;
    if (Math.abs(power) > 110) advance(power > 0 ? 1 : -1);
    else x.set(0); // snap back
  };

  // Render the active card plus two behind it for depth.
  const stack = [0, 1, 2].map((pos) => ({ pos, item: items[(index + pos) % n] }));

  return (
    <div className="deck" role="group" aria-label="Featured spaces — swipe to browse">
      <div className="deck__stage">
        {stack
          .slice()
          .reverse()
          .map(({ pos, item }) => {
            if (pos === 0) {
              return (
                <AnimatePresence key="front" custom={dir} mode="popLayout">
                  <motion.div
                    key={index}
                    className="deck__card"
                    style={reduce ? { zIndex: 10 } : { x, rotate, zIndex: 10 }}
                    custom={dir}
                    initial={{ scale: 0.94, y: -18, opacity: 0.4 }}
                    animate={{ scale: 1, y: 0, opacity: 1, transition: SPRING }}
                    exit={(d) => ({
                      x: (d || 1) * 480,
                      rotate: (d || 1) * 22,
                      opacity: 0,
                      transition: { duration: 0.32, ease: EASE },
                    })}
                    drag={reduce ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragStart={() => (movedRef.current = true)}
                    onDragEnd={onDragEnd}
                    onPointerDown={() => (movedRef.current = false)}
                    onClick={() => !movedRef.current && onOpen(item)}
                  >
                    <DeckFace item={item} saved={isSaved(item.id)} onSave={() => toggle(item.id)} interactive>
                      <motion.span className="deck__stamp deck__stamp--like" style={{ opacity: likeOpacity }}>
                        Save
                      </motion.span>
                      <motion.span className="deck__stamp deck__stamp--nope" style={{ opacity: nopeOpacity }}>
                        Next
                      </motion.span>
                    </DeckFace>
                  </motion.div>
                </AnimatePresence>
              );
            }
            return (
              <motion.div
                key={`b-${pos}`}
                className="deck__card deck__card--behind"
                initial={false}
                animate={behind(pos)}
                transition={SPRING}
                aria-hidden="true"
              >
                <DeckFace item={item} saved={false} />
              </motion.div>
            );
          })}
      </div>

      <div className="deck__controls">
        <button type="button" className="deck__btn" onClick={() => advance(-1)} aria-label="Skip">
          ↺
        </button>
        <button type="button" className="deck__btn deck__btn--primary" onClick={() => onOpen(items[index % n])}>
          View space
        </button>
        <button
          type="button"
          className={`deck__btn ${isSaved(items[index % n].id) ? "is-saved" : ""}`}
          onClick={() => toggle(items[index % n].id)}
          aria-label="Save"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

function DeckFace({ item, saved, onSave, interactive, children }) {
  return (
    <div className="deck__face">
      <img className="deck__img" src={item.image} alt={item.title} draggable="false" />
      <div className="deck__veil" aria-hidden="true" />
      {interactive && (
        <button
          type="button"
          className={`deck__heart ${saved ? "is-saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave?.();
          }}
          aria-label={saved ? "Remove from saved" : "Save space"}
        >
          {saved ? "♥" : "♡"}
        </button>
      )}
      <div className="deck__info">
        <span className="deck__cat">{item.category}</span>
        <h3>{item.title}</h3>
        <p>
          {item.city || "United States"}
          {item.rating ? <span className="deck__rating"> · ★ {item.rating.toFixed(1)}</span> : null}
        </p>
        <strong className="deck__price">{item.priceLabel} <em>/hr</em></strong>
      </div>
      {children}
    </div>
  );
}
