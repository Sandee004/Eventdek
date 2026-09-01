import logging
from typing import Any, Dict, Optional
from playwright.async_api import async_playwright
from sqlalchemy.future import select
from sqlalchemy import update

from database import AsyncSessionLocal
from models import Registration

logger = logging.getLogger("eventdek.proxy_reg")


async def execute_proxy_registration(
    registration_id: str,
    source_url: str,
    full_name: str,
    email: str,
    phone: str,
    custom_answers: Optional[Dict[str, Any]] = None,
):
    """
    Background worker that runs Playwright to register the attendee
    on external event platforms (e.g. Eventbrite, Lu.ma).
    Updates registration_status in DB to 'confirmed' or 'action_required'.
    """
    if not source_url or not source_url.startswith("http"):
        logger.info(f"Skipping proxy registration: Native event without external URL ({registration_id})")
        return

    name_parts = full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
    answers = custom_answers or {}

    logger.info(f"🚀 [WORKER START] Executing proxy registration for {email} on {source_url}")

    success = False
    error_msg = None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                ),
            )
            page = await context.new_page()

            # 1. Load the event page
            await page.goto(source_url, wait_until="domcontentloaded", timeout=40000)
            await page.wait_for_timeout(2000)

            # 2. Click Primary Register / Get Tickets Trigger
            register_btn = page.locator(
                "button:has-text('Register'), button:has-text('Get tickets'), "
                "button:has-text('RSVP'), a:has-text('Register'), a:has-text('Get Tickets')"
            ).first
            if await register_btn.is_visible(timeout=5000):
                await register_btn.click()
                await page.wait_for_timeout(2000)

            # Check if ticket quantity selection modal appears (e.g., Eventbrite free tier increment)
            qty_add = page.locator("button[data-testid*='increase-ticket'], select[name*='quantity']").first
            if await qty_add.is_visible(timeout=2000):
                await qty_add.click()
                checkout_step = page.locator("button:has-text('Register'), button:has-text('Checkout')").first
                if await checkout_step.is_visible(timeout=2000):
                    await checkout_step.click()
                    await page.wait_for_timeout(2500)

            # 3. Fill attendee fields across standard DOM & nested iframes
            frames_to_check = [page] + page.frames

            for frame in frames_to_check:
                # Name Inputs
                fn = frame.locator("input[name*='first_name' i], input[id*='first-name' i], input[placeholder*='First' i]").first
                if await fn.is_visible(timeout=1000):
                    await fn.fill(first_name)

                ln = frame.locator("input[name*='last_name' i], input[id*='last-name' i], input[placeholder*='Last' i]").first
                if await ln.is_visible(timeout=1000):
                    await ln.fill(last_name)

                full_name_input = frame.locator("input[name*='name' i]:not([name*='first']):not([name*='last']), input[placeholder*='Full Name' i]").first
                if await full_name_input.is_visible(timeout=1000):
                    await full_name_input.fill(full_name)

                # Email Inputs (Standard + Confirmation Email)
                emails = await frame.locator("input[type='email'], input[name*='email' i]").all()
                for em in emails:
                    if await em.is_visible():
                        await em.fill(email)

                # Phone Inputs
                phone_input = frame.locator("input[type='tel'], input[name*='phone' i]").first
                if await phone_input.is_visible(timeout=1000):
                    await phone_input.fill(phone)

                # Fill Custom Dynamic Answers (e.g., github, tshirt_size)
                for key, val in answers.items():
                    custom_field = frame.locator(
                        f"input[name*='{key}' i], textarea[name*='{key}' i], "
                        f"input[id*='{key}' i], input[placeholder*='{key}' i]"
                    ).first
                    if await custom_field.is_visible(timeout=800):
                        await custom_field.fill(str(val))

                # 4. Submit Order / RSVP
                submit_btn = frame.locator(
                    "button[type='submit'], button:has-text('Place Order'), "
                    "button:has-text('Register'), button:has-text('Complete Registration')"
                ).first

                if await submit_btn.is_visible(timeout=2000):
                    await submit_btn.click()
                    await page.wait_for_timeout(4000)
                    success = True
                    break

            await browser.close()

    except Exception as e:
        error_msg = str(e)
        logger.warning(f"⚠️ Proxy registration failed for {source_url}: {e}")

    # 5. Update Registration row status in Database
    async with AsyncSessionLocal() as db:
        new_status = "confirmed" if success else "action_required"
        await db.execute(
            update(Registration)
            .where(Registration.id == registration_id)
            .values(registration_status=new_status)
        )
        await db.commit()
        logger.info(f"✅ [WORKER FINISHED] Registration {registration_id} marked as '{new_status}'")