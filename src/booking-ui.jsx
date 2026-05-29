import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useStore, priceBooking } from "./store.jsx";
import { money, todayISO, prettyDate, shortDate, dateRange, addDays } from "./utils.js";

function addHoursToTime(time, hours) {
  const [h, m] = String(time || "09:00").split(":").map((v) => Number(v) || 0);
  const endH = Math.min(h + (Number(hours) || 0), 23);
  return `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
  const start = t.toISOString().slice(0, 10);
  return {
    mode: "single", // "single" = one day by the hour, "range" = multiple days
    date: start,
    endDate: start,
    startTime: "09:00",
    hours: Math.min(Math.max(listing?.hours || 2, 1), 4) || 2, // default hours applied to each day
    hoursByDate: {}, // per-day overrides for multi-day bookings, keyed by YYYY-MM-DD
    crew: 1,
    name: "",
    email: "",
    notes: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    acceptedTerms: false,
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

  const hoursPerDay = Math.max(1, Number(form.hours) || 1);

  // Build a per-day schedule. Each day can carry its own hours (a `hoursByDate`
  // override); days with no override fall back to the default `form.hours`.
  const scheduleDates = form.mode === "range" ? dateRange(form.date, form.endDate) : [form.date];
  const schedule = scheduleDates.map((date) => ({
    date,
    hours: Math.max(1, Number(form.hoursByDate?.[date] ?? form.hours) || 1),
  }));
  const days = schedule.length;
  const totalHours = schedule.reduce((sum, d) => sum + d.hours, 0);

  // Listings can publish a per-day hours cap and a crew/guest cap (either may be null = no cap).
  const hoursCap = Number(listing?.hours) || 0;
  const crewCap = Number(listing?.crew) || 0;
  const crewCount = Math.max(1, Number(form.crew) || 1);
  const hoursOverCap = hoursCap > 0 && schedule.some((d) => d.hours > hoursCap);
  const crewOverCap = crewCap > 0 && crewCount > crewCap;

  const pricing = useMemo(
    () => (listing ? priceBooking(listing.price, totalHours) : null),
    [listing, totalHours]
  );

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setDayHours = (date, value) => update({ hoursByDate: { ...form.hoursByDate, [date]: value } });

  // Switching modes keeps a sensible date range (at least 2 days when going multi-day).
  const setMode = (mode) => {
    setError("");
    if (mode === "range") {
      update({ mode, endDate: form.endDate && form.endDate > form.date ? form.endDate : addDays(form.date, 1) });
    } else {
      update({ mode, endDate: form.date });
    }
  };

  // Keep the end date from drifting before the start date.
  const changeStartDate = (value) => {
    const patch = { date: value };
    if (form.mode === "range" && (!form.endDate || form.endDate < value)) patch.endDate = value;
    if (form.mode === "single") patch.endDate = value;
    update(patch);
  };

  const datesValid =
    form.date && form.date >= todayISO() && (form.mode === "single" || (form.endDate && form.endDate >= form.date));
  const detailsValid =
    datesValid &&
    form.name.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    hoursPerDay >= 1 &&
    crewCount >= 1 &&
    !hoursOverCap &&
    !crewOverCap;

  const cardDigits = form.cardNumber.replace(/\D/g, "");
  const paymentValid = form.cardName.trim() && cardDigits.length >= 15 && /^\d{2}\s*\/\s*\d{2}$/.test(form.expiry) && /^\d{3,4}$/.test(form.cvc);

  // Shown live (as the user types) when a cap is exceeded.
  const capError = hoursOverCap
    ? `This space allows up to ${hoursCap} hours per day. Please lower the hours to continue.`
    : crewOverCap
    ? `This space fits up to ${crewCap} crew/guests. Please reduce your crew size to continue.`
    : "";

  const goToPayment = () => {
    if (!datesValid) {
      setError("Pick valid dates — for a multi-day booking the end date must be on or after the start date.");
      return;
    }
    if (capError) {
      // The live warning already explains the limit; just don't advance.
      return;
    }
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
    if (!form.acceptedTerms) {
      setError("Please accept the Terms & Conditions to confirm your booking.");
      return;
    }
    setError("");
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1100)); // simulate the payment authorize/capture
    const summary = createBooking(listing, {
      ...form,
      endDate: form.mode === "range" ? form.endDate : form.date,
      schedule,
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
                    {days > 1 && (
                      <div>
                        <span>{days} days scheduled</span>
                        <span>{totalHours} hrs</span>
                      </div>
                    )}
                    <div>
                      <span>{money(listing.price)} × {totalHours} hrs</span>
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

                  <div className="booking-mode" role="tablist" aria-label="Booking length">
                    <button type="button" role="tab" aria-selected={form.mode === "single"} className={form.mode === "single" ? "on" : ""} onClick={() => setMode("single")}>
                      Single day
                    </button>
                    <button type="button" role="tab" aria-selected={form.mode === "range"} className={form.mode === "range" ? "on" : ""} onClick={() => setMode("range")}>
                      Multiple days
                    </button>
                  </div>

                  {form.mode === "single" ? (
                    <div className="grid-2">
                      <label>
                        Date
                        <input type="date" min={todayISO()} value={form.date} onChange={(e) => changeStartDate(e.target.value)} />
                      </label>
                      <label>
                        Start time
                        <input type="time" value={form.startTime} step="1800" onChange={(e) => update({ startTime: e.target.value })} />
                      </label>
                      <label className={hoursOverCap ? "field-error" : ""}>
                        Hours
                        <input type="number" min="1" max={hoursCap || 24} value={form.hours} onChange={(e) => update({ hours: e.target.value })} />
                        {hoursCap > 0 && <small className={`field-hint ${hoursOverCap ? "over" : ""}`}>Up to {hoursCap} hrs / day</small>}
                      </label>
                      <label className={crewOverCap ? "field-error" : ""}>
                        Crew / guests
                        <input type="number" min="1" max={crewCap || 200} value={form.crew} onChange={(e) => update({ crew: e.target.value })} />
                        {crewCap > 0 && <small className={`field-hint ${crewOverCap ? "over" : ""}`}>Fits up to {crewCap}</small>}
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="grid-2">
                        <label>
                          Start date
                          <input type="date" min={todayISO()} value={form.date} onChange={(e) => changeStartDate(e.target.value)} />
                        </label>
                        <label>
                          End date
                          <input type="date" min={form.date} value={form.endDate} onChange={(e) => update({ endDate: e.target.value })} />
                        </label>
                      </div>
                      <label>
                        Start time (each day)
                        <input type="time" value={form.startTime} step="1800" onChange={(e) => update({ startTime: e.target.value })} />
                      </label>

                      <div className="day-schedule">
                        <div className="day-schedule__head">
                          <span>Hours per day</span>
                          {hoursCap > 0 && <small className={`field-hint ${hoursOverCap ? "over" : ""}`}>Up to {hoursCap} hrs / day</small>}
                        </div>
                        {schedule.map(({ date, hours }) => {
                          const over = hoursCap > 0 && hours > hoursCap;
                          return (
                            <div className={`day-row ${over ? "over" : ""}`} key={date}>
                              <span className="day-row__date">{shortDate(date)}</span>
                              <span className="day-row__time">{form.startTime}–{addHoursToTime(form.startTime, hours)}</span>
                              <input
                                type="number"
                                min="1"
                                max={hoursCap || 24}
                                value={form.hoursByDate?.[date] ?? form.hours}
                                onChange={(e) => setDayHours(date, e.target.value)}
                                aria-label={`Hours on ${shortDate(date)}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <label className={crewOverCap ? "field-error" : ""}>
                        Crew / guests
                        <input type="number" min="1" max={crewCap || 200} value={form.crew} onChange={(e) => update({ crew: e.target.value })} />
                        {crewCap > 0 && <small className={`field-hint ${crewOverCap ? "over" : ""}`}>Fits up to {crewCap}</small>}
                      </label>
                      <p className="range-summary">
                        <strong>{days} {days === 1 ? "day" : "days"}</strong> scheduled · <strong>{totalHours} hrs total</strong>
                      </p>
                    </>
                  )}
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
                  {capError && <p className="booking-error">{capError}</p>}
                  {error && !capError && <p className="booking-error">{error}</p>}
                  <button className="primary-button block" type="button" onClick={goToPayment} disabled={!!capError}>
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
                  <label className="terms-check">
                    <input type="checkbox" checked={form.acceptedTerms} onChange={(e) => update({ acceptedTerms: e.target.checked })} />
                    <span>
                      I have read and agree to the{" "}
                      <a href="#/terms" target="_blank" rel="noreferrer">
                        Terms &amp; Conditions
                      </a>
                      , including the cancellation and refund policy.
                    </span>
                  </label>
                  {error && <p className="booking-error">{error}</p>}
                  <button className="primary-button block" type="button" onClick={confirmAndPay} disabled={processing || !form.acceptedTerms}>
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
                    {listing.title} ·{" "}
                    {result.days > 1
                      ? `${prettyDate(result.date)} → ${prettyDate(result.endDate)}`
                      : `${prettyDate(result.date)} · ${result.startTime}–${result.endTime}`}
                  </p>
                  <div className="success-summary">
                    <div>
                      <span>{result.days > 1 ? "Days" : "Crew"}</span>
                      <strong>{result.days > 1 ? result.days : result.crew}</strong>
                    </div>
                    <div>
                      <span>{result.days > 1 ? "Total hrs" : "Hours"}</span>
                      <strong>{result.hours}</strong>
                    </div>
                    <div>
                      <span>Total paid</span>
                      <strong>{money(result.total)}</strong>
                    </div>
                  </div>
                  <p className="muted small">A confirmation was sent to {form.email}. You can view this booking any time under My Bookings.</p>
                  <div className="success-actions">
                    <a className="primary-button" href="#/bookings" onClick={closeBooking}>
                      View my booking
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
