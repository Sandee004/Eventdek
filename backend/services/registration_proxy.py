# import logging
# from typing import Any, Dict, Optional
# from playwright.async_api import async_playwright
# from sqlalchemy.future import select
# from sqlalchemy import update

# from database import AsyncSessionLocal
# from models import Registration

# logger = logging.getLogger("eventdek.proxy_reg")


# async def execute_proxy_registration(
#     registration_id: str,
#     source_url: str,
#     full_name: str,
#     email: str,
#     phone: str,
#     custom_answers: Optional[Dict[str, Any]] = None,
# ):
#     """
#     Background worker that runs Playwright to register the attendee
#     on external event platforms (e.g. Eventbrite, Lu.ma).
#     Updates registration_status in DB to 'confirmed' or 'action_required'.
#     """
#     if not source_url or not source_url.startswith("http"):
#         logger.info(f"Skipping proxy registration: Native event without external URL ({registration_id})")
#         return

#     name_parts = full_name.strip().split(" ", 1)
#     first_name = name_parts[0]
#     last_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
#     answers = custom_answers or {}

#     logger.info(f"🚀 [WORKER START] Executing proxy registration for {email} on {source_url}")

#     success = False
#     error_msg = None

#     try:
#         async with async_playwright() as p:
#             browser = await p.chromium.launch(headless=True)
#             context = await browser.new_context(
#                 viewport={"width": 1280, "height": 800},
#                 user_agent=(
#                     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
#                     "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
#                 ),
#             )
#             page = await context.new_page()

#             # 1. Load the event page
#             await page.goto(source_url, wait_until="domcontentloaded", timeout=40000)
#             await page.wait_for_timeout(2000)

#             # 2. Click Primary Register / Get Tickets Trigger
#             register_btn = page.locator(
#                 "button:has-text('Register'), button:has-text('Get tickets'), "
#                 "button:has-text('RSVP'), a:has-text('Register'), a:has-text('Get Tickets')"
#             ).first
#             if await register_btn.is_visible(timeout=5000):
#                 await register_btn.click()
#                 await page.wait_for_timeout(2000)

#             # Check if ticket quantity selection modal appears (e.g., Eventbrite free tier increment)
#             qty_add = page.locator("button[data-testid*='increase-ticket'], select[name*='quantity']").first
#             if await qty_add.is_visible(timeout=2000):
#                 await qty_add.click()
#                 checkout_step = page.locator("button:has-text('Register'), button:has-text('Checkout')").first
#                 if await checkout_step.is_visible(timeout=2000):
#                     await checkout_step.click()
#                     await page.wait_for_timeout(2500)

#             # 3. Fill attendee fields across standard DOM & nested iframes
#             frames_to_check = [page] + page.frames

#             for frame in frames_to_check:
#                 # Name Inputs
#                 fn = frame.locator("input[name*='first_name' i], input[id*='first-name' i], input[placeholder*='First' i]").first
#                 if await fn.is_visible(timeout=1000):
#                     await fn.fill(first_name)

#                 ln = frame.locator("input[name*='last_name' i], input[id*='last-name' i], input[placeholder*='Last' i]").first
#                 if await ln.is_visible(timeout=1000):
#                     await ln.fill(last_name)

#                 full_name_input = frame.locator("input[name*='name' i]:not([name*='first']):not([name*='last']), input[placeholder*='Full Name' i]").first
#                 if await full_name_input.is_visible(timeout=1000):
#                     await full_name_input.fill(full_name)

#                 # Email Inputs (Standard + Confirmation Email)
#                 emails = await frame.locator("input[type='email'], input[name*='email' i]").all()
#                 for em in emails:
#                     if await em.is_visible():
#                         await em.fill(email)

#                 # Phone Inputs
#                 phone_input = frame.locator("input[type='tel'], input[name*='phone' i]").first
#                 if await phone_input.is_visible(timeout=1000):
#                     await phone_input.fill(phone)

#                 # Fill Custom Dynamic Answers (e.g., github, tshirt_size)
#                 for key, val in answers.items():
#                     custom_field = frame.locator(
#                         f"input[name*='{key}' i], textarea[name*='{key}' i], "
#                         f"input[id*='{key}' i], input[placeholder*='{key}' i]"
#                     ).first
#                     if await custom_field.is_visible(timeout=800):
#                         await custom_field.fill(str(val))

#                 # 4. Submit Order / RSVP
#                 submit_btn = frame.locator(
#                     "button[type='submit'], button:has-text('Place Order'), "
#                     "button:has-text('Register'), button:has-text('Complete Registration')"
#                 ).first

#                 if await submit_btn.is_visible(timeout=2000):
#                     await submit_btn.click()
#                     await page.wait_for_timeout(4000)
#                     success = True
#                     break

#             await browser.close()

#     except Exception as e:
#         error_msg = str(e)
#         logger.warning(f"⚠️ Proxy registration failed for {source_url}: {e}")

#     # 5. Update Registration row status in Database
#     async with AsyncSessionLocal() as db:
#         new_status = "confirmed" if success else "action_required"
#         await db.execute(
#             update(Registration)
#             .where(Registration.id == registration_id)
#             .values(registration_status=new_status)
#         )
#         await db.commit()
#         logger.info(f"✅ [WORKER FINISHED] Registration {registration_id} marked as '{new_status}'")






import logging
import os
import traceback
from typing import Any, Dict, Optional
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
from sqlalchemy import update

from database import AsyncSessionLocal
from models import Registration

logger = logging.getLogger("eventdek.proxy_reg")
logging.basicConfig(level=logging.INFO)

DRY_RUN_MODE = os.getenv("PROXY_DRY_RUN", "true").lower() == "true"


async def execute_proxy_registration(
    registration_id: str,
    source_url: str,
    full_name: str,
    email: str,
    phone: str,
    custom_answers: Optional[Dict[str, Any]] = None,
    dry_run: bool = DRY_RUN_MODE,
):
    if not source_url or not source_url.startswith("http"):
        logger.info(f"⏭️ [SKIP] Not an external HTTP URL ({registration_id}): {source_url}")
        return

    name_parts = full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
    answers = custom_answers or {}

    tag = "🧪 [DRY RUN]" if dry_run else "🚀 [LIVE]"
    logger.info(f"\n{'=' * 65}\n{tag} Starting Proxy Registration Task\n{'=' * 65}")
    logger.info(f"📋 Reg ID  : {registration_id}")
    logger.info(f"🌐 Target  : {source_url}")
    logger.info(f"👤 Attendee: {first_name} {last_name} | {email} | {phone}")

    success = False
    failure_reason = "Submit button was never reached or form incomplete"

    try:
        async with async_playwright() as p:
            logger.info("⚙️ Step 1: Launching Chromium with stealth arguments...")
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-infobars",
                    "--window-size=1280,900",
                ],
            )

            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
                locale="en-US",
            )

            page = await context.new_page()

            # Apply stealth evasion patches (spoofs navigator.webdriver, hardware, plugins)
            await Stealth().apply_stealth_async(page)

            # Abort heavy tracking endpoints that freeze page navigation
            await page.route(
                "**/*{google-analytics,doubleclick,facebook,hotjar,segment,clarity,branch.io}*",
                lambda route: route.abort(),
            )

            popup_page = None

            def on_popup(popup):
                nonlocal popup_page
                popup_page = popup

            context.on("page", on_popup)

            # Step 2: Navigate with domcontentloaded and shorter timeout
            logger.info(f"🌐 Step 2: Navigating to {source_url}...")
            try:
                await page.goto(source_url, wait_until="domcontentloaded", timeout=25000)
            except Exception:
                logger.warning("   ⚠️ domcontentloaded timed out, trying to proceed with partial DOM...")

            await page.wait_for_timeout(2000)

            # Step 3: Dismiss Cookie Banners (safe try/except so it NEVER hangs)
            logger.info("🍪 Step 3: Checking for cookie consent...")
            try:
                cookie_btn = page.locator(
                    "#onetrust-accept-btn-handler, button:has-text('Accept All'), button:has-text('Accept Cookies')"
                ).first
                if await cookie_btn.count() > 0 and await cookie_btn.is_visible():
                    await cookie_btn.click(timeout=2000)
                    logger.info("   ↳ Dismissed cookie banner.")
                    await page.wait_for_timeout(1000)
            except Exception:
                logger.info("   ↳ Cookie banner check skipped or not found.")

            # Step 4: Strict Ticket / Register Triggers
            logger.info("🎟️ Step 4: Searching for initial Register/Tickets CTA...")
            primary_ctas = [
                "button[data-testid*='checkout-link']",
                "button#eventbrite-checkout",
                "button[data-testid*='register-button']",
                "div.conversion-bar button:has-text('Tickets')",
                "div.conversion-bar button:has-text('Register')",
                "button:has-text('Get tickets')",
                "button:has-text('Register')",
                "a[data-testid*='checkout-link']",
                "a:has-text('Get tickets')",
            ]

            for selector in primary_ctas:
                try:
                    cta = page.locator(selector).first
                    if await cta.count() > 0 and await cta.is_visible():
                        btn_text = (await cta.inner_text()).strip().replace("\n", " ")
                        logger.info(f"   ↳ Found Primary CTA [{selector}] -> '{btn_text}'")
                        await cta.click(timeout=3000)
                        await page.wait_for_timeout(3000)
                        break
                except Exception:
                    continue

            active_page = popup_page or page
            if popup_page:
                logger.info(f"   ↳ Using checkout popup tab: {popup_page.url}")
                await Stealth().apply_stealth_async(active_page)
                try:
                    await active_page.wait_for_load_state("domcontentloaded", timeout=10000)
                except Exception:
                    pass

            # Step 5: Ticket Quantity & Checkout Button
            logger.info("🔢 Step 5: Checking for tier quantity & checkout triggers...")
            try:
                plus_btn = active_page.locator(
                    "button[aria-label*='Add' i], "
                    "button[data-testid*='increase'], "
                    "div:has-text('Free') ~ div button:has-text('+'), "
                    "button:has-text('+')"
                ).first

                if await plus_btn.count() > 0 and await plus_btn.is_visible():
                    logger.info("   ↳ Clicking '+' to add 1 ticket...")
                    await plus_btn.click(timeout=2000)
                    await active_page.wait_for_timeout(1200)

                    checkout_btn = active_page.locator(
                        "button:has-text('Check out'), "
                        "button:has-text('Checkout'), "
                        "button:has-text('Register'), "
                        "button[data-testid*='checkout']"
                    ).first

                    if await checkout_btn.count() > 0 and await checkout_btn.is_visible():
                        btn_txt = (await checkout_btn.inner_text()).strip()
                        logger.info(f"   ↳ Clicking '{btn_txt}' to load attendee form...")
                        await checkout_btn.click(timeout=3000)
                        await active_page.wait_for_timeout(3500)
            except Exception as e:
                logger.info(f"   ↳ Tier selection step passed: {e}")

            # Step 6: Scan all frames for attendee inputs
            all_frames = [active_page] + active_page.frames
            logger.info(f"🔍 Step 6: Scanning {len(all_frames)} frame(s) for attendee inputs...")

            form_detected = False

            for idx, frame in enumerate(all_frames):
                if any(x in frame.url for x in ["google", "facebook", "doubleclick"]):
                    continue

                try:
                    fn_input = frame.locator(
                        "input[name*='first_name' i], input[id*='first-name' i], input[data-automation*='first-name' i]"
                    ).first
                    ln_input = frame.locator(
                        "input[name*='last_name' i], input[id*='last-name' i], input[data-automation*='last-name' i]"
                    ).first
                    full_name_input = frame.locator(
                        "input[name='name' i], input[placeholder*='Full Name' i]"
                    ).first
                    email_inputs = await frame.locator(
                        "input[type='email'], input[name*='email' i]"
                    ).all()
                    phone_input = frame.locator(
                        "input[type='tel'], input[name*='phone' i]"
                    ).first

                    # Name
                    if await fn_input.count() > 0 and await fn_input.is_visible():
                        form_detected = True
                        await fn_input.fill(first_name)
                        logger.info(f"      ✅ Filled First Name: '{first_name}'")

                    if await ln_input.count() > 0 and await ln_input.is_visible():
                        form_detected = True
                        await ln_input.fill(last_name)
                        logger.info(f"      ✅ Filled Last Name: '{last_name}'")

                    if not form_detected and await full_name_input.count() > 0 and await full_name_input.is_visible():
                        form_detected = True
                        await full_name_input.fill(full_name)
                        logger.info(f"      ✅ Filled Full Name: '{full_name}'")

                    # Email
                    if email_inputs:
                        form_detected = True
                        for e_idx, em in enumerate(email_inputs):
                            if await em.is_visible():
                                await em.fill(email)
                                logger.info(f"      ✅ Filled Email #{e_idx + 1}: '{email}'")

                    # Phone
                    if await phone_input.count() > 0 and await phone_input.is_visible():
                        await phone_input.fill(phone)
                        logger.info(f"      ✅ Filled Phone: '{phone}'")

                    # Custom Answers
                    for key, val in answers.items():
                        custom_el = frame.locator(
                            f"input[name*='{key}' i], textarea[name*='{key}' i]"
                        ).first
                        if await custom_el.count() > 0 and await custom_el.is_visible():
                            await custom_el.fill(str(val))
                            logger.info(f"      ✅ Filled Custom Answer '{key}': '{val}'")

                    # Step 7: Final Submit Button Confirmation
                    submit_selectors = [
                        "button[type='submit']",
                        "button:has-text('Place Order')",
                        "button:has-text('Complete Registration')",
                        "button[data-testid*='order-button']",
                        "button:has-text('Register')",
                    ]

                    for s_sel in submit_selectors:
                        submit_btn = frame.locator(s_sel).first
                        if await submit_btn.count() > 0 and await submit_btn.is_visible():
                            btn_txt = (await submit_btn.inner_text()).strip().replace("\n", " ")
                            logger.info(f"   🎯 Step 7: Found Final Checkout Button [{s_sel}] -> '{btn_txt}'")

                            if dry_run:
                                logger.info(f"   🛑 {tag} HALTING: Button verified. Stopping before submission.")
                                success = True
                                break
                            else:
                                await submit_btn.click()
                                await active_page.wait_for_timeout(4000)
                                logger.info("   🚀 Clicked Submit Button successfully.")
                                success = True
                                break

                    if success:
                        break

                except Exception as frame_err:
                    logger.debug(f"Frame inspection error: {frame_err}")
                    continue

            if not form_detected:
                failure_reason = "No attendee form inputs detected in any frame"
                logger.warning(f"   ⚠️ {failure_reason}")

            await browser.close()
            logger.info("🔒 Closed Playwright browser instance.")

    except Exception as e:
        failure_reason = f"Worker exception: {str(e)}"
        logger.error(f"❌ Worker Failure: {e}")
        logger.error(traceback.format_exc())

    async with AsyncSessionLocal() as db:
        new_status = "confirmed" if success else "action_required"
        await db.execute(
            update(Registration)
            .where(Registration.id == registration_id)
            .values(registration_status=new_status)
        )
        await db.commit()

        if success:
            logger.info(f"🎉 Success! Registration {registration_id} set to '{new_status}'.\n{'=' * 65}\n")
        else:
            logger.warning(f"⚠️ Incomplete: Registration {registration_id} set to '{new_status}'. Reason: {failure_reason}\n{'=' * 65}\n")