import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBookingUI } from "../booking-ui.jsx";
import { useStore } from "../store.jsx";
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
        markCheckoutCompleted(session.id);
        clearPendingCheckout();
        showToast(`Booking confirmed for ${listing.title} - it's now live in the Admin dashboard.`);
        setState({ status: "success", message: `Payment confirmed for ${listing.title}.`, summary });
      } catch (err) {
        setState({ status: "error", message: err.message || "Unable to verify Stripe payment." });
      }
    }

    finishCheckout();
  }, [createBooking, listings, location.search, showToast]);

  return (
    <section className="section checkout-result">
      <div>
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
      </div>
    </section>
  );
}
