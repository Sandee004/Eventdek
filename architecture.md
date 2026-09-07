# EventDek System Architecture & Technical Overview

EventDek is a gesture-driven event discovery concierge across Nigerian tech and lifestyle hubs. Built for high responsiveness and resilient offline usage, it pairs a fast swipe-deck interaction with zero-friction intent tracking, persistent offline pass storage, and deep links to official event checkouts.

---

## 1. High-Level Architecture Topology

```text
                  +------------------------------------+
                  |  PWA / React SPA (Vite + Workbox)  |
                  |  - Local Cache-and-Revalidate Pass |
                  |  - Offline Scannable QR Codes      |
                  +-----------------+------------------+
                                    | REST API / JSON (JWT Auth)
                                    v
                  +------------------------------------+
                  |          FastAPI Backend           |
                  +----+-------------------+-----------+
                       |                   |
    Periodic Ingestion |                   | Deck Queries & Swipes
    (APScheduler: 6h)  v                   v
       +--------------------+     +-----------------------+
       | Playwright Scraper |     | PostgreSQL (Supabase) |
       | & Extraction Engine|     +-----------+-----------+
       +--------------------+                 |
                                              | Nightly Cleanup (03:00 UTC)
                                              v
                                  +-----------------------+
                                  |   pg_cron Purge Job   |
                                  +-----------------------+
```

---

## 2. Core Discovery & Interaction Engine

### The Shared Pool & Exclusion Model

To guarantee sub-15ms card delivery without storing redundant decks for thousands of users:

- **Global Pool:** Active upcoming events across Nigeria are kept once in the database organized by region/state.

- **Swipe Ledger:** Swiping left (pass) or right (save) commits a single compact row into respective table. A composite unique index prevents duplicate records from rapid taps.

- **Deck Query:** `GET /events/deck` fetches upcoming active events for the user's targeted state, skipping any event ID already present in their database history:

---

## 3. The Registration Snapshot & Intent Redirect Flow

Rather than maintaining brittle browser bots against third-party anti-bot mitigations (Cloudflare Turnstile, captchas), EventDek separates discovery from external registration:

```text
[ User Swipes Right ]
          │
          ├──> 1. Frontend fires POST /events/swipe to FastAPI
          │       - Commits swipe direction
          │       - Freezes event details into immutable snapshot
          │
          └──> 2. Card animates off-screen and launches `event.source_url`
                  - Attendee completes checkout directly on Eventbrite, Tix, or Lu.ma

```

### Why We Snapshot Registrations

When a right-swipe occurs, current event metadata is copied into a separate record:

- **Immutable Wallet Passes:** The user's pass in "My Passes" retains countdown timers, venue directions, and calendar exports forever, even if the organizer edits or deletes the external listing.

- **Safe Table Purges:** Expired listings can be wiped from database without corrupting user ticket histories.

---

## 4. Offline Passbook & PWA Resilience ("My Passes")

To ensure attendees can enter event halls with zero cellular connectivity or congested Wi-Fi:

```text
                    [ App Opens / Mounts MyDek ]
                                  │
                  Read Cached Passes from Storage
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
         [ Device Online ]                 [ Device Offline ]
                 │                                 │
     Fetch /events/my-dek                  Mount Cached Passes
                 │                                 │
    Update Storage & Reset Timestamp       Display Amber Offline Notice
                 │                                 │
                 └────────────────┬────────────────┘
                                  ▼
                     Display Verified Passbook
                     - Vector QR Code Generation
                     - Offline Client-side .ics Download

```

- **Stale-While-Revalidate Caching:** The wallet reads instantly from device storage (`localStorage` / IndexedDB). If network is present, it revalidates silently against `/events/my-dek` and syncs the cache.
- **Network Interruption Handling:** If the device loses connection, the UI presents an offline status indicator showing the last successful sync timestamp, while retaining access to the full pass list.
- **Vector QR Rendering:** Scannable check-in tokens render client-side via `qrcode.react`, allowing door scanners to inspect and scan valid tokens without internet connectivity.
- **Zero-Network `.ics` Generation:** Calendar invites generate locally via in-browser `Blob` streams rather than relying on external server endpoints.

---

## 5. Automated Database Maintenance (pg_cron)

A single daily cron job runs inside Supabase PostgreSQL at **03:00 UTC** to prevent database bloat:

---

## 6. Background Ingestion & Scraper Pipeline

An asynchronous scraper operates on a schedule (every 6 hours) via APScheduler inside FastAPI’s lifespan:

- **Data Sources:** Extracts public feeds from Eventbrite, Tix.africa, and regional listings using Playwright and BeautifulSoup.

- **Location Mapping:** Resolves venue text to Nigerian states (Lagos, Abuja, Rivers, Oyo, Kano, Enugu, Virtual) using keyword classification dictionaries.

- **Deduplication:** Skips existing items by matching before creating new database rows.

---

## 7. Deployment & Runtime Topology (Render Monorepo)

EventDek runs as a unified single-service container on Render with zero CORS configuration overhead:

- **Build Step:** Compiles the React SPA and Workbox service workers into `frontend/dist` (`npm run build`) and installs Python dependencies (`pip install -r requirements.txt`).

- **Runtime Step:** `uvicorn` boots FastAPI, serving all `/api` endpoints and mounting `frontend/dist` as an SPA fallback for static asset delivery and client-side routing.
