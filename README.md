<div align="center">

<img src="public/wish-it-icon.png" alt="Wish It" width="72" height="72" />

# Wish It

**A modern social wishlist platform — share what you love, never give a bad gift again.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Educational-blue)](#license)

</div>

---

## Overview

Wish It is a full-stack social wishlist application built as a senior-year capstone project at the Lebanese International University. It lets users create and share wishlists with friends and family, coordinate gift-giving behind the scenes so surprises stay intact, and discover trending public wishlists for inspiration.

The goal was to build a production-ready product end-to-end — authentication, a real-time-friendly data layer, cloud storage, a polished responsive UI, and AI-powered features — all with a clean, maintainable codebase.

---

## Features

### Wishlists
- Create wishlists with a title, description, cover photo or colour preset
- Three visibility modes: **Public** (anyone), **Hidden** (link-only), **Private** (owner only)
- Occasion tags (birthday, Christmas, wedding, graduation, …) with optional event dates
- **Collaborative wishlists** — invite friends as co-owners; they appear next to you side by side
- **On behalf mode** — create a wishlist for someone else (child, parent, …) with a sub-account profile

### Wishes
- Add wishes manually or paste a product URL — title, image, price, and description are scraped automatically
- Priority levels (Normal / High / Must-have)
- Move wishes between wishlists

### Gift coordination
- **Reserve** a wish without the owner seeing who reserved it — surprises stay intact
- Mark a reserved wish as **Bought** once purchased
- Reservations release automatically if the wish is deleted

### Social
- **Friend requests** — send, accept, decline, cancel, remove
- **Friend suggestions** — friends-of-friends, then same-country, then global
- **Private accounts** — profile and wishlists hidden from non-friends
- **Activity feed** — see what friends are creating and adding, including collaborative wishlist events
- **Notifications** — in-app bell for friend requests, reservations, purchases, event reminders, and collaboration invites; real-time badge updates via Supabase Realtime

### Inspiration
- **Trending public wishlists** browseable across the whole platform
- **AI Gift Finder** — describe who you're shopping for and get suggestions grounded in real platform data

### Profile & settings
- Avatar upload with automatic image compression
- Bio, country, language, date of birth, gender
- Privacy toggle

### Other
- Fully responsive — desktop, tablet, and mobile with iOS/Android safe-area support
- Searchable Help Centre / FAQ

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components, Server Actions |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS 4, custom inline design system |
| Database | Supabase (PostgreSQL) with Row Level Security on every table |
| Auth | Supabase Auth with `@supabase/ssr` (cookie-based, server-side) |
| Storage | Supabase Storage — `avatars` and `wishlist-covers` buckets |
| AI | Groq (Llama 3.3 70B) via the OpenAI-compatible SDK |
| Realtime | Supabase Realtime — live notification badge |
| Deployment | Vercel (primary) · Docker + docker-compose (self-host) |
| Quality | ESLint, Prettier, TypeScript strict, GitHub Actions CI |

---

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project — [create one free](https://supabase.com)
- *(Optional)* A Groq API key for the AI Gift Finder — [console.groq.com](https://console.groq.com)

### 1 — Clone & install

```bash
git clone https://github.com/Khodor-Jarkas/wishlistplatform.git
cd wishlistplatform
npm install
```

### 2 — Environment variables

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API *(server-only)* |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — optional |

### 3 — Database

Apply the project's SQL schema to your Supabase project. The schema covers:

- **Tables:** `profiles`, `wishlists`, `wishlist_collaborators`, `wishlist_followers`, `wishes`, `reservations`, `friendships`, `activity`, `notifications`
- **Row Level Security** policies on every table
- **Storage buckets:** `avatars`, `wishlist-covers`
- **Database triggers** for automatic notifications on friendships and reservations

### 4 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker

```bash
docker compose up --build
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript, no emit |

---

## Project structure

```
src/
├── app/
│   ├── (app)/           # Authenticated surface — shared header/nav layout
│   │   ├── dashboard/   # User's own wishlists
│   │   ├── wishlists/   # Wishlist detail pages
│   │   ├── wishes/      # Wish detail pages
│   │   ├── users/       # Public user profiles
│   │   ├── friends/     # Friend management
│   │   ├── activity/    # Social activity feed
│   │   ├── inspire/     # Trending + AI Gift Finder
│   │   └── settings/    # Profile settings
│   ├── (auth)/          # Sign-up flow, email confirmation
│   └── api/             # Route handlers (scraping, AI, event reminders)
├── components/
│   ├── auth/            # AuthModal, ProfilePanel, ProfileSettingsClient
│   ├── friends/         # FriendsDrawer, suggestions, requests
│   ├── wishlist/        # WishlistCard, WishlistDetail, AddWishModal, …
│   ├── notifications/   # NotificationBell, real-time drawer
│   ├── inspire/         # TrendingCard, InspireTabs, AIGiftFinder
│   ├── layout/          # AppHeader, MobileBottomNav, Footer
│   └── ui/              # Button, Input, Select, Modal, Drawer, Container, …
├── lib/
│   ├── actions/         # Server Actions — wishlists, wishes, friends, auth, …
│   ├── supabase/        # SSR + browser Supabase clients
│   ├── hooks/           # useMediaQuery, useDebounce
│   └── utils/           # Formatters, image compression, slugify, …
├── context/             # React context — AuthModal, AddWishModal
└── types/               # Shared TypeScript interfaces
```

---

## Author

**Khodor El Jarkas** — Lebanese International University, Computer Science  
GitHub: [@Khodor-Jarkas](https://github.com/Khodor-Jarkas)

---

## License

Released for educational and portfolio purposes. Not licensed for commercial use.
