import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useStore } from "../../store.jsx";
import { useBookingUI } from "../../booking-ui.jsx";
import { stagger, fadeUp } from "../../motion.jsx";
import Tilt3D from "../Tilt3D.jsx";
import { useSaved } from "../useSaved.js";

export default function Saved() {
  const { listings } = useStore();
  const { openBooking } = useBookingUI();
  const navigate = useNavigate();
  const { savedIds, toggle } = useSaved();

  const saved = listings.filter((l) => savedIds.has(l.id));

  return (
    <div className="m-screen m-saved">
      <header className="m-explore__head">
        <h1>Saved spaces</h1>
        <p className="m-sub">Your shortlist of camera-ready locations.</p>
      </header>

      {saved.length === 0 ? (
        <div className="m-empty m-empty--full">
          <div className="m-empty__heart">♡</div>
          <p>Nothing saved yet.</p>
          <span className="m-sub">Tap the heart on any space to keep it here.</span>
          <button type="button" className="m-btn" onClick={() => navigate("/explore")}>
            Explore spaces
          </button>
        </div>
      ) : (
        <motion.div className="m-grid" variants={stagger(0.06)} initial="hidden" animate="show">
          {saved.map((item) => (
            <motion.div key={item.id} variants={fadeUp}>
              <Tilt3D className="m-card" max={11}>
                <div className="m-card__media" onClick={() => navigate(`/listing/${item.id}`)}>
                  <img className="lift-1" src={item.image} alt={item.title} loading="lazy" />
                  <span className="m-card__price lift-2">{item.priceLabel}/hr</span>
                  <button
                    type="button"
                    className="m-card__heart lift-2 is-saved"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(item.id);
                    }}
                    aria-label="Remove from saved"
                  >
                    ♥
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
      )}

      <div className="m-spacer" />
    </div>
  );
}
