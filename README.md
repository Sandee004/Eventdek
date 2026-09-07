# EventDek

> **Swipe your weekend plans. Discover Nigerian events at the speed of thought.**

EventDek is a gesture-driven discovery concierge built for Nigeria's vibrant tech, business, and cultural hubs. Modeled after modern matchmaking mechanics, it strips out the friction of scattered flyers, fragmented ticket platforms, and endless registration forms.

Browse state-by-state, swipe right to claim an immutable pass with calendar sync, and jump directly to official registration checkouts.

---

## Why EventDek?

Discovering events across Lagos, Abuja, and other states has always been broken—scattered across Lu.ma, Tix.africa, Eventbrite, and Twitter/X threads.

EventDek introduces a fast, consolidated alternative:

- **Fluid Card Deck:** Physics-based gestures powered by Framer Motion let you quickly filter what's happening around you.
- **1-Swipe Intent & Wallet:** Swiping right instantly snapshots event details, venue locations, and check-in QR codes into your personal passbook ("My Dek") while deep-linking to checkout.
- **Offline-First Resilience:** Low cell reception or zero Wi-Fi inside event halls? Your tickets, venue details, scannable QR tokens, and `.ics` calendars work completely offline.
- **Never See the Same Card Twice:** Once you swipe left or right, that card is logged and filtered from future queries across all devices.

---

## How It Works (The Engine Under the Hood)

EventDek pairs a lightweight frontend shell with a high-throughput, low-latency FastAPI backend:

```text
[ Attendee Swipes Right ]
          │
          ├──> 1. Frontend fires POST /events/swipe to FastAPI (<15ms)
          │       - Commits interaction to database
          │       - Freezes event details into immutable snapshot
          │       - Syncs scannable token to device cache for offline gate presentation
          │
          └──> 2. Card flies off-screen & launches official registration gateway
                  - Attendee completes final checkout on Eventbrite, Lu.ma, or Tix
```

### Key Engineering Highlights

- **Zero-Redundancy Card Pool:** Events are stored once per state in a shared database pool. Personalized user decks are formed dynamically using sub-15ms exclusion queries.

- **Immutable Snapshot Strategy:** When saving an event, all display metadata is snapshotted directly into the user's registration record. Organizer updates or backend maintenance never break existing attendee passes.

- **Automated Daily Pruning (`pg_cron`):** PostgreSQL executes a nightly routine to purge expired listings, cascading away dead swipe records without touching saved user wallets.

- **Background Ingestion Pipeline:** An automated APScheduler worker aggregates public listings every 6 hours, mapping venue locations across Nigerian states and normalizing dates into UTC.

---

## 🛠️ Tech Stack

| Layer               | Technologies                                                          |
| ------------------- | --------------------------------------------------------------------- |
| **Frontend**        | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend**         | Python 3.11+, FastAPI, SQLAlchemy (Asyncio), Pydantic                 |
| **Database & Auth** | Supabase (PostgreSQL), JWT Authentication, `pg_cron`<br>              |
| **Ingestion**       | Playwright, BeautifulSoup4, APScheduler                               |
| **Deployment**      | Single unified monorepo container deployed on Render                  |

---

## 📄 License

Distributed under the MIT License. Built with ❤️ for the Nigerian developer and creator ecosystem.
