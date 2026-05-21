<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/NextAuth-v5-7B3FE4?style=for-the-badge&logo=auth0" alt="NextAuth v5" />
  <img src="https://img.shields.io/badge/Stripe-Subscriptions-635BFF?style=for-the-badge&logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui" alt="shadcn/ui" />
</div>

<br />

<div align="center">
  <h1>Fabinex</h1>
  <p><strong>Personal, Family & Society Finance Management — All in One Place</strong></p>
  <p>Track income and expenses individually, with your family, or within your community/society. Built for the Indian market with INR currency and Indian number formatting.</p>
</div>

---

## What is Fabinex?

Fabinex is a **full-stack finance tracking web application** that lets you manage money at three levels:

1. **Personal** — Log your daily income & expenses, view cash flow charts, track spending habits
2. **Family** — Create a family group, add members, track shared household expenses together
3. **Society / Community** — Manage maintenance collections, utility bills, security salaries, and other community finances

It supports **Google & Facebook login**, **Stripe subscriptions**, **email password reset**, and a clean modern UI.

---

## Key Features

### Authentication
- Login with **Google** or **Facebook**
- Register with **email & password** (hashed with bcryptjs)
- **Forgot password** flow with email reset link
- **Change password** from account settings
- Profile setup (name + 10-digit Indian phone number)

### Personal Finance
- Add **income** or **expense** transactions with amount, date, description & category
- Pre-built categories: Salary, Freelance, Groceries, Rent, Utilities, Shopping, Healthcare, etc.
- Custom categories
- **Monthly cash flow chart** (income vs expenses for any year)
- View & filter past transactions by month, year, or type

### Family Finance
- Create a **family group** and invite members (max 1 family per person)
- **Family dashboard** shows combined cash flow of all members
- See **per-member** income & expense summaries
- **Transfer money** between family members
- Filter transactions by type, month, year, or all history

### Society / Community Finance
- Create a **society/community group** (max 1 society per person)
- Perfect for residential societies, apartment complexes, housing communities
- **Society dashboard** shows:
  - Society-wide annual cash flow
  - Per-member summaries
  - Recent society & personal transactions
- Society categories: Maintenance Collection, Parking Collection, Security Salary, Water Bill, Electricity Bill, Repairs, Events

### Billing & Subscriptions (Stripe)

| Plan | Price (INR) | Features |
|---|---|---|
| **Base** | ₹11/month | Personal dashboard, society dashboard, monthly insights |
| **Pro** | ₹19/month | Everything in Base + advanced analytics, early features |

### Notifications
- Get notified when added to a society group
- Read/unread tracking

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | MongoDB + Mongoose |
| **Auth** | NextAuth v5 (Google, Facebook, Credentials) |
| **Styling** | Tailwind CSS v4, shadcn/ui, Radix UI |
| **Forms** | react-hook-form + Zod |
| **Charts** | Recharts |
| **Payments** | Stripe (Checkout + Subscriptions) |
| **File Uploads** | UploadThing (profile images) |
| **Email** | Nodemailer + Ethereal SMTP |
| **Icons** | Lucide |
| **Font** | Poppins (Google Fonts) |
| **Data Fetching** | SWR, server-only functions |

---

## Project Structure

```
fabinex/
├── app/                    # Next.js App Router (pages & API)
│   ├── (app)/              # Authenticated pages (dashboard, family, groups, account)
│   ├── (auth)/             # Login, signup, forgot/reset password
│   ├── api/                # API routes (auth, billing, groups, families, users, etc.)
│   ├── pricing/            # Subscription pricing page
│   └── page.tsx            # Landing page
├── auth.ts                 # NextAuth v5 configuration
├── components/             # Reusable UI components
│   └── ui/                 # shadcn/ui primitives
├── data/                   # Server-side data fetching functions
├── lib/                    # Utilities, validators, constants
├── models/                 # Mongoose models (User, Transaction, Family, Group, etc.)
├── scripts/                # Database migration scripts
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

### Database Models

- **User** — email, name, phone, image, password hash, reset tokens
- **Transaction** — user, amount, description, date, category, type (income/expense), scope (personal/family/society)
- **Category** — name, type, scope, system flag
- **Family** — name, owner, members (max 1 family per user)
- **Group** (Society) — name, owner, members (max 1 society per user)
- **Notification** — user, title, message, read status, type (group invite)

### Account Scope

Every transaction has an `accountScope`:
- `personal` — only you see it
- `family` — all family members see it
- `society` — all society members see it (linked to a group)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- MongoDB (local or Atlas)
- Stripe account
- UploadThing account
- Google & Facebook OAuth credentials

### Setup

```bash
# Clone
git clone https://github.com/jayeshgith/Fab_inex.git
cd Fab_inex

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<database>
MONGODB_DB_NAME=pintrust

# NextAuth
AUTH_SECRET=<your-secret>
AUTH_URL=http://localhost:3000

# Google OAuth
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>

# Facebook OAuth
AUTH_FACEBOOK_ID=<your-facebook-app-id>
AUTH_FACEBOOK_SECRET=<your-facebook-app-secret>

# SMTP (Ethereal for dev)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<ethereal-user>
SMTP_PASSWORD=<ethereal-pass>
SMTP_FROM=<ethereal-email>

# App URL
NEXT_PUBLIC_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_BASE_MONTHLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...

# UploadThing
UPLOADTHING_TOKEN=<your-token>

# Branding
NEXT_PUBLIC_APP_NAME=Fabinex
NEXT_PUBLIC_APP_DESCRIPTION="Finance Management App"
```

### Run Locally

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run migrate:account-scope` | Migrate legacy transactions |

---

## Deployment (Vercel)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repo
3. Add all environment variables from `.env.local`
4. Change `AUTH_URL` and `NEXT_PUBLIC_URL` to your Vercel domain (e.g. `https://fab-inex.vercel.app`)
5. Deploy

> **Note:** Add `0.0.0.0/0` to MongoDB Atlas Network Access so Vercel can connect. Update OAuth redirect URIs in Google & Facebook developer consoles.

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit (`git commit -m "Add foo"`)
4. Push (`git push origin feature/foo`)
5. Open a Pull Request

---

## License

Private / Proprietary — All rights reserved.

---

<div align="center">
  <sub>Built with Next.js, MongoDB, Tailwind CSS & shadcn/ui</sub>
</div>
