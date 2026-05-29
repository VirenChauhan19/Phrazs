import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import PHRAZS_DATA from "./data.js";
import PHRAZS_MEDIA from "./media.js";

const STORAGE_KEY = "phrazs_user_records_v1";
const PLATFORM_RATE = 0.15; // service fee charged to guest / commission used for payout split
const CARD_BRANDS = ["Visa", "Mastercard", "American Express", "Discover"];

const StoreContext = createContext(null);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function emptyRecords() {
  return { bookings: [], payments: [], payouts: [], calendar: [], inquiries: [], users: [] };
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRecords();
    return { ...emptyRecords(), ...JSON.parse(raw) };
  } catch {
    return emptyRecords();
  }
}

// Pricing model (matches the seeded booking math): the guest pays the subtotal
// plus a 15% service fee; the host receives the subtotal minus a 15% commission.
export function priceBooking(rate, hours) {
  const subtotal = round2((Number(rate) || 0) * (Number(hours) || 0));
  const platformFee = round2(subtotal * PLATFORM_RATE);
  const hostPayout = round2(subtotal - platformFee);
  const total = round2(subtotal + platformFee);
  return { subtotal, platformFee, hostPayout, total };
}

function nextSequentialId(prefix, items, fallbackStart) {
  let max = fallbackStart - 1;
  items.forEach((item) => {
    const match = String(item.id || "").match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `${prefix}-${max + 1}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function addHoursToTime(time, hours) {
  const [h, m] = String(time || "09:00").split(":").map((v) => Number(v) || 0);
  const endH = Math.min(h + (Number(hours) || 0), 23);
  return `${pad2(endH)}:${pad2(m)}`;
}

export function StoreProvider({ children }) {
  const [records, setRecords] = useState(loadRecords);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      /* storage full or unavailable - keep working in-memory */
    }
  }, [records]);

  // Combined views: seeded data first, then anything created in the app.
  const bookings = useMemo(() => [...records.bookings, ...PHRAZS_DATA.bookings], [records.bookings]);
  const payments = useMemo(() => [...records.payments, ...PHRAZS_DATA.payments], [records.payments]);
  const payouts = useMemo(() => [...records.payouts, ...PHRAZS_DATA.payouts], [records.payouts]);
  const calendar = useMemo(() => [...records.calendar, ...PHRAZS_DATA.calendar], [records.calendar]);
  const inquiries = useMemo(() => [...records.inquiries, ...PHRAZS_DATA.inquiries], [records.inquiries]);
  const users = useMemo(() => {
    const seen = new Set(PHRAZS_DATA.users.map((u) => u.email.toLowerCase()));
    const extra = records.users.filter((u) => !seen.has(u.email.toLowerCase()));
    return [...extra, ...PHRAZS_DATA.users];
  }, [records.users]);

  const createBooking = useCallback((listing, form) => {
    const crew = Math.max(1, Number(form.crew) || 1);
    const startTime = form.startTime || "09:00";

    // Normalize the per-day schedule. Falls back to a single day from the form
    // so older single-day callers keep working.
    const schedule = (Array.isArray(form.schedule) && form.schedule.length
      ? form.schedule
      : [{ date: form.date, hours: Math.max(1, Number(form.hours) || 1) }]
    ).map((d) => ({ date: d.date, hours: Math.max(1, Number(d.hours) || 1) }));

    const date = schedule[0].date;
    const endDate = schedule[schedule.length - 1].date;
    const days = schedule.length;
    const hours = schedule.reduce((sum, d) => sum + d.hours, 0); // total billable hours across the stay
    const uniform = schedule.every((d) => d.hours === schedule[0].hours);
    const hoursPerDay = uniform ? schedule[0].hours : null; // null when days differ
    const endTime = addHoursToTime(startTime, schedule[schedule.length - 1].hours);
    const { subtotal, platformFee, hostPayout, total } = priceBooking(listing.price, hours);

    setRecords((prev) => {
      const allBookings = [...prev.bookings, ...PHRAZS_DATA.bookings];
      const allPayments = [...prev.payments, ...PHRAZS_DATA.payments];
      const allPayouts = [...prev.payouts, ...PHRAZS_DATA.payouts];

      const bookingId = nextSequentialId("bk", allBookings, 1100);
      const paymentId = nextSequentialId("pay", allPayments, 9100);
      const payoutId = nextSequentialId("po", allPayouts, 7100);

      const booking = {
        id: bookingId,
        propertyId: listing.id,
        property: listing.title,
        guest: form.name,
        guestEmail: form.email,
        host: listing.host || "Phrazs host",
        start: `${date} ${startTime}`,
        end: `${endDate} ${endTime}`,
        date,
        endDate,
        days,
        hoursPerDay,
        hours,
        schedule,
        crew,
        status: "Confirmed",
        paymentStatus: "Paid",
        subtotal,
        platformFee,
        hostPayout,
        total,
        notes: form.notes?.trim() || `Booked online for ${listing.title}.`,
        createdAt: new Date().toISOString(),
        source: "guest-booking",
      };

      const payment = {
        id: paymentId,
        bookingId,
        processor: "Stripe",
        method: "Card",
        cardBrand: form.cardBrand || CARD_BRANDS[allPayments.length % CARD_BRANDS.length],
        last4: form.last4 || String(Math.floor(1000 + Math.random() * 9000)),
        gross: total,
        fees: round2(total * 0.029 + 0.3),
        net: round2(total - (total * 0.029 + 0.3)),
        refunded: 0,
        status: "Captured",
        capturedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      const payoutDate = new Date(`${endDate}T00:00:00`);
      payoutDate.setDate(payoutDate.getDate() + 2);
      const payout = {
        id: payoutId,
        host: booking.host,
        bookingId,
        amount: hostPayout,
        status: "Scheduled",
        payoutDate: payoutDate.toISOString().slice(0, 10),
      };

      // Block every day of the stay on the calendar, each with its own hours.
      const calendarEntries = schedule.map((d) => ({
        date: d.date,
        property: listing.title,
        status: "Booked",
        bookingId,
        time: `${startTime}-${addHoursToTime(startTime, d.hours)}`,
      }));

      // Add a guest user record only if this email is brand new.
      const knownEmails = new Set([
        ...PHRAZS_DATA.users.map((u) => u.email.toLowerCase()),
        ...prev.users.map((u) => u.email.toLowerCase()),
      ]);
      const newUsers = [...prev.users];
      if (!knownEmails.has(form.email.toLowerCase())) {
        newUsers.unshift({
          id: nextSequentialId("usr", [...PHRAZS_DATA.users, ...prev.users], 100),
          name: form.name,
          email: form.email,
          role: "Guest",
          status: "Active",
          joined: new Date().toISOString().slice(0, 10),
          bookings: 1,
          lifetimeValue: total,
        });
      }

      return {
        ...prev,
        bookings: [booking, ...prev.bookings],
        payments: [payment, ...prev.payments],
        payouts: [payout, ...prev.payouts],
        calendar: [...calendarEntries, ...prev.calendar],
        users: newUsers,
      };
    });

    return { subtotal, platformFee, hostPayout, total, hours, hoursPerDay, days, schedule, crew, startTime, endTime, date, endDate };
  }, []);

  const submitInquiry = useCallback((form) => {
    setRecords((prev) => {
      const all = [...prev.inquiries, ...PHRAZS_DATA.inquiries];
      const id = nextSequentialId("lead", all, 100);
      const inquiry = {
        id,
        name: form.name,
        email: form.email,
        interest: form.interest || form.subject || "General inquiry",
        status: "New",
        message: form.message || "",
        createdAt: new Date().toISOString(),
      };
      return { ...prev, inquiries: [inquiry, ...prev.inquiries] };
    });
  }, []);

  const resetUserData = useCallback(() => {
    setRecords(emptyRecords());
  }, []);

  const exportData = useCallback(
    () => ({
      ...PHRAZS_DATA,
      bookings,
      payments,
      payouts,
      calendar,
      inquiries,
      users,
      mediaLibrary: PHRAZS_MEDIA,
    }),
    [bookings, payments, payouts, calendar, inquiries, users]
  );

  const value = useMemo(
    () => ({
      data: PHRAZS_DATA,
      media: PHRAZS_MEDIA,
      listings: PHRAZS_DATA.listings,
      hosts: PHRAZS_DATA.hosts,
      bookings,
      payments,
      payouts,
      calendar,
      inquiries,
      users,
      myBookings: records.bookings,
      userBookingCount: records.bookings.length,
      createBooking,
      submitInquiry,
      resetUserData,
      exportData,
    }),
    [bookings, payments, payouts, calendar, inquiries, users, records.bookings.length, createBooking, submitInquiry, resetUserData, exportData]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
