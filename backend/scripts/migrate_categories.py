#!/usr/bin/env python3
"""
CivicLens Database Migration Script: Part B (Multi-Category Support)
Converts legacy single 'category' documents to 'categories' string array (1-3 entries)
and ensures 'locality' field is populated.

Idempotent: Can be run multiple times safely without corrupting or duplicating data.
"""

import os
import sys
import json
import logging

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.services.firestore_service import firestore_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("civiclens.migration")


def migrate_local_json():
    """Migrate local civiclens_db.json file."""
    data_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "civiclens_db.json")
    if not os.path.exists(data_path):
        logger.info(f"Local database file not found at {data_path}. Skipping local migration.")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    complaints = data.get("complaints", [])
    migrated_count = 0

    for c in complaints:
        updated = False
        # 1. Convert legacy category -> categories array
        if "category" in c and ("categories" not in c or not isinstance(c["categories"], list)):
            cat_val = c["category"]
            c["categories"] = [cat_val] if cat_val else ["roads"]
            updated = True

        # Ensure categories is non-empty list capped at 3
        if "categories" in c and isinstance(c["categories"], list):
            c["categories"] = c["categories"][:3]

        # 2. Ensure locality exists
        if "locality" not in c or not c["locality"]:
            c["locality"] = "unspecified"
            updated = True

        if updated:
            migrated_count += 1

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    logger.info(f"✅ Local JSON migration complete: {migrated_count}/{len(complaints)} complaints migrated.")


def migrate_firestore():
    """Migrate cloud Firestore database if credentials are present."""
    if not firestore_service.use_cloud_firestore or not firestore_service.db:
        logger.info("Cloud Firestore not configured. Skipping remote Firestore migration.")
        return

    db = firestore_service.db
    logger.info(f"Starting Firestore migration on project: {settings.FIREBASE_PROJECT_ID}...")

    docs = db.collection("complaints").stream()
    count = 0
    updated_count = 0

    for doc in docs:
        count += 1
        d = doc.to_dict()
        updates = {}

        if "category" in d and ("categories" not in d or not isinstance(d.get("categories"), list)):
            cat_val = d["category"]
            updates["categories"] = [cat_val] if cat_val else ["roads"]

        if "categories" in d and isinstance(d["categories"], list):
            if len(d["categories"]) > 3:
                updates["categories"] = d["categories"][:3]

        if "locality" not in d or not d["locality"]:
            updates["locality"] = "unspecified"

        if updates:
            doc.reference.update(updates)
            updated_count += 1

    logger.info(f"✅ Firestore migration complete: {updated_count}/{count} documents updated.")


if __name__ == "__main__":
    logger.info("==================================================================")
    logger.info("CivicLens Migration: Converting to Multi-Category Schema")
    logger.info("==================================================================")
    migrate_local_json()
    migrate_firestore()
    logger.info("Migration finished successfully.")
