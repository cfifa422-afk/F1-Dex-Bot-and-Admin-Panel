from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "admin_panel"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "admin_panel.settings")
os.environ.setdefault("BALLSDEXBOT_DB_URL", os.environ.get("DATABASE_URL", ""))

import django

django.setup()

from settings.models import Settings


settings = Settings.objects.first() or Settings()
settings.bot_name = "F1 Dex"
settings.collectible_name = "driver"
settings.plural_collectible_name = "drivers"
settings.balls_slash_name = "drivers"
settings.prefix = "f1."
settings.site_base_url = os.environ.get("F1_DEX_SITE_URL", "http://localhost:5000")
if token := os.environ.get("DISCORD_TOKEN"):
    settings.bot_token = token
settings.save()
print("F1 Dex settings ready")