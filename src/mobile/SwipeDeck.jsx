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
});

export default function SwipeDeck({ items, onOpen }) {
  const reduce = useReducedMotion();
  const { isSaved, toggle } = useSaved();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // last fling direction, for the exit animation

  const n = items.length;
  if (!n) return null;

  const advance = (d) => {
    setDir(d);
    setIndex((i) => (i + 1) % n);
  };

  const current = items[index % n];

  // Render the active card plus two behind it for depth (back-to-front order).
  const back = [2, 1].map((pos) => ({ pos, item: items[(index + pos) % n] }));

  return (
    <div className="deck" role="group" aria-label="Featured spaces — swipe to browse">
      <div className="deck__stage">
        {back.map(({ pos, item }) => (
          <motion.div
            key={`b-${pos}`}
            className="deck__card deck__card--behind"
            initial={false}
            animate={behind(pos)}
            transition={SPRING}
            style={{ zIndex: 10 - pos }}
            aria-hidden="true"
          >
            <DeckFace item={item} />
          </motion.div>
        ))}

        <AnimatePresence custom={dir} mode="popLayout">
          <FrontCard
            key={index}
            item={current}
            dir={dir}
            reduce={reduce}
            saved={isSaved(current.id)}
            onSave={() => toggle(current.id)}
            onSwipe={advance}
            onOpen={() => onOpen(current)}
          />
        </AnimatePresence>
      </div>

      <div className="deck__controls">
        <button type="button" className="deck__btn" onClick={() => advance(-1)} aria-label="Skip">
          ↺
        </button>
        <button type="button" className="deck__btn deck__btn--primary" onClick={() => onOpen(current)}>
          View space
        </button>
        <button
          type="button"
          className={`deck__btn ${isSaved(current.id) ? "is-saved" : ""}`}
          onClick={() => toggle(current.id)}
          aria-label="Save"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

// Each active card owns its own motion values, so a fling never bleeds into the
// next card (which mounts fresh because the key changes on advance).
function FrontCard({ item, dir, reduce, saved, onSave, onSwipe, onOpen }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [40, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -40], [1, 0]);

  const moved = useRef(false);

  const onDragEnd = (_e, info) => {
    const power = info.offset.x + info.velocity.x * 0.18;
    if (Math.abs(power) > 110) onSwipe(power > 0 ? 1 : -1);
  };

  return (
    <motion.div
      className="deck__card"
      style={reduce ? { zIndex: 10 } : { x, rotate, zIndex: 10 }}
      initial={{ scale: 0.94, y: -18, opacity: 0.4 }}
      animate={{ scale: 1, y: 0, opacity: 1, transition: SPRING }}
      custom={dir}
      exit={(d) => ({
        x: (d || 1) * 480,
        rotate: (d || 1) * 22,
        opacity: 0,
        transition: { duration: 0.32, ease: EASE },
      })}
      drag={reduce ? false : "x"}
      dragDirectionLock
      dragSnapToOrigin
      dragElastic={0.7}
      onDragStart={() => (moved.current = true)}
      onDragEnd={onDragEnd}
      onPointerDown={() => (moved.current = false)}
      onClick={() => !moved.current && onOpen()}
    >
      <DeckFace item={item} saved={saved} onSave={onSave} interactive>
        {!reduce && (
          <>
            <motion.span className="deck__stamp deck__stamp--like" style={{ opacity: likeOpacity }}>
              Save
            </motion.span>
            <motion.span className="deck__stamp deck__stamp--nope" style={{ opacity: nopeOpacity }}>
              Next
            </motion.span>
          </>
        )}
      </DeckFace>
    </motion.div>
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
