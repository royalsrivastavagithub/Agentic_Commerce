"""
Add reviews & ratings to all products for testing the rating filter.
Creates test users, then adds 2-3 reviews per product with varied ratings.
"""

import random
import sys
from pathlib import Path

_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.db.session import SessionLocal
from app.models.user import User

API_PREFIX = "/api/v1"

REVIEW_COMMENTS = [
    "Great product, very satisfied!",
    "Good quality for the price.",
    "Works as expected, happy with purchase.",
    "Decent product, could be better.",
    "Average quality, nothing special.",
    "Not bad, but there are better options.",
    "Excellent quality, highly recommend!",
    "Love this! Will buy again.",
    "Pretty good overall.",
    "Does the job, no complaints.",
    "Amazing product, exceeded expectations!",
    "Okay for the price point.",
    "Solid build quality, recommended.",
    "Would give 3.5 stars if possible.",
    "Fantastic! Best purchase this year.",
]


def _get_or_create_user(db, email, first_name, role="user"):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            first_name=first_name,
            hashed_password=get_password_hash("test123"),
            is_active=True,
            is_verified=True,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"  Created user: {email}")
    else:
        print(f"  Using existing user: {email} (id={user.id})")
    return user


def main():
    client = TestClient(app)
    db = SessionLocal()

    # Get admin token for creating users if needed
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = _get_or_create_user(db, "seed-admin@example.com", "Admin", role="admin")
    admin_token = create_access_token(subject=admin.id, role=admin.role)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create test users
    test_users = []
    for i in range(5):
        email = f"reviewer{i}@test.com"
        user = _get_or_create_user(db, email, f"Reviewer{i}")
        token = create_access_token(subject=user.id, role="user")
        test_users.append({"id": user.id, "email": email, "token": token})
    db.close()

    # Get all products
    resp = client.get(f"{API_PREFIX}/products?limit=1000")
    products = resp.json()["products"]
    print(f"\nTotal products: {len(products)}")

    created = 0
    errors = 0
    for p in products:
        pid = p["id"]
        # Each product gets 2-3 reviews from different users
        num_reviews = random.randint(2, 3)
        reviewers = random.sample(test_users, num_reviews)
        for r in reviewers:
            rating = random.randint(1, 5)
            comment = random.choice(REVIEW_COMMENTS)
            headers = {"Authorization": f"Bearer {r['token']}"}
            resp = client.post(
                f"{API_PREFIX}/products/{pid}/reviews",
                json={"rating": rating, "comment": comment},
                headers=headers,
            )
            if resp.status_code == 201:
                created += 1
            elif resp.status_code == 409:
                pass  # already reviewed
            else:
                errors += 1
                if errors <= 5:
                    print(f"  Error {resp.status_code} for product {pid}: {resp.text[:80]}")

    # Show final rating distribution
    resp = client.get(f"{API_PREFIX}/products?limit=1000")
    products = resp.json()["products"]
    dist = {}
    for p in products:
        r = int(p["rating"])
        dist[r] = dist.get(r, 0) + 1

    print(f"\nCreated {created} reviews, {errors} errors")
    print("\nFinal rating distribution:")
    for r in sorted(dist):
        print(f"  ★{r}: {dist[r]} products")

    print("\nSample products with reviews:")
    for p in products[:10]:
        print(f"  {p['title']:45s} ★{p['rating']}  ({p['review_count']} reviews)")


if __name__ == "__main__":
    main()
