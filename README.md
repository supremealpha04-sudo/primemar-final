# PrimeMar

A creator-first social media platform built with Next.js 15, Supabase, and Flutterwave.

## Features

- **Creator Monetization**: Hidden eligibility system (5K followers + 1K premium subscribers for 4 months)
- **Multiple Revenue Streams**: Subscriptions, post boosts, boost bounties, content futures, virtual gifts
- **Engagement Mining**: Users earn points for quality engagement
- **Ghost Mode**: Anonymous posting with earnings potential
- **Time-Locked Content**: Premium early access
- **Collaborative Posts**: Multi-creator revenue sharing
- **AI-Powered**: Content assistant, moderation, trend prediction
- **Admin System**: Full moderation, payouts, analytics, audit logging

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Payments | Flutterwave (Subscriptions, Boosts, Payouts) |
| State | Zustand, TanStack Query |
| UI | shadcn/ui, Lucide Icons, Framer Motion |

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/primemar.git
cd primemar
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
# Fill in your Supabase and Flutterwave credentials
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Enable Storage bucket: `posts`
4. Set up Flutterwave webhook URL: `https://your-app.com/api/webhooks/flutterwave`

### 4. Flutterwave Setup

1. Create a Flutterwave account
2. Get your API keys from the dashboard
3. Create payment plans for Premium subscriptions
4. Configure webhook URL in Flutterwave dashboard

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
primemar/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (main)/           # Main app pages (feed, profile, etc.)
│   │   ├── admin/            # Admin portal
│   │   ├── api/              # API routes (payments, webhooks)
│   │   └── auth/callback/    # OAuth callback
│   ├── components/
│   │   ├── feed/             # Feed components
│   │   ├── creator/          # Creator dashboard components
│   │   ├── admin/            # Admin components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utilities (Supabase, Flutterwave)
│   ├── hooks/                # Custom hooks (auth, etc.)
│   ├── types/                # TypeScript types
│   └── utils/                # Helper functions
├── supabase/
│   └── migrations/           # Database migrations
│   └── functions/            # Edge functions
├── public/                   # Static assets
└── package.json
```

## Admin Access

To grant admin access:

```sql
INSERT INTO admin_profiles (id, role, department, is_active)
VALUES ('user-uuid-here', 'super', 'Operations', true);
```

Admin roles: `super`, `ops`, `finance`, `support`, `content`, `analytics`

## Monetization Flow

```
User subscribes to Creator ($4.99/mo)
  → Flutterwave processes payment
  → 70% to Creator, 30% to Platform
  → Creator earnings updated in real-time
  → Auto-payout weekly via Flutterwave Transfers
```

## Hidden Creator Eligibility

Criteria (never shown to users):
- 5,000+ followers
- 1,000+ premium subscribers for 4 consecutive months
- Account age ≥ 6 months
- Zero strikes in last 90 days
- Minimum engagement rate threshold

## License

MIT License - see LICENSE file
