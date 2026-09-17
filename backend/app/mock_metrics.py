"""Synthetic carbon/biodiversity time-series generator.

The hackathon brief explicitly allows mock datasets. Real satellite-derived
carbon-stock and biodiversity-index feeds (e.g. from Sentinel-2 NDVI or field
surveys) are not available in this environment, so we generate a
deterministic, seeded time series per site. Determinism (seeded on the site
name) keeps demo data stable across restarts and makes the charts reproducible
for reviewers without needing an external data pipeline.
"""

import hashlib
import math
from datetime import date, timedelta

MONTHS_OF_HISTORY = 24


def _seed_for(site_name: str) -> int:
    digest = hashlib.sha256(site_name.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def generate_monthly_metrics(site_name: str, area_hectares: float) -> list[dict]:
    seed = _seed_for(site_name)
    rng_state = seed
    metrics = []
    today = date.today().replace(day=1)
    base_carbon = max(area_hectares, 1.0) * 2.4

    for i in range(MONTHS_OF_HISTORY, 0, -1):
        month_date = today - timedelta(days=30 * i)
        rng_state = (rng_state * 1103515245 + 12345) & 0x7FFFFFFF
        noise = (rng_state % 1000) / 1000.0

        growth_progress = (MONTHS_OF_HISTORY - i) / MONTHS_OF_HISTORY
        seasonal = math.sin((month_date.month / 12.0) * 2 * math.pi) * 0.08

        carbon_multiplier = (1 + growth_progress * 0.9 + seasonal) * (0.92 + noise * 0.16)
        carbon_tons = round(base_carbon * carbon_multiplier, 2)

        biodiversity_raw = 0.35 + growth_progress * 0.45 + seasonal + noise * 0.1
        biodiversity_index = round(min(1.0, max(0.0, biodiversity_raw)), 3)

        ndvi_raw = 0.2 + growth_progress * 0.55 + seasonal * 0.5 + noise * 0.05
        ndvi = round(min(1.0, max(-1.0, ndvi_raw)), 3)

        metrics.append(
            {
                "recorded_on": month_date,
                "carbon_tons": carbon_tons,
                "biodiversity_index": biodiversity_index,
                "ndvi": ndvi,
            }
        )
    return metrics
