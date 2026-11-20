# Adi Cetak

Marketplace digital printing and advertising built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Responsive marketplace-style home page
- Product categories, promo page, flash sale, and recommendations
- Dynamic material, size, custom dimension, finishing, quantity, and price selection
- Persistent shopping cart
- Login/profile flow and required address fields at checkout
- Courier selection and shipping API adapter
- Xendit invoice API and callback webhook
- Order payment/status page

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Xendit

Set `XENDIT_SECRET_KEY` and `XENDIT_CALLBACK_TOKEN` in `.env.local`, then register this callback URL in the Xendit dashboard:

```text
${NEXT_PUBLIC_APP_URL}/api/xendit/webhook
```

Without Xendit credentials, the app remains usable in demo mode.

## Shipping

`POST /api/shipping` accepts `{ destination, weight }` and currently returns representative courier data. Replace it with an Indonesian shipping provider integration using `SHIPPING_PROVIDER_API_KEY`.
