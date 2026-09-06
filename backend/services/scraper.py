# import asyncio
# import logging
# import re
# import sys
# import uuid
# from datetime import datetime, timedelta, timezone
# from pathlib import Path
# from typing import Any, Dict, List, Optional, Tuple
# from bs4 import BeautifulSoup, Tag
# from dateutil import parser as date_parser
# from playwright.async_api import async_playwright
# from sqlalchemy.future import select
# from monitoring.metrics import SCRAPE_RUNS, EVENTS_INGESTED, SCRAPE_DURATION

# BACKEND_DIR = Path(__file__).resolve().parent.parent
# if str(BACKEND_DIR) not in sys.path:
#     sys.path.insert(0, str(BACKEND_DIR))

# from database import AsyncSessionLocal
# from models import Event
# from utils import STATE_LOOKUP

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("eventdek.scraper")

# BASE_URL = "https://www.eventbrite.com/d/nigeria/all-events/"
# TOTAL_PAGES = 5


# def resolve_state_id(text: str) -> str:
#     clean_text = text.lower()
#     for state_id, aliases in STATE_LOOKUP.items():
#         pattern = r"\b(" + "|".join(re.escape(alias) for alias in aliases) + r")\b"
#         if re.search(pattern, clean_text):
#             return state_id
#     return "lagos"


# def parse_event_datetimes(date_str: str) -> Tuple[datetime, datetime]:
#     now = datetime.now(timezone.utc)
#     if not date_str or date_str.lower() in ("upcoming", "tbd", "today", "tomorrow"):
#         start = now + timedelta(days=2, hours=3)
#         return start, start + timedelta(hours=3)

#     clean_str = date_str.replace("•", " ").replace("+", " ").strip()
#     clean_str = re.sub(r"\d+\s+more.*$", "", clean_str, flags=re.IGNORECASE).strip()

#     try:
#         parsed_dt = date_parser.parse(clean_str, fuzzy=True, default=now)
#         if parsed_dt.year < now.year:
#             parsed_dt = parsed_dt.replace(year=now.year)
#         if parsed_dt.tzinfo is None:
#             parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
#         return parsed_dt, parsed_dt + timedelta(hours=3)
#     except Exception:
#         start_time = now + timedelta(days=3, hours=2)
#         return start_time, start_time + timedelta(hours=3)


# def parse_native_price(raw_text: str) -> Tuple[bool, float, str]:
#     if not raw_text:
#         return True, 0.0, "NGN"

#     lower = raw_text.lower().strip()
    
#     # Explicit Free checks
#     if lower == "free" or "$0" in lower or "₦0" in lower or "€0" in lower or "£0" in lower or "from $0.00" in lower:
#         return True, 0.0, "NGN"

#     currency = "NGN"
#     if "$" in raw_text or "usd" in lower:
#         currency = "USD"
#     elif "€" in raw_text or "eur" in lower:
#         currency = "EUR"
#     elif "£" in raw_text or "gbp" in lower:
#         currency = "GBP"
#     elif "₦" in raw_text or "ngn" in lower:
#         currency = "NGN"

#     match = re.search(r"[\$₦€£]?\s*([\d,]+(?:\.\d{2})?)", raw_text)
#     if not match:
#         return True, 0.0, currency

#     raw_val = match.group(1).replace(",", "")
#     try:
#         val = float(raw_val)
#     except ValueError:
#         return True, 0.0, currency

#     if val <= 0.0:
#         return True, 0.0, currency

#     return False, round(val, 2), currency


# def parse_raw_card(
#     raw_html: str, 
#     extracted_price_text: str = "",
#     custom_questions: Optional[List[Dict[str, Any]]] = None
# ) -> Optional[dict]:
#     soup = BeautifulSoup(raw_html, "html.parser")

#     # 1. Event Link & Title
#     link_tag = soup.find("a", href=re.compile(r"/e/"))
#     if not isinstance(link_tag, Tag):
#         return None

#     raw_href = link_tag.get("href", "")
#     href_str = raw_href if isinstance(raw_href, str) else ""
#     href = href_str.split("?")[0]
#     if href.startswith("/"):
#         href = f"https://www.eventbrite.com{href}"

#     title_tag = soup.find(["h2", "h3", "h4", "strong"])
#     title = title_tag.get_text(strip=True) if isinstance(title_tag, Tag) else link_tag.get_text(strip=True)
#     if not title or len(title) < 3:
#         return None

#     # 2. Extract Price String
#     price_str = extracted_price_text.strip()

#     if not price_str:
#         for tag in soup.find_all(["p", "span", "div"]):
#             text = tag.get_text(strip=True)
#             if any(sym in text for sym in ["$", "₦", "€", "£"]) and not any(d in text.lower() for d in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]):
#                 price_str = text
#                 break

#     # 3. Extract Metadata Lines
#     lines = [
#         s.get_text(strip=True)
#         for s in soup.find_all(["p", "span", "div"])
#         if isinstance(s, Tag) and s.get_text(strip=True) and s.get_text(strip=True) != title
#     ]
#     clean_lines = list(dict.fromkeys(lines))

#     date_str = ""
#     venue_str = ""
#     date_pattern = re.compile(
#         r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\b\d{1,2}:\d{2}\b)",
#         re.IGNORECASE,
#     )
#     skip_badges = {"sales end soon", "sold out", "almost full", "going fast"}

#     for line in clean_lines:
#         line_lower = line.lower()
#         if line_lower in skip_badges:
#             continue

#         if not price_str and any(c in line for c in ["$", "₦", "€", "£", "From", "from"]):
#             price_str = line
#             continue

#         if date_pattern.search(line) and not date_str:
#             date_str = line
#             continue

#         if not venue_str and len(line) > 3 and not date_pattern.search(line) and line != price_str:
#             venue_str = line

#     if not venue_str:
#         venue_str = "Lagos, Nigeria" if "lagos" in title.lower() else "Nigeria / Online"

#     is_free, price_val, currency = parse_native_price(price_str)
#     start_time, end_time = parse_event_datetimes(date_str)

#     img_tag = soup.find("img")
#     img_url = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
#     if isinstance(img_tag, Tag):
#         raw_src = img_tag.get("src")
#         if isinstance(raw_src, str) and raw_src.startswith("http"):
#             img_url = raw_src

#     full_loc = f"{title} {venue_str}"
#     state_id = resolve_state_id(full_loc)
#     category = "tech" if any(k in title.lower() for k in ["tech", "ai", "dev", "data", "code", "design", "product"]) else "lifestyle"

#     questions = custom_questions or []
#     requires_custom = len(questions) > 0

#     return {
#         "title": title,
#         "description": f"{title} live at {venue_str}. Date: {date_str or 'Upcoming'}.",
#         "banner_url": img_url,
#         "venue_name": venue_str,
#         "address": f"{venue_str}, Nigeria" if "nigeria" not in venue_str.lower() else venue_str,
#         "state_id": state_id,
#         "start_time": start_time,
#         "end_time": end_time,
#         "category": category,
#         "is_free": is_free,
#         "price_ngn": price_val,
#         "currency": currency,
#         "source_platform": "eventbrite",
#         "source_url": href,
#         "requires_custom_fields": requires_custom,
#         "custom_fields_schema": questions,
#     }


# async def run_event_scraper_job():
#     print("\n [START] Ingesting Events...")
#     total_saved = 0
#     seen_links = set()

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context(
#             viewport={"width": 1280, "height": 800},
#             user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
#         )
#         page = await context.new_page()

#         for page_num in range(1, TOTAL_PAGES + 1):
#             page_url = f"{BASE_URL}?page={page_num}"
#             print(f"\n Loading Page {page_num}/{TOTAL_PAGES}")

#             try:
#                 await page.goto(page_url, wait_until="networkidle", timeout=60000)
#             except Exception:
#                 await page.goto(page_url, wait_until="domcontentloaded", timeout=45000)

#             await page.wait_for_timeout(2500)

#             if page_num == 1:
#                 try:
#                     btn = page.locator("#onetrust-accept-btn-handler, button:has-text('Accept')").first
#                     if await btn.is_visible(timeout=3000):
#                         await btn.click()
#                 except Exception:
#                     pass

#             for _ in range(4):
#                 await page.evaluate("window.scrollBy(0, 800)")
#                 await page.wait_for_timeout(400)

#             card_elements = await page.locator("article, section[class*='event-card'], div[data-testid*='card']").all()
#             page_saved = 0

#             async with AsyncSessionLocal() as db:
#                 for element in card_elements:
#                     try:
#                         # 1. Extract direct price text
#                         price_text = ""
#                         try:
#                             price_locator = element.locator(
#                                 "[class*='priceWrapper'], p:has-text('$'), p:has-text('₦'), p:has-text('€'), p:has-text('From')"
#                             ).first
#                             if await price_locator.count() > 0:
#                                 price_text = await price_locator.inner_text()
#                         except Exception:
#                             price_text = ""

#                         raw_html = await element.inner_html()
#                         parsed = parse_raw_card(raw_html, extracted_price_text=price_text)

#                         if not parsed or parsed["source_url"] in seen_links:
#                             continue

#                         seen_links.add(parsed["source_url"])

#                         existing = await db.execute(
#                             select(Event).where(
#                                 (Event.source_url == parsed["source_url"]) | (Event.title == parsed["title"])
#                             )
#                         )
#                         if existing.scalars().first():
#                             continue

#                         new_event = Event(
#                             id=str(uuid.uuid4()),
#                             **parsed,
#                             is_active=True,
#                         )
#                         db.add(new_event)
#                         page_saved += 1
#                         total_saved += 1
#                         print(
#                             f"   ✅ [Saved] {parsed['title'][:26]} | "
#                             f"Free: {parsed['is_free']} | Price: {parsed['currency']} {parsed['price_ngn']} | "
#                             f"Custom Questions: {parsed['requires_custom_fields']}"
#                         )

#                     except Exception:
#                         continue

#                 if page_saved > 0:
#                     await db.commit()
#                     print(f"Committed {page_saved} clean events from Page {page_num}.")

#         await browser.close()

#     print(f"\n Finished! Ingested {total_saved} events.")


# if __name__ == "__main__":
#     asyncio.run(run_event_scraper_job())


import asyncio
import logging
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from bs4 import BeautifulSoup, Tag
from dateutil import parser as date_parser
from playwright.async_api import async_playwright
from sqlalchemy.future import select


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import AsyncSessionLocal
from models import Event
from utils import STATE_LOOKUP
from monitoring.metrics import SCRAPE_RUNS, EVENTS_INGESTED, SCRAPE_DURATION

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eventdek.scraper")

BASE_URL = "https://www.eventbrite.com/d/nigeria/all-events/"
TOTAL_PAGES = 5


def resolve_state_id(text: str) -> str:
    clean_text = text.lower()
    for state_id, aliases in STATE_LOOKUP.items():
        pattern = r"\b(" + "|".join(re.escape(alias) for alias in aliases) + r")\b"
        if re.search(pattern, clean_text):
            return state_id
    return "lagos"


def parse_event_datetimes(date_str: str) -> Tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    if not date_str or date_str.lower() in ("upcoming", "tbd", "today", "tomorrow"):
        start = now + timedelta(days=2, hours=3)
        return start, start + timedelta(hours=3)

    clean_str = date_str.replace("•", " ").replace("+", " ").strip()
    clean_str = re.sub(r"\d+\s+more.*$", "", clean_str, flags=re.IGNORECASE).strip()

    try:
        parsed_dt = date_parser.parse(clean_str, fuzzy=True, default=now)
        if parsed_dt.year < now.year:
            parsed_dt = parsed_dt.replace(year=now.year)
        if parsed_dt.tzinfo is None:
            parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
        return parsed_dt, parsed_dt + timedelta(hours=3)
    except Exception:
        start_time = now + timedelta(days=3, hours=2)
        return start_time, start_time + timedelta(hours=3)


def parse_native_price(raw_text: str) -> Tuple[bool, float, str]:
    if not raw_text:
        return True, 0.0, "NGN"

    lower = raw_text.lower().strip()

    # Explicit Free checks
    if lower == "free" or "$0" in lower or "₦0" in lower or "€0" in lower or "£0" in lower or "from $0.00" in lower:
        return True, 0.0, "NGN"

    currency = "NGN"
    if "$" in raw_text or "usd" in lower:
        currency = "USD"
    elif "€" in raw_text or "eur" in lower:
        currency = "EUR"
    elif "£" in raw_text or "gbp" in lower:
        currency = "GBP"
    elif "₦" in raw_text or "ngn" in lower:
        currency = "NGN"

    match = re.search(r"[\$₦€£]?\s*([\d,]+(?:\.\d{2})?)", raw_text)
    if not match:
        return True, 0.0, currency

    raw_val = match.group(1).replace(",", "")
    try:
        val = float(raw_val)
    except ValueError:
        return True, 0.0, currency

    if val <= 0.0:
        return True, 0.0, currency

    return False, round(val, 2), currency


def parse_raw_card(
    raw_html: str,
    extracted_price_text: str = "",
    custom_questions: Optional[List[Dict[str, Any]]] = None,
) -> Optional[dict]:
    soup = BeautifulSoup(raw_html, "html.parser")

    # 1. Event Link & Title
    link_tag = soup.find("a", href=re.compile(r"/e/"))
    if not isinstance(link_tag, Tag):
        return None

    raw_href = link_tag.get("href", "")
    href_str = raw_href if isinstance(raw_href, str) else ""
    href = href_str.split("?")[0]
    if href.startswith("/"):
        href = f"https://www.eventbrite.com{href}"

    title_tag = soup.find(["h2", "h3", "h4", "strong"])
    title = title_tag.get_text(strip=True) if isinstance(title_tag, Tag) else link_tag.get_text(strip=True)
    if not title or len(title) < 3:
        return None

    # 2. Extract Price String
    price_str = extracted_price_text.strip()

    if not price_str:
        for tag in soup.find_all(["p", "span", "div"]):
            text = tag.get_text(strip=True)
            if any(sym in text for sym in ["$", "₦", "€", "£"]) and not any(
                d in text.lower() for d in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
            ):
                price_str = text
                break

    # 3. Extract Metadata Lines
    lines = [
        s.get_text(strip=True)
        for s in soup.find_all(["p", "span", "div"])
        if isinstance(s, Tag) and s.get_text(strip=True) and s.get_text(strip=True) != title
    ]
    clean_lines = list(dict.fromkeys(lines))

    date_str = ""
    venue_str = ""
    date_pattern = re.compile(
        r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\b\d{1,2}:\d{2}\b)",
        re.IGNORECASE,
    )
    skip_badges = {"sales end soon", "sold out", "almost full", "going fast"}

    for line in clean_lines:
        line_lower = line.lower()
        if line_lower in skip_badges:
            continue

        if not price_str and any(c in line for c in ["$", "₦", "€", "£", "From", "from"]):
            price_str = line
            continue

        if date_pattern.search(line) and not date_str:
            date_str = line
            continue

        if not venue_str and len(line) > 3 and not date_pattern.search(line) and line != price_str:
            venue_str = line

    if not venue_str:
        venue_str = "Lagos, Nigeria" if "lagos" in title.lower() else "Nigeria / Online"

    is_free, price_val, currency = parse_native_price(price_str)
    start_time, end_time = parse_event_datetimes(date_str)

    img_tag = soup.find("img")
    img_url = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
    if isinstance(img_tag, Tag):
        raw_src = img_tag.get("src")
        if isinstance(raw_src, str) and raw_src.startswith("http"):
            img_url = raw_src

    full_loc = f"{title} {venue_str}"
    state_id = resolve_state_id(full_loc)
    category = "tech" if any(k in title.lower() for k in ["tech", "ai", "dev", "data", "code", "design", "product"]) else "lifestyle"

    questions = custom_questions or []
    requires_custom = len(questions) > 0

    return {
        "title": title,
        "description": f"{title} live at {venue_str}. Date: {date_str or 'Upcoming'}.",
        "banner_url": img_url,
        "venue_name": venue_str,
        "address": f"{venue_str}, Nigeria" if "nigeria" not in venue_str.lower() else venue_str,
        "state_id": state_id,
        "start_time": start_time,
        "end_time": end_time,
        "category": category,
        "is_free": is_free,
        "price_ngn": price_val,
        "currency": currency,
        "source_platform": "eventbrite",
        "source_url": href,
        "requires_custom_fields": requires_custom,
        "custom_fields_schema": questions,
    }


async def run_event_scraper_job():
    print("\n🚀 [START] Ingesting Events...")
    total_saved = 0
    seen_links = set()
    platform = "eventbrite"

    # Instrument execution duration with Prometheus
    with SCRAPE_DURATION.labels(source_platform=platform).time():
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 800},
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                )
                page = await context.new_page()

                for page_num in range(1, TOTAL_PAGES + 1):
                    page_url = f"{BASE_URL}?page={page_num}"
                    print(f"\n📄 Loading Page {page_num}/{TOTAL_PAGES}")

                    try:
                        await page.goto(page_url, wait_until="networkidle", timeout=60000)
                    except Exception:
                        await page.goto(page_url, wait_until="domcontentloaded", timeout=45000)

                    await page.wait_for_timeout(2500)

                    if page_num == 1:
                        try:
                            btn = page.locator("#onetrust-accept-btn-handler, button:has-text('Accept')").first
                            if await btn.is_visible(timeout=3000):
                                await btn.click()
                        except Exception:
                            pass

                    for _ in range(4):
                        await page.evaluate("window.scrollBy(0, 800)")
                        await page.wait_for_timeout(400)

                    card_elements = await page.locator(
                        "article, section[class*='event-card'], div[data-testid*='card']"
                    ).all()
                    page_saved = 0

                    async with AsyncSessionLocal() as db:
                        for element in card_elements:
                            try:
                                # Extract price text directly from DOM
                                price_text = ""
                                try:
                                    price_locator = element.locator(
                                        "[class*='priceWrapper'], p:has-text('$'), p:has-text('₦'), p:has-text('€'), p:has-text('From')"
                                    ).first
                                    if await price_locator.count() > 0:
                                        price_text = await price_locator.inner_text()
                                except Exception:
                                    price_text = ""

                                raw_html = await element.inner_html()
                                parsed = parse_raw_card(raw_html, extracted_price_text=price_text)

                                if not parsed or parsed["source_url"] in seen_links:
                                    continue

                                seen_links.add(parsed["source_url"])

                                existing = await db.execute(
                                    select(Event).where(
                                        (Event.source_url == parsed["source_url"]) | (Event.title == parsed["title"])
                                    )
                                )
                                if existing.scalars().first():
                                    continue

                                new_event = Event(
                                    id=str(uuid.uuid4()),
                                    **parsed,
                                    is_active=True,
                                )
                                db.add(new_event)
                                page_saved += 1
                                total_saved += 1

                                # Increment metric per saved event labeled by state
                                EVENTS_INGESTED.labels(
                                    source_platform=platform,
                                    state_id=parsed["state_id"],
                                ).inc()

                                print(
                                    f"   ✅ [Saved] {parsed['title'][:26]} | "
                                    f"Free: {parsed['is_free']} | Price: {parsed['currency']} {parsed['price_ngn']} | "
                                    f"Custom Questions: {parsed['requires_custom_fields']}"
                                )

                            except Exception:
                                continue

                        if page_saved > 0:
                            await db.commit()
                            print(f"💾 Committed {page_saved} clean events from Page {page_num}.")

                await browser.close()

            # Record success metric
            SCRAPE_RUNS.labels(source_platform=platform, status="success").inc()
            print(f"\n🎉 Finished! Ingested {total_saved} events.")

        except Exception as err:
            # Record failure metric
            SCRAPE_RUNS.labels(source_platform=platform, status="failure").inc()
            print(f"❌ Scraper run failed: {err}")
            raise err


if __name__ == "__main__":
    asyncio.run(run_event_scraper_job())