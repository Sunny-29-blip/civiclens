#!/usr/bin/env python3
"""
CivicLens Firestore Seeder Script: Part C & D
Pushes INITIAL_COMPLAINTS (with multi-category array and locality)
and INITIAL_OFFICIALS (with 4-tier jurisdictions and bcrypt-hashed passwords)
into Firestore.

Idempotent: Uses document ID upserts (.set() / document keys) to avoid duplicates.
"""

import os
import sys
import logging

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.services.firestore_service import firestore_service, INITIAL_COMPLAINTS, INITIAL_OFFICIALS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("civiclens.seeder")


def seed():
    logger.info("==================================================================")
    logger.info(f"CivicLens Firestore Seeder (Project: {settings.FIREBASE_PROJECT_ID})")
    logger.info("==================================================================")

    if firestore_service.use_cloud_firestore and firestore_service.db:
        db = firestore_service.db
        logger.info("Connecting to Cloud Firestore...")

        # 1. Seed Complaints
        logger.info(f"Seeding {len(INITIAL_COMPLAINTS)} complaints into 'complaints' collection...")
        for complaint in INITIAL_COMPLAINTS:
            doc_id = complaint["id"]
            db.collection("complaints").document(doc_id).set(complaint)
            logger.info(f"  -> Upserted complaint: {doc_id} ({complaint['categories']} - {complaint['locality']}, {complaint['district']})")

        # 2. Seed Officials (4 tiers with bcrypt hashes)
        logger.info(f"Seeding {len(INITIAL_OFFICIALS)} officials into 'officials' collection...")
        for official in INITIAL_OFFICIALS:
            doc_id = official["official_id"]
            db.collection("officials").document(doc_id).set(official)
            logger.info(f"  -> Upserted official: {doc_id} ({official['name']} - Level: {official['level']})")

        logger.info("✅ Real Cloud Firestore seeded successfully!")
    else:
        logger.info("Cloud Firestore credentials not active. Seeding local database JSON file...")
        data = {
            "complaints": INITIAL_COMPLAINTS,
            "officials": INITIAL_OFFICIALS,
            "otps": {}
        }
        firestore_service._save_local_data(data)
        logger.info(f"✅ Local database seeded with {len(INITIAL_COMPLAINTS)} complaints and {len(INITIAL_OFFICIALS)} officials.")


if __name__ == "__main__":
    seed()
