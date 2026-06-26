#!/usr/bin/env python3
"""Reindex all products from SQLite to Typesense.

Usage:
    PYTHONPATH=. python scripts/reindex_typesense.py
"""

import sys
sys.path.insert(0, ".")

from app.db.session import SessionLocal
from app.services.typesense_service import reindex_all


def main():
    db = SessionLocal()
    try:
        count = reindex_all(db)
        print(f"Reindexed {count} products successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
