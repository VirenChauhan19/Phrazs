import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useStore, priceBooking } from "./store.jsx";
import { money, todayISO, prettyDate } from "./utils.js";

const BookingUIContext = createContext(null);

function detectBrand(number) {
  const n = number.replace(/\D/g, "");
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  if (/^6/.test(n)) return "Discover";
  return "Card";
}

function defaultForm(listing) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return {
    date: t.toISOString().slice(0, 10),
    startTime: "09:00",
    hours: Math.min(Math.max(listing?.hours || 2, 1), 4) || 2,
    crew: 1,
    name: "",
    email: "",
    notes: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  };
}

export function BookingUIProvider({ children }) {
  const { createBooking } = useStore();
  const [listing, setListing] = useState(null);
  const [step, setStep] = useState("details");
  const [form, setForm] = useState(defaultForm(null));
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const open = !!listing;

  const openBooking = useCallback((nextListing) => {
    setListing(nextListing);
    setForm(defaultForm(nextListing));
    setStep("details");
    setResult(null);
    setError("");
    setProcessing(false);
  }, []);

  const closeBooking = useCallback(() => {
    setListing(null);
    setProcessing(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !processing) closeBooking();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, processing, closeBooking]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const pricing = useMemo(
    () => (listing ? priceBooking(listing.price, Math.max(1, Number(form.hours) || 1)) : null),
    [listing, form.hours]
  );

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const detailsValid =
    form.date && form.date >= todayISO() && form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && Number(form.hours) >= 1 && Number(form.crew) >= 1;

  const cardDigits = form.cardNumber.replace(/\D/g, "");
  const paymentValid = form.cardName.trim() && cardDigits.length >= 15 && /^\d{2}\s*\/\s*\d{2}$/.test(form.expiry) && /^\d{3,4}$/.test(form.cvc);

  const goToPayment = () => {
    if (!detailsValid) {
      setError("Please complete the dates, crew size, and your contact details.");
      return;
    }
    setError("");
    setStep("payment");
  };

  const confirmAndPay = async () => {
    if (!paymentValid) {
      setError("Enter valid card details to confirm. Try 4242 4242 4242 4242.");
      return;
    }
    setError("");
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1100)); // simulate the payment authorize/capture
    const summary = createBooking(listing, {
      ...form,
      cardBrand: detectBrand(form.cardNumber),
      last4: cardDigits.slice(-4),
    });
    setResult(summary);
    setProcessing(false);
    setStep("success");
    showToast(`Booking confirmed for ${listing.title} — it's now live in the Admin dashboard.`);
  };

  const value = useMemo(() => ({ openBooking, showToast }), [openBooking, showToast]);

  return (
    <BookingUIContext.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {toast}
        </div>
      )}
      {open && (
        <div className="booking-overlay" onMouseDown={(e) => e.target === e.currentTarget && !processing && closeBooking()}>
          <div className="booking-modal" role="dialog" aria-modal="true" aria-label={`Book ${listing.title}`}>
            <button className="booking-close" type="button" onClick={closeBooking} disabled={processing} aria-label="Close">
              ✕
            </button>

            <div className="booking-aside">
              <img src={listing.image} alt={listing.title} />
              <div className="booking-aside-body">
                <span className="chip">{listing.category}</span>
                <h3>{listing.title}</h3>
                <p className="muted">{listing.city || "United States"}</p>
                <p className="muted small">Hosted by {listing.host || "Phrazs host"}</p>
                {pricing && (
                  <div className="price-breakdown">
                    <div>
                      <span>{money(listing.price)} × {Math.max(1, Number(form.hours) || 1)} hrs</span>
                      <span>{money(pricing.subtotal)}</span>
                    </div>
                    <div>
                      <span>Service fee (15%)</span>
                      <span>{money(pricing.platformFee)}</span>
                    </div>
                    <div className="price-total">
                      <span>Total</span>
                      <span>{money(pricing.total)}</span>
                    </div>
                    <p className="muted small">Host payout {money(pricing.hostPayout)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="booking-main">
              <div className="booking-steps">
                <span className={step === "details" ? "on" : result ? "done" : ""}>1 · Details</span>
                <span className={step === "payment" ? "on" : step === "success" ? "done" : ""}>2 · Payment</span>
                <span className={step === "success" ? "on" : ""}>3 · Confirmed</span>
              </div>

              {step === "details" && (
                <div className="booking-fields fade-in">
                  <h2>Book this space</h2>
                  <div className="grid-2">
                    <label>
                      Date
                      <input type="date" min={todayISO()} value={form.date} onChange={(e) => update({ date: e.target.value })} />
                    </label>
                    <label>
                      Start time
                      <input type="time" value={form.startTime} step="1800" onChange={(e) => update({ startTime: e.target.value })} />
                    </label>
                    <label>
                      Hours
                      <input type="number" min="1" max="24" value={form.hours} onChange={(e) => update({ hours: e.target.value })} />
                    </label>
                    <label>
                      Crew / guests
                      <input type="number" min="1" max={listing.crew || 200} value={form.crew} onChange={(e) => update({ crew: e.target.value })} />
                    </label>
                  </div>
                  <label>
                    Your name
                    <input type="text" placeholder="Jordan Cole" value={form.name} onChange={(e) => update({ name: e.target.value })} />
                  </label>
                  <label>
                    Email
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update({ email: e.target.value })} />
                  </label>
                  <label>
                    Notes for the host (optional)
                    <textarea rows="2" placeholder="What are you shooting?" value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
                  </label>
                  {error && <p className="booking-error">{error}</p>}
                  <button className="primary-button block" type="button" onClick={goToPayment}>
                    Continue to payment
                  </button>
                </div>
              )}

              {step === "payment" && (
                <div className="booking-fields fade-in">
                  <button className="link-back" type="button" onClick={() => setStep("details")}>
                    ← Back to details
                  </button>
                  <h2>Payment</h2>
                  <p className="muted small">Test mode — use card 4242 4242 4242 4242, any future expiry, any CVC.</p>
                  <label>
                    Name on card
                    <input type="text" placeholder="Jordan Cole" value={form.cardName} onChange={(e) => update({ cardName: e.target.value })} />
                  </label>
                  <label>
                    Card number
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={form.cardNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        update({ cardNumber: digits.replace(/(.{4})/g, "$1 ").trim() });
                      }}
                    />
                  </label>
                  <div className="grid-2">
                    <label>
                      Expiry
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={form.expiry}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                          update({ expiry: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d });
                        }}
                      />
                    </label>
                    <label>
                      CVC
                      <input type="text" inputMode="numeric" placeholder="123" value={form.cvc} onChange={(e) => update({ cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                    </label>
                  </div>
                  {error && <p className="booking-error">{error}</p>}
                  <button className="primary-button block" type="button" onClick={confirmAndPay} disabled={processing}>
                    {processing ? <span className="spinner" /> : null}
                    {processing ? "Processing…" : `Pay ${money(pricing.total)}`}
                  </button>
                  <p className="muted small center">Secured by Stripe · You won't be charged in test mode.</p>
                </div>
              )}

              {step === "success" && result && (
                <div className="booking-success fade-in">
                  <div className="success-check">✓</div>
                  <h2>You're booked!</h2>
                  <p className="muted">
                    {listing.title} · {prettyDate(result.date)} · {result.startTime}–{result.endTime}
                  </p>
                  <div className="success-summary">
                    <div>
                      <span>Crew</span>
                      <strong>{result.crew}</strong>
                    </div>
                    <div>
                      <span>Hours</span>
                      <strong>{result.hours}</strong>
                    </div>
                    <div>
                      <span>Total paid</span>
                      <strong>{money(result.total)}</strong>
                    </div>
                  </div>
                  <p className="muted small">A confirmation was sent to {form.email}. This booking now appears under Admin → Bookings, Active, Payments, Payouts, and the Calendar.</p>
                  <div className="success-actions">
                    <a className="primary-button" href="#/admin" onClick={closeBooking}>
                      View in admin
                    </a>
                    <button className="ghost-button" type="button" onClick={closeBooking}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </BookingUIContext.Provider>
  );
}

export function useBookingUI() {
  const ctx = useContext(BookingUIContext);
  if (!ctx) throw new Error("useBookingUI must be used within BookingUIProvider");
  return ctx;
}
