<div align="center">

# Wish It

**A modern, social wishlist platform — share what you love, never give a bad gift again.**

Built with Next.js 16, React 19, Supabase, and TypeScript.

</div>

---

## About

Wish It is a full-stack wishlist application that lets users create, organise and share wishlists with friends and family. Friends can reserve gifts behind the scenes so surprises stay intact, browse trending public wishlists for inspiration, and get AI-powered gift suggestions tailored to the recipient.

This project was developed as a senior-year capstone — the goal was to build a production-ready social product end-to-end: authentication, a real-time-friendly data layer, storage, a polished UI, and AI features.

## Features

- **Wishlists** — cover photos or colour presets, visibility controls (public / friends / private), occasion tags, gift-for-someone-else mode
- **Wishes** — add from a product URL with automatic scraping of title, image, price and description (JSON-LD + Open Graph + microdata)
- **Reservations** — reserve a friend's wish without the owner knowing who reserved it; mark as bought or release
- **Friends** — requests, suggestions (friends-of-friends, then same-country), private accounts
- **Activity feed** — follow what friends are adding publicly
- **Notifications** — in-app bell for friend requests, reservations, etc.
- **Inspiration** — trending public wishlists, and an AI Gift Finder that grounds suggestions in real platform data
- **Profile** — avatar upload with crop, bio, language, country, privacy toggle
- **Help centre** — searchable FAQ

## Tech stack

| Layer          | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React Server Components)                  |
| UI             | React 19, Tailwind CSS 4, custom design system                    |
| Language       | TypeScript                                                        |
| Database       | Supabase (Postgres) with Row Level Security                       |
| Auth           | Supabase Auth (`@supabase/ssr`)                                   |
| Storage        | Supabase Storage (avatars, wishlist covers)                       |
| AI             | Groq (Llama 3.3 70B) via the OpenAI SDK for gift recommendations  |
| Deployment     | Docker + docker-compose, Vercel-ready                             |
| Quality        | ESLint, Prettier, TypeScript strict mode, GitHub Actions CI       |

## Getting started

### Prerequisites

- Node.js 20 or later
- npm (or pnpm / yarn / bun)
- A Supabase project — [create one for free](https://supabase.com)

### Installation

```bash
git clone https://github.com/Khodor-Jarkas/Wishlist.git
cd Wishlist
npm install
```

### Environment

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

Required variables (see [`.env.example`](.env.example) for the full list):

| Variable                        | Where to find it                                           |
| ------------------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Project Settings → API               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase dashboard → Project Settings → API (server-only) |
| `GROQ_API_KEY`                  | [console.groq.com](https://console.groq.com) (optional — powers AI Gift Finder) |

### Database

This repository does not ship schema migrations publicly. To provision a database, apply the project's SQL schema to your Supabase instance (tables: `profiles`, `wishlists`, `wishes`, `reservations`, `friendships`, `wishlist_followers`, `activity`, `notifications`) and create the `avatars` and `wishlist-covers` storage buckets with appropriate RLS policies.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker

```bash
docker compose up --build
```

## Scripts

| Command             | What it does                                      |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack, 4 GB heap)       |
| `npm run build`     | Production build                                  |
| `npm run start`     | Serve the production build                        |
| `npm run lint`      | ESLint                                            |
| `npm run lint:fix`  | ESLint with autofix                               |
| `npm run format`    | Prettier write                                    |
| `npm run typecheck` | TypeScript, no emit                               |

## Project structure

```
src/
├── app/                 # Next.js App Router
│   ├── (app)/           # Authenticated app surface (header + footer layout)
│   ├── inspire/         # Public inspiration page
│   ├── wishlists/       # Public wishlist viewer
│   └── auth/            # Login / signup / callbacks
├── components/
│   ├── auth/            # ProfilePanel, ProfileSettingsClient, ...
│   ├── friends/         # FriendsDrawer, suggestions, requests
│   ├── wishlist/        # WishlistCard, AddWishModal, ...
│   ├── inspire/         # TrendingCard, InspireTabs, AIGiftFinder
│   ├── help/            # HelpClient
│   ├── layout/          # Header, Footer, AppHeader
│   └── ui/              # Button, Input, Select, Modal, Drawer, ...
├── lib/
│   ├── actions/         # Server actions (wishes, friends, auth, inspire, ...)
│   ├── supabase/        # SSR + browser clients
│   └── countries.ts     # ISO-3166 country list
├── context/             # React context providers
└── types/               # Shared TypeScript types
```

## Author

**Khodor El Jarkas** — [@Khodor-Jarkas](https://github.com/Khodor-Jarkas)

## License

This project is released for educational and portfolio purposes.
