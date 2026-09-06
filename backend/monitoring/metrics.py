# monitoring/metrics.py
from prometheus_client import Counter, Histogram, make_asgi_app

# 1. Total scraper executions categorized by platform and outcome
SCRAPE_RUNS = Counter(
    "scraper_runs_total", 
    "Total scraper runs executed", 
    ["source_platform", "status"]
)

# 2. Total unique events persisted to the database
EVENTS_INGESTED = Counter(
    "scraper_events_ingested_total", 
    "Total events successfully added to the database", 
    ["source_platform", "state_id"]
)

# 3. Scraper execution duration tracking
SCRAPE_DURATION = Histogram(
    "scraper_execution_seconds", 
    "Time taken for scraping jobs to complete",
    ["source_platform"]
)

# ASGI app serving Prometheus text format
metrics_asgi_app = make_asgi_app()