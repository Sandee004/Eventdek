# EventDek System Architecture

EventDek is a web platform for discovering local events across Nigerian states using a gesture-driven card deck (modeled after Tinder/Sorce). It enables zero-friction, 1-swipe RSVPs for free events and contained in-app ticketing for paid ones.

---

## 1. High-Level Architecture Diagram

```
             +-----------------------------------+
             | React SPA (Vite + Framer Motion)  |
             +-----------------+-----------------+
                               | REST API / JSON
                               v
             +-----------------------------------+
             |          FastAPI Backend          |
             +--------+--------+--------+--------+
                      |        |        |
    Periodic Scraping |        |        | Headless RSVP (FastAPI BackgroundTasks)
                      v        |        v
       +--------------------+  |  +--------------------------------+
       | APScheduler Worker |  |  | Playwright Registration Worker |
       +--------------------+  |  +--------------------------------+
                               | Ingestion & Deck Queries
                               v
                   +-----------------------+
                   | PostgreSQL (Supabase) |
                   +-----------+-----------+
                               |
                               | Nightly Database Purge
                               v
                   +-----------------------+
                   |   pg_cron Purge Job   |
                   +-----------------------+

```

---

## 2. Core Discovery & Interaction Engine

### The Shared Pool & Fast Exclusion Model

To keep swipe deck responses blazing fast without saving duplicate queues per user:

- **Global Pool:** All upcoming active events across Nigeria are kept in the single `events` table.
- **Swipe Ledger:** Swiping left or right writes a compact row to `user_swipes`[cite: 5]. A unique constraint on `(user_id, event_id)` stops double writes from accidental taps.
- **Deck Query:** When opening the app, `GET /events/deck` pulls future events for the chosen Nigerian state, ignoring any card ID the user has already touched:

```sql
SELECT * FROM events
WHERE state_id = :target_state
  AND start_time >= NOW() - INTERVAL '1 day'
  AND is_active = TRUE
  AND id NOT IN (
      SELECT event_id FROM user_swipes WHERE user_id = :current_user_id
  )
ORDER BY start_time ASC;
```

---

## 3. Dynamic Questions & Registration Snapshot Pattern

```
                     [ User Swipes Right ]
                               │
               Does Event Require Custom Questions?
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
              [ NO ]                        [ YES ]
                │                             │
    [ Immediate Registration ]       [ Intercept Swipe ]
    - Save UserSwipe                 - Card pauses on screen
    - Freeze Snapshot in DB          - Micro-modal opens for answers
    - Trigger Background Worker      - User submits answers
                │                             │
                └──────────────┬──────────────┘
                               ▼
                [ Finalize RSVP & Background Tasks ]
                - Save Custom Answers JSON in DB
                - Enqueue Playwright Form-Submitter

```

### Why We Snapshot Registrations

When a user registers, key event details (`event_title`, `event_banner_url`, `event_venue_name`, `event_start_time`, `event_end_time`, `ticket_tier`, `amount_paid`, `currency`, `custom_answers`) are copied straight into the `registrations` row:

1. **Unbreakable Ticket Passes:** The user's ticket receipt in "My Dek" never changes, even if the host edits the event or deletes their listing later.

2. **Safe Database Pruning:** We can hard-delete expired events from `events` without breaking past ticket records.

---

## 4. Background Form Automation (Playwright Worker)

When a user swipes right on an aggregated free event (e.g., Eventbrite), the backend handles the actual registration using Playwright in the background:

1. **Non-Blocking Execution:** FastAPI’s `BackgroundTasks` executes the browser worker asynchronously so the user's swipe response completes within milliseconds.

2. **Dynamic Form Filling:** The worker boots headless Chromium, navigates to the event checkout page, auto-fills standard attendee fields (`name`, `email`, `phone`), and enters dynamic answers from `custom_answers`.

3. **Status Updates:** The row status in `registrations` updates to `confirmed` on success or flags `action_required` if a captcha or roadblock is encountered.

---

## 5. Automated Maintenance & Cleanup (pg_cron)

A single daily cron job runs directly inside Supabase PostgreSQL at **03:00 UTC** to prevent database bloat:

```sql
CREATE OR REPLACE FUNCTION purge_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN     -- Deleting past events cascades and cleans up related swipe rows     DELETE FROM events     WHERE end_time < NOW() - INTERVAL '1 day'; END; $$;

SELECT cron.schedule(
    'daily-event-purge',
    '0 3 * * *',
    'SELECT purge_expired_events();'
);

```

### Cascade Mechanics

- **`user_swipes` (`ON DELETE CASCADE`):** When an old event is removed, its dead swipe history is deleted automatically.

- **`registrations` (`ON DELETE SET NULL`):** When an old event is deleted, the user's registration row remains safe and sound with its frozen snapshot data.

---

## 6. Background Ingestion & Scraper Pipeline

An async `APScheduler` job runs inside the FastAPI process to fetch and update event listings:

- **Cadence:** Executes every 6 hours and runs once immediately upon server boot.

- **State Mapping:** Resolves Nigerian locations across all 36 states + FCT using dynamic keyword dictionaries.

- **Accurate Price Extraction:** Inspects live DOM price elements and currency symbols (`NGN`, `USD`, `EUR`, `GBP`) with fuzzy date parsing.

- **Deduplication:** Prevents duplicate entries using database lookups on `source_url` and `title`.

---

## 7. Deployment Topology (Render Monorepo)

EventDek runs as a unified full-stack service on Render with zero CORS issues:

- **Build Phase:** Compiles the React frontend (`npm run build`) into `frontend/dist` and installs backend dependencies (`pip install -r requirements.txt`).

- **Runtime Phase:** Uvicorn runs FastAPI, which serves the `/api` routes and statically hosts `frontend/dist` with an SPA fallback for client-side pages.

```

```

# EventDek

> **A swipe-driven event discovery concierge across Nigerian tech and social hubs.** Browse state-by-state, swipe right to save immutable passes with calendar sync, and jump directly to official registration gateways.

---

## Architecture Overview

```text
                  +-----------------------------------+
                  | React SPA (Vite + Framer Motion)  |
                  +-----------------+-----------------+
                                    | REST API / JSON
                                    v
                  +-----------------------------------+
                  |          FastAPI Backend          |
                  +----+-------------------+--------+-+
                       |                   |        |
    Periodic Ingestion |                   |        | Exposes /metrics
    (APScheduler: 6h)  v                   v        v
       +--------------------+     +-------------+  +------------+
       | Playwright Scraper |     | PostgreSQL  |  | Prometheus |
       | & Extraction Engine|     | (Supabase)  |  +-----+------+
       +--------------------+     +------+------+        | Scrapes every 15s
                                         |               v
                                         | Daily Purge +------------+
                                         v             |  Grafana   |
                                  +--------------+     | Dashboards |
                                  |   pg_cron    |     +------------+
                                  +--------------+

```

---

## Core Discovery & Interaction Engine

### The Shared Pool & User Exclusion Model

To deliver sub-15ms deck response times without maintaining expensive per-user card queues in cache:

- **Global Pool:** Upcoming events are persisted once in `events` per region/state.

- **Swipe Ledger:** Swiping left (pass) or right (save) writes a single record to `user_swipes`. A composite unique constraint on `(user_id, event_id)` prevents duplicate records from rapid taps.

- **Deck Query:** `GET /events/deck` queries upcoming events for the target Nigerian state, filtering out every event ID already touched by the user:

```sql
SELECT * FROM events
WHERE state_id = :target_state
  AND start_time >= NOW() - INTERVAL '1 day'
  AND is_active = TRUE
  AND id NOT IN (
      SELECT event_id FROM user_swipes WHERE user_id = :current_user_id
  )
ORDER BY start_time ASC
LIMIT 15;

```

---

## Registration Snapshot & Outbound Redirect Flow

Rather than executing fragile headless browser bots against anti-bot challenges (Cloudflare, Turnstile) on third-party checkouts, EventDek separates discovery from external registration:

```text
[ User Swipes Right ]
          │
          ├──> 1. Frontend fires POST /events/swipe to FastAPI
          │       - Records swipe direction to `user_swipes`
          │       - Freezes event details into `registrations` snapshot
          │
          └──> 2. Card animates completely off-screen, then launches `event.source_url`
                  - Attendee finishes registration directly on Eventbrite, Tix, or Lu.ma

```

### Why We Snapshot Registrations

When a user swipes right, the event's current display fields (`event_title`, `event_banner_url`, `event_venue_name`, `event_start_time`, `event_end_time`, `event_source_url`) are copied directly into the `registrations` row:

- **Immutable Wallet Passes:** The user's ticket in "My Dek" retains countdown timers, venue directions, and `.ics` / Google Calendar sync even if the host edits or cancels the external listing.

- **Safe Table Purges:** Expired records in `events` can be purged without emptying past passes stored in user wallets.

---

## Automated Database Maintenance (`pg_cron`)

A single cron job runs daily inside Supabase PostgreSQL at **03:00 UTC** to prevent table bloat:

```sql
CREATE OR REPLACE FUNCTION purge_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deleting past events automatically cascades to unneeded swipe rows
    DELETE FROM events
    WHERE end_time < NOW() - INTERVAL '1 day';
END;
$$;

SELECT cron.schedule(
    'daily-event-purge',
    '0 3 * * *',
    'SELECT purge_expired_events();'
);

```

### Cascade Rules

- **`user_swipes` (`ON DELETE CASCADE`):** When an expired event is purged, its past pass/swipe rows are removed automatically.

- **`registrations` (`ON DELETE SET NULL`):** When an event is purged, the registration entry remains intact with its frozen snapshot data intact.

---

## Background Ingestion & Scraper Pipeline

An asynchronous worker runs inside the FastAPI process to keep the deck populated:

- **Scheduler:** Managed by APScheduler inside FastAPI’s lifespan context, firing every 6 hours with a bootstrap run on server boot.

- **Playwright + BeautifulSoup Engine:** Crawls public event feeds across major Nigerian tech and culture hubs (Lagos, Abuja, Rivers, Oyo, Kano, Enugu, Virtual).

- **Data Normalization:** Parses natural-language dates into UTC timestamps, matches venues to state identifiers, and extracts multi-currency ticket prices.

- **Deduplication:** Validates records against `source_url` and `title` before committing new database rows.

---

## Observability & Monitoring (Prometheus + Grafana)

The event ingestion pipeline is instrumented with Prometheus to track real-time scraper performance and database writes:

- **Metrics Exporter:** FastAPI `/metrics` endpoint exposes real-time OpenMetrics telemetry.
- **Pipeline Telemetry:**
- `scraper_runs_total`: Counter tracking executions partitioned by `source_platform` and `status` (`success` vs `failure`).
- `scraper_events_ingested_total`: Counter monitoring inserted events partitioned by `state_id` and `source_platform`.
- `scraper_execution_seconds`: Histogram measuring execution duration per scraping cycle.

- **Dashboard as Code:** Complete Grafana visualization layouts are stored in `monitoring/grafana/eventdek-grafana.json`.
- **Prometheus Config:** Ready-to-use scrape target configuration is available in `monitoring/prometheus.yml`.

---

## Monorepo Deployment Topology (Render)

EventDek runs as a unified full-stack service on Render with **zero CORS issues**:

- **Build Command:**

```bash
cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt

```

- **Start Command:**

```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT

```

- **Runtime Routing:** Uvicorn handles all `/api/*`, `/health`, and `/metrics` routes first, then serves pre-built static client assets from `frontend/dist` with an SPA fallback for React Router.

---

## Quickstart (Local Development)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/your-username/eventdek.git
cd eventdek

```

Create `backend/.env`:

```env
DATABASE_URL="postgresql+asyncpg://<USER>:<PASSWORD>@<HOST>:6543/postgres"
JWT_SECRET="your-super-secret-jwt-key"
RENDER="false"

```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev

```

### 4. Observability Setup (Optional)

Run Prometheus against your backend:

```bash
prometheus --config.file=monitoring/prometheus.yml

```

Start Grafana, open `http://localhost:3000`, and import `monitoring/grafana/dashboard.json` to view real-time scraping stats.
