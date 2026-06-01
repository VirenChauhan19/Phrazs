export const ADMIN_DATA = {
  source: {
    site: "https://phrazs.com/",
    extractedOn: "2026-05-29",
    notes: [
      "Admin-only operational records are served from the backend after authentication.",
      "Images are referenced from the public Phrazs media library instead of duplicated locally.",
    ],
  },
  inquiries: [
    { id: "lead-001", name: "Creative Producer", email: "producer@example.com", interest: "Go Bold Studio", status: "New", message: "Looking for a full-day cyc wall rental with parking." },
    { id: "lead-002", name: "Podcast Team", email: "podcast@example.com", interest: "Podcast at SparQ Social", status: "Reviewing", message: "Need a two-hour podcast block and audio engineer." },
    { id: "lead-003", name: "Event Planner", email: "events@example.com", interest: "Secluded cozy house", status: "New", message: "Checking pet rules and backyard availability." },
  ],
  users: [
    { id: "usr-001", name: "Creative Producer", email: "producer@example.com", role: "Guest", status: "Active", joined: "2026-05-01", bookings: 2, lifetimeValue: 1350 },
    { id: "usr-002", name: "Podcast Team", email: "podcast@example.com", role: "Guest", status: "Active", joined: "2026-05-08", bookings: 1, lifetimeValue: 150 },
    { id: "usr-003", name: "Dre Manning", email: "dre@example.com", role: "Host", status: "Active", joined: "2025-09-23", bookings: 6, lifetimeValue: 2280 },
    { id: "usr-004", name: "Go Bold Studio", email: "host@gobold.example.com", role: "Host", status: "Active", joined: "2025-10-08", bookings: 4, lifetimeValue: 4200 },
    { id: "usr-005", name: "Admin Owner", email: "contact@phrazs.com", role: "Admin", status: "Owner", joined: "2026-05-29", bookings: 0, lifetimeValue: 0 },
  ],
  bookingStructure: {
    statuses: ["Inquiry", "Pending Payment", "Confirmed", "Active", "Completed", "Cancelled", "Refund Requested"],
    bookingFields: ["Booking ID", "Guest", "Host", "Property", "Start", "End", "Crew Size", "Hours", "Subtotal", "Fees", "Host Payout", "Platform Fee", "Payment Status", "Booking Status"],
    paymentFields: ["Payment ID", "Booking ID", "Processor", "Method", "Card Brand", "Last 4", "Gross", "Fees", "Net", "Refunded", "Status", "Captured At"],
    calendarRules: ["Block unavailable host dates", "Prevent overlapping confirmed bookings", "Track pending holds separately", "Show active bookings on today's board", "Move finished bookings into completed history"],
  },
  bookings: [
    { id: "bk-1001", propertyId: "go-bold-studio", property: "Go Bold Studio", guest: "Creative Producer", guestEmail: "producer@example.com", host: "Go Bold Studio", start: "2026-06-04 09:00", end: "2026-06-04 17:00", date: "2026-06-04", hours: 8, crew: 12, status: "Active", paymentStatus: "Paid", subtotal: 1200, platformFee: 180, hostPayout: 1020, total: 1380, notes: "Full-day cyc wall shoot with parking and conference room." },
    { id: "bk-1002", propertyId: "podcast-sparq-social", property: "Podcast at SparQ Social", guest: "Podcast Team", guestEmail: "podcast@example.com", host: "Dre Manning", start: "2026-06-05 13:00", end: "2026-06-05 15:00", date: "2026-06-05", hours: 2, crew: 4, status: "Confirmed", paymentStatus: "Paid", subtotal: 150, platformFee: 22.5, hostPayout: 127.5, total: 172.5, notes: "Podcast block with audio engineer." },
    { id: "bk-1003", propertyId: "modex-studio", property: "MODEx Studio", guest: "Agency Scout", guestEmail: "agency@example.com", host: "Phrazs host", start: "2026-06-08 10:00", end: "2026-06-08 16:00", date: "2026-06-08", hours: 6, crew: 28, status: "Pending Payment", paymentStatus: "Awaiting Capture", subtotal: 1500, platformFee: 225, hostPayout: 1275, total: 1725, notes: "Large production hold. Payment not captured yet." },
    { id: "bk-0998", propertyId: "studio-a-sparq", property: "Studio A | Big Mama's House at SparQ Social", guest: "Music Producer", guestEmail: "music@example.com", host: "Dre Manning", start: "2026-05-21 11:00", end: "2026-05-21 15:00", date: "2026-05-21", hours: 4, crew: 5, status: "Completed", paymentStatus: "Paid Out", subtotal: 220, platformFee: 33, hostPayout: 187, total: 253, notes: "Completed studio session." },
    { id: "bk-0999", propertyId: "vintage-1930s-school", property: "Vintage 1930's School Building", guest: "Film Scout", guestEmail: "film@example.com", host: "Phrazs host", start: "2026-05-24 08:00", end: "2026-05-24 18:00", date: "2026-05-24", hours: 10, crew: 40, status: "Completed", paymentStatus: "Paid Out", subtotal: 1500, platformFee: 225, hostPayout: 1275, total: 1725, notes: "Completed location scout and shoot." },
  ],
  payments: [
    { id: "pay-9001", bookingId: "bk-1001", processor: "Stripe", method: "Card", cardBrand: "Visa", last4: "4242", gross: 1380, fees: 42.3, net: 1337.7, refunded: 0, status: "Captured", capturedAt: "2026-05-29 10:18" },
    { id: "pay-9002", bookingId: "bk-1002", processor: "Stripe", method: "Card", cardBrand: "Mastercard", last4: "4444", gross: 172.5, fees: 6.1, net: 166.4, refunded: 0, status: "Captured", capturedAt: "2026-05-29 11:04" },
    { id: "pay-9003", bookingId: "bk-1003", processor: "Stripe", method: "Card", cardBrand: "Amex", last4: "0005", gross: 1725, fees: 0, net: 0, refunded: 0, status: "Authorized", capturedAt: "Pending" },
    { id: "pay-8998", bookingId: "bk-0998", processor: "Stripe", method: "Card", cardBrand: "Visa", last4: "1881", gross: 253, fees: 8.12, net: 244.88, refunded: 0, status: "Paid Out", capturedAt: "2026-05-21 10:32" },
    { id: "pay-8999", bookingId: "bk-0999", processor: "Stripe", method: "Card", cardBrand: "Discover", last4: "1117", gross: 1725, fees: 51.75, net: 1673.25, refunded: 0, status: "Paid Out", capturedAt: "2026-05-24 07:42" },
  ],
  payouts: [
    { id: "po-7001", host: "Go Bold Studio", bookingId: "bk-1001", amount: 1020, status: "Scheduled", payoutDate: "2026-06-06" },
    { id: "po-7002", host: "Dre Manning", bookingId: "bk-1002", amount: 127.5, status: "Scheduled", payoutDate: "2026-06-07" },
    { id: "po-6998", host: "Dre Manning", bookingId: "bk-0998", amount: 187, status: "Completed", payoutDate: "2026-05-23" },
    { id: "po-6999", host: "Phrazs host", bookingId: "bk-0999", amount: 1275, status: "Completed", payoutDate: "2026-05-26" },
  ],
  calendar: [
    { date: "2026-06-04", property: "Go Bold Studio", status: "Booked", bookingId: "bk-1001", time: "09:00-17:00" },
    { date: "2026-06-05", property: "Podcast at SparQ Social", status: "Booked", bookingId: "bk-1002", time: "13:00-15:00" },
    { date: "2026-06-08", property: "MODEx Studio", status: "Hold", bookingId: "bk-1003", time: "10:00-16:00" },
    { date: "2026-06-10", property: "Vintage 1930's School Building", status: "Available", bookingId: "", time: "All day" },
    { date: "2026-06-11", property: "Studio A | Big Mama's House at SparQ Social", status: "Blocked", bookingId: "", time: "Maintenance" },
  ],
};
