import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";
import { useStore } from "../store.jsx";
import { useUserAuth } from "../user-auth.jsx";
import { motion } from "../motion.jsx";
import {
  clearPendingCheckout,
  getCheckoutSession,
  getPendingCheckout,
  hasCompletedCheckout,
  markCheckoutCompleted,
  recordPaidBooking,
} from "../stripe.js";

export default function CheckoutSuccess() {
  const location = useLocation();
  const { listings, createBooking } = useStore();
  const { showToast } = useBookingUI();
  const { saveBooking } = useUserAuth();
  const started = useRef(false);
  const [state, setState] = useState({ status: "loading", message: "Verifying your Stripe payment..." });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sessionId = new URLSearchParams(location.search).get("session_id");
    if (!sessionId) {
      setState({ status: "error", message: "Stripe did not return a checkout session id." });
      return;
    }
    if (hasCompletedCheckout(sessionId)) {
      setState({ status: "success", message: "This Stripe payment was already confirmed." });
      return;
    }

    const pending = getPendingCheckout();
    if (!pending || pending.sessionId !== sessionId) {
      setState({ status: "error", message: "We could not find the booking details for this checkout in this browser." });
      return;
    }

    async function finishCheckout() {
      try {
        const session = await getCheckoutSession(sessionId);
        if (session.payment_status !== "paid") {
          setState({ status: "error", message: "Stripe has not marked this payment as paid yet." });
          return;
        }

        const listing = listings.find((item) => item.id === pending.listingId);
        if (!listing) {
          setState({ status: "error", message: "We could not match this checkout to a Phrazs listing." });
          return;
        }

        await recordPaidBooking({
          listingId: listing.id,
          form: pending.form,
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent || "",
        });
        const summary = createBooking(listing, {
          ...pending.form,
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent || "",
          paymentMethod: "Stripe Checkout",
          cardBrand: "Stripe",
          last4: String(session.payment_intent || session.id).slice(-4),
        });
        // If the guest is signed in, save this booking to their account (no-op otherwise).
        await saveBooking({
          propertyId: listing.id,
          property: listing.title,
          host: listing.host || "Phrazs host",
          start: `${summary.date} ${summary.startTime}`,
          end: `${summary.endDate} ${summary.endTime}`,
          date: summary.date,
          endDate: summary.endDate,
          days: summary.days,
          hours: summary.hours,
          crew: summary.crew,
          total: summary.total,
          status: "Confirmed",
          paymentStatus: "Paid",
          schedule: summary.schedule,
          notes: pending.form.notes || "",
        });
        markCheckoutCompleted(session.id);
        clearPendingCheckout();
        showToast(`Booking confirmed for ${listing.title} - it's now live in the Admin dashboard.`);
        setState({ status: "success", message: `Payment confirmed for ${listing.title}.`, summary });
      } catch (err) {
        setState({ status: "error", message: err.message || "Unable to verify Stripe payment." });
      }
    }

    finishCheckout();
  }, [createBooking, listings, location.search, showToast, saveBooking]);

  return (
    <section className="section checkout-result">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <motion.span
          className={`checkout-emblem ${state.status}`}
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
          aria-hidden="true"
        >
          {state.status === "success" ? "✓" : state.status === "error" ? "!" : "…"}
        </motion.span>
        <p className="eyebrow">Stripe checkout</p>
        <h1>{state.status === "success" ? "You're booked!" : state.status === "error" ? "Checkout needs attention" : "Confirming payment"}</h1>
        <p className="lead">{state.message}</p>
        {state.summary && (
          <div className="checkout-summary">
            <div>
              <span>Total paid</span>
              <strong>{state.summary.total.toLocaleString("en-US", { style: "currency", currency: "USD" })}</strong>
            </div>
            <div>
              <span>Hours</span>
              <strong>{state.summary.hours}</strong>
            </div>
            <div>
              <span>Days</span>
              <strong>{state.summary.days}</strong>
            </div>
          </div>
        )}
        <div className="success-actions">
          <Link className="primary-button" to="/bookings">
            View my booking
          </Link>
          <Link className="ghost-button" to="/explore">
            Explore spaces
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
