"""
Seed script: reads products from data/products.json and inserts them into the
database via the POST /api/v1/products endpoint using FastAPI's TestClient.

Usage:
    python scripts/seed_products.py          # seed if DB is empty
    python scripts/seed_products.py --force   # clear and re-seed
"""

import json
import sys
from pathlib import Path

# Ensure the project root is on sys.path
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi.testclient import TestClient

from app.main import app
from app.core.security import get_password_hash, create_access_token
from app.db.session import SessionLocal
from app.models.user import User

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
PRODUCTS_FILE = DATA_DIR / "products.json"
API_PREFIX = "/api/v1"


def _get_admin_headers() -> dict:
    db = SessionLocal()
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = User(
            email="seed-admin@example.com",
            hashed_password=get_password_hash("seed-admin-pw"),
            is_active=True,
            is_verified=True,
            role="admin",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    db.close()
    token = create_access_token(subject=admin.id, role=admin.role)
    return {"Authorization": f"Bearer {token}"}


def load_products() -> list[dict]:
    with open(PRODUCTS_FILE) as f:
        data = json.load(f)
    return data["products"]


def seed(force: bool = False) -> None:
    client = TestClient(app)
    headers = _get_admin_headers()
    products = load_products()

    print(f"Loaded {len(products)} products from {PRODUCTS_FILE}")

    if force:
        print("Fetching existing products to clear…")
        resp = client.get(f"{API_PREFIX}/products?limit=1000")
        if resp.status_code == 200:
            existing = resp.json().get("products", [])
            for p in existing:
                client.delete(f"{API_PREFIX}/products/{p['id']}", headers=headers)
            print(f"Deleted {len(existing)} existing products")
        else:
            print("Could not fetch existing products; proceeding anyway")

    created = 0
    skipped = 0
    errors = 0

    for p in products:
        resp = client.post(f"{API_PREFIX}/products", json=p, headers=headers)
        if resp.status_code == 201:
            created += 1
        elif resp.status_code == 409:
            skipped += 1
        else:
            errors += 1
            print(f"  Error {resp.status_code} for product {p.get('id')}: {resp.text[:120]}")

    print(f"\nDone. Created: {created}, Skipped (already exist): {skipped}, Errors: {errors}")


if __name__ == "__main__":
    force = "--force" in sys.argv
    seed(force=force)
