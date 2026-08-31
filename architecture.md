# EventDek System Architecture

EventDek is a web platform for discovering local events across Nigerian states using a gesture-driven card deck (modeled after Tinder/Sorce). It enables zero-friction, 1-swipe RSVPs for free events and contained in-app ticketing for paid ones.

---

## 1. High-Level Architecture Diagram

```
             +-----------------------------------+
             | React SPA (Vite + Framer Motion) |
             +-----------------+-----------------+
                               | REST API / JSON
                               v
             +-----------------------------------+
             |          FastAPI Backend          |
             +--------+-----------------+--------+
                      |                 |
 Scheduled Scraping   |                 | Ingestion & Queries
                      v                 v
       +--------------------+     +-----------------------+
       | APScheduler Worker |     | PostgreSQL (Supabase) |
       +--------------------+     +-----------+-----------+
                                              |
                                              | Nightly Cleanup
                                              v
                                  +-----------------------+
                                  |   pg_cron Purge Job   |
                                  +-----------------------+

```

## 2. Core Discovery & Interaction Engine

### The Shared Pool & Exclusion Model

To keep response times under **15 ms** without storing redundant queues for thousands of users:

- **Global Pool:** Upcoming active events are stored once in the `events` table per region/state.
- **Interaction Tracking:** When a user swipes left or right, a compact row is written to `user_swipes`.
- **Deck Query:** The deck endpoint (`GET /events/deck`) queries upcoming events matching the user's target state that do not exist in the user's `user_swipes` records:

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

## 3. The Registration Snapshot Pattern (Approach 2)

### Decoupled History

When a user swipes right on an event, their RSVP is stored in the `registrations` table.

Rather than relying purely on a foreign key pointer to `events(id)`, the backend freezes key display metadata (`event_title`, `event_banner_url`, `event_venue_name`, `event_start_time`, `event_end_time`, `event_source_url`) directly into the `registrations` row at the moment of registration.

### Why This Is Done

1. **Immutable Ticket Receipts:** Even if an organizer modifies or cancels the listing later, the attendee keeps an authentic, frozen receipt.
2. **Safe Database Purging:** Expired event listings can be hard-deleted from `events` without breaking the user's past ticket history in "My Dek".

---

## 4. Automated Maintenance & Cleanup (pg_cron)

To keep table size bounded and queries fast, a scheduled database job prunes dead rows automatically.

### Why We Purge

- Left swipes (passes) on past events are dead weight; users will never be served past events again.

- Expired events no longer need to be served in active discovery decks.

### The Unified Daily Purge Job

A single daily cron job runs directly inside Supabase PostgreSQL at **03:00 UTC**:

```sql
CREATE OR REPLACE FUNCTION purge_expired_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN     -- Deleting past events automatically cascades and wipes related rows in user_swipes     DELETE FROM events     WHERE end_time < NOW() - INTERVAL '1 day'; END; $$;

SELECT cron.schedule(
    'daily-event-purge',
    '0 3 * * *',
    'SELECT purge_expired_events();'
);

```

### Cascade Mechanics

- **`user_swipes`:** Defined with `ON DELETE CASCADE` on `event_id`. When a past event is deleted, its unneeded swipe records are automatically removed.

- **`registrations`:** Defined with `ON DELETE SET NULL` on `event_id`. When the event is deleted, the registration record remains intact, populated with its original frozen snapshot data.

---

## 5. Background Ingestion Pipeline

```
+------------------+       Every 6 Hours       +----------------------+
|  Eventbrite/Web  | ------------------------> | APScheduler Worker   |
|  Public Feeds    |                           | (FastAPI Lifespan)   |
+------------------+                           +----------+-----------+
                                                          |
                                           Deduplicate & Parse Timestamps
                                                          |
                                                          v
                                               +----------------------+
                                               | events Table (DB)    |
                                               +----------------------+

```

1. **Scheduler:** An async `APScheduler` instance runs inside the FastAPI lifespan process.

2. **Scraping & Normalization:** The scraper fetches listings, parses natural-language dates (via `dateutil`), resolves Nigerian state mappings, and standardizes ticket pricing.

3. **Deduplication:** Listings are deduplicated by `title` and `source_url` before insertion.

---

## 6. Deployment & Runtime Topology (Render Monorepo)

EventDek runs as a unified full-stack service on Render with **zero CORS configuration issues**:

- **Build Phase:** Compiles the React frontend (`npm run build`) into `frontend/dist` and installs backend dependencies (`pip install -r requirements.txt`).

- **Runtime Phase:** Uvicorn runs FastAPI, which serves the `/api` endpoints and statically mounts `frontend/dist` as an SPA fallback for all web routes.
