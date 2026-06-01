# Stripe setup for Phrazs

This integration uses Stripe Checkout, so card entry happens on Stripe's hosted checkout page. Do not put a Stripe secret key in React code.

## 1. Create Stripe test keys

1. Open the Stripe Dashboard.
2. Make sure test mode is enabled.
3. Go to Developers -> API keys.
4. Copy the Secret key that starts with `sk_test_`.

## 2. Create local environment file

Copy `.env.example` to `.env`, then set:

```bash
STRIPE_SECRET_KEY=sk_test_your_real_test_key
SITE_URL=http://127.0.0.1:5173
STRIPE_SERVER_PORT=4242
ADMIN_EMAIL=contact@phrazs.com
ADMIN_PASSCODE=use_a_long_private_passcode
ADMIN_SESSION_SECRET=use_a_32_plus_character_random_secret
```

## 3. Run locally

Open two terminals:

```bash
npm run api:dev
```

```bash
npm run dev
```

Then book a space and use Stripe's test card:

```text
4242 4242 4242 4242
```

Use any future expiration date, any three-digit CVC, and any ZIP code.

## 4. Production note

The frontend can be static, but `/api/create-checkout-session` and `/api/checkout-session` must run on a real server or serverless function with `STRIPE_SECRET_KEY` configured privately. If the API is on a different domain, set this in the frontend environment before building:

```bash
VITE_API_BASE=https://your-api-domain.com
```

The local API records paid Stripe bookings in server memory so they appear in the secured admin dashboard during the same server run. For production-grade fulfillment, add a Stripe webhook for `checkout.session.completed` and persist bookings in a database.

The same API server also protects the admin dashboard. Keep `ADMIN_PASSCODE` and `ADMIN_SESSION_SECRET` private in your hosting environment.
