# import csv
# import re
# from typing import Optional
# from bs4 import BeautifulSoup, Tag
# from playwright.sync_api import sync_playwright

# BASE_URL = "https://www.eventbrite.com/d/nigeria/all-events/"
# TOTAL_PAGES = 14
# CSV_FILE = "eventbrite_nigeria_events.csv"


# def parse_raw_card(raw_html: str) -> Optional[dict[str, str]]:
#     """
#     Parses an individual event card's raw HTML into structured fields.
#     Fully type-safe for Pyright.
#     """
#     soup = BeautifulSoup(raw_html, "html.parser")

#     # 1. Find Event Link & verify Tag type
#     link_tag = soup.find("a", href=re.compile(r"/e/"))
#     if not isinstance(link_tag, Tag):
#         return None

#     raw_href = link_tag.get("href", "")
#     href_str = raw_href if isinstance(raw_href, str) else ""
#     href = href_str.split("?")[0]

#     if href.startswith("/"):
#         href = f"https://www.eventbrite.com{href}"

#     # Extract numeric Event ID
#     url_match = re.search(r"tickets-(\d+)", href)
#     event_id = url_match.group(1) if url_match else "N/A"

#     # 2. Extract Title
#     title_tag = soup.find(["h2", "h3", "h4", "strong"])
#     title = title_tag.get_text(strip=True) if isinstance(title_tag, Tag) else link_tag.get_text(strip=True)

#     # 3. Extract Metadata lines (Date, Venue, Price)
#     lines = [
#         s.get_text(strip=True)
#         for s in soup.find_all(["p", "span", "div"])
#         if isinstance(s, Tag) and s.get_text(strip=True) and s.get_text(strip=True) != title
#     ]
#     clean_lines = list(dict.fromkeys(lines))

#     date = clean_lines[0] if len(clean_lines) > 0 else "TBD"
#     venue = clean_lines[1] if len(clean_lines) > 1 else "Nigeria / Online"
#     price = clean_lines[2] if len(clean_lines) > 2 else "Check Link"

#     # 4. Extract Image URL
#     img_tag = soup.find("img")
#     img_url = "N/A"
#     if isinstance(img_tag, Tag):
#         raw_src = img_tag.get("src", "N/A")
#         img_url = raw_src if isinstance(raw_src, str) else "N/A"

#     return {
#         "event_id": event_id,
#         "title": title,
#         "date": date,
#         "venue": venue,
#         "price": price,
#         "link": href,
#         "image_url": img_url,
#     }


# def scrape_all_pages():
#     fields = ["event_id", "title", "date", "venue", "price", "link", "image_url"]

#     # Initialize / wipe CSV with header
#     with open(CSV_FILE, mode="w", newline="", encoding="utf-8") as f:
#         writer = csv.DictWriter(f, fieldnames=fields)
#         writer.writeheader()

#     seen_links = set()
#     total_saved = 0

#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless=True)
#         context = browser.new_context(
#             viewport={"width": 1280, "height": 800},
#             user_agent=(
#                 "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
#                 "AppleWebKit/537.36 (KHTML, like Gecko) "
#                 "Chrome/122.0.0.0 Safari/537.36"
#             ),
#         )
#         page = context.new_page()

#         for page_num in range(1, TOTAL_PAGES + 1):
#             page_url = f"{BASE_URL}?page={page_num}"
#             print(f"\n[+] Processing Page {page_num}/{TOTAL_PAGES}: {page_url}")

#             try:
#                 page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
#             except Exception as e:
#                 print(f"Failed to load page {page_num}: {e}")
#                 continue

#             page.wait_for_timeout(3000)

#             # Accept cookies once on initial page load
#             if page_num == 1:
#                 try:
#                     cookie_btn = page.locator("#onetrust-accept-btn-handler, button:has-text('Accept')").first
#                     if cookie_btn.is_visible(timeout=3000):
#                         cookie_btn.click()
#                 except Exception:
#                     pass

#             # Scroll to trigger lazy loading of image elements and cards
#             for _ in range(3):
#                 page.evaluate("window.scrollBy(0, 800)")
#                 page.wait_for_timeout(700)

#             # Query all possible card wrappers
#             card_elements = page.locator("article, section[class*='event-card'], div[data-testid*='card']").all()

#             page_saved = 0
#             for element in card_elements:
#                 try:
#                     raw_html = element.inner_html()
#                     parsed = parse_raw_card(raw_html)

#                     if parsed and parsed["link"] not in seen_links and parsed["title"]:
#                         seen_links.add(parsed["link"])
#                         page_saved += 1
#                         total_saved += 1

#                         # Real-time console update
#                         print(f"  • {parsed['title'][:50]} | {parsed['date']}")

#                         # Real-time CSV append
#                         with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
#                             writer = csv.DictWriter(f, fieldnames=fields)
#                             writer.writerow(parsed)
#                 except Exception:
#                     continue

#             print(f"Page {page_num} finished: Extracted {page_saved} new events.")

#         browser.close()

#     print(f"\n[✓] Completed! Scraped {total_saved} unique events across {TOTAL_PAGES} pages into '{CSV_FILE}'.")


# if __name__ == "__main__":
#     scrape_all_pages()









import asyncio
import logging
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from bs4 import BeautifulSoup, Tag
from playwright.async_api import async_playwright
from sqlalchemy.future import select

# Ensure parent directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import AsyncSessionLocal
from models import Event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eventdek.scraper")

BASE_URL = "https://www.eventbrite.com/d/nigeria/all-events/"
TOTAL_PAGES = 5  # Start with 5 pages for testing


def parse_raw_card(raw_html: str) -> Optional[dict]:
    soup = BeautifulSoup(raw_html, "html.parser")

    # 1. Event Link
    link_tag = soup.find("a", href=re.compile(r"/e/"))
    if not isinstance(link_tag, Tag):
        return None

    raw_href = link_tag.get("href", "")
    href_str = raw_href if isinstance(raw_href, str) else ""
    href = href_str.split("?")[0]
    if href.startswith("/"):
        href = f"https://www.eventbrite.com{href}"

    # 2. Title
    title_tag = soup.find(["h2", "h3", "h4", "strong"])
    title = title_tag.get_text(strip=True) if isinstance(title_tag, Tag) else link_tag.get_text(strip=True)
    if not title or len(title) < 3:
        return None

    # 3. Metadata lines
    lines = [
        s.get_text(strip=True)
        for s in soup.find_all(["p", "span", "div"])
        if isinstance(s, Tag) and s.get_text(strip=True) and s.get_text(strip=True) != title
    ]
    clean_lines = list(dict.fromkeys(lines))

    date_str = clean_lines[0] if len(clean_lines) > 0 else "Upcoming"
    venue = clean_lines[1] if len(clean_lines) > 1 else "Nigeria / Online"
    price_str = clean_lines[2] if len(clean_lines) > 2 else "Free"

    is_free = "free" in price_str.lower() or "check" in price_str.lower()
    price_match = re.search(r"[\d,]+", price_str)
    price_ngn = float(price_match.group(0).replace(",", "")) if price_match else 0.0

    # 4. Image URL
    img_tag = soup.find("img")
    img_url = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
    if isinstance(img_tag, Tag):
        raw_src = img_tag.get("src")
        if isinstance(raw_src, str) and raw_src.startswith("http"):
            img_url = raw_src

    # Location normalization
    venue_lower = venue.lower()
    state_id = "lagos"
    if "abuja" in venue_lower:
        state_id = "abuja"
    elif "port harcourt" in venue_lower or "rivers" in venue_lower:
        state_id = "rivers"
    elif "ibadan" in venue_lower or "oyo" in venue_lower:
        state_id = "oyo"
    elif "online" in venue_lower or "virtual" in venue_lower:
        state_id = "virtual"

    tech_keywords = ["tech", "ai", "code", "dev", "data", "software", "product", "design"]
    category = "tech" if any(k in title.lower() for k in tech_keywords) else "lifestyle"

    return {
        "title": title,
        "description": f"{title} happening live at {venue}. Date info: {date_str}.",
        "banner_url": img_url,
        "venue_name": venue,
        "address": venue,
        "state_id": state_id,
        "city_area": None,
        "start_time": datetime.now(timezone.utc),
        "end_time": datetime.now(timezone.utc),
        "category": category,
        "is_free": is_free,
        "price_ngn": price_ngn,
        "source_platform": "eventbrite",
        "source_url": href,
    }


async def run_event_scraper_job():
    print("\n" + "=" * 60)
    print("🚀 [START] Running Eventbrite Scraper Pipeline...")
    print("=" * 60)

    total_saved = 0
    seen_links = set()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        page = await context.new_page()

        for page_num in range(1, TOTAL_PAGES + 1):
            page_url = f"{BASE_URL}?page={page_num}"
            print(f"\n📄 Loading Page {page_num}/{TOTAL_PAGES}: {page_url}")

            try:
                await page.goto(page_url, wait_until="domcontentloaded", timeout=45000)
            except Exception as e:
                print(f"❌ Failed to load page {page_num}: {e}")
                continue

            await page.wait_for_timeout(2500)

            # Accept cookies
            if page_num == 1:
                try:
                    cookie_btn = page.locator("#onetrust-accept-btn-handler, button:has-text('Accept')").first
                    if await cookie_btn.is_visible(timeout=3000):
                        await cookie_btn.click()
                        print("🍪 Dismissed cookie banner.")
                except Exception:
                    pass

            # Scroll down to trigger image and card hydration
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 1000)")
                await page.wait_for_timeout(600)

            # Find card wrappers
            card_elements = await page.locator("article, section[class*='event-card'], div[data-testid*='card']").all()
            print(f"🔍 Found {len(card_elements)} card elements on Page {page_num}")

            page_saved = 0

            async with AsyncSessionLocal() as db:
                for idx, element in enumerate(card_elements, 1):
                    try:
                        raw_html = await element.inner_html()
                        parsed = parse_raw_card(raw_html)

                        if not parsed:
                            continue

                        if parsed["source_url"] in seen_links:
                            print(f"   ↳ [Skipped] Duplicate URL in memory: {parsed['title'][:40]}")
                            continue

                        seen_links.add(parsed["source_url"])

                        # Check DB for duplicates
                        existing = await db.execute(
                            select(Event).where(
                                (Event.source_url == parsed["source_url"]) | (Event.title == parsed["title"])
                            )
                        )
                        if existing.scalars().first():
                            print(f"   ↳ [Skipped] Already exists in DB: {parsed['title'][:40]}")
                            continue

                        # Add new event
                        new_event = Event(
                            id=str(uuid.uuid4()),
                            **parsed,
                            is_active=True,
                        )
                        db.add(new_event)
                        page_saved += 1
                        total_saved += 1
                        print(f"   ✅ [Queued to DB] {parsed['title'][:45]} | State: {parsed['state_id']}")

                    except Exception as e:
                        print(f"   ⚠️ Error parsing card #{idx}: {e}")
                        continue

                # Commit all records found on this page
                if page_saved > 0:
                    await db.commit()
                    print(f"💾 [DB COMMIT SUCCESS] Committed {page_saved} new events from Page {page_num}.")
                else:
                    print(f"ℹ️ No new unique events to commit on Page {page_num}.")

        await browser.close()

    print("\n" + "=" * 60)
    print(f"🎉 [FINISHED] Ingested {total_saved} total unique events into the database.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_event_scraper_job())