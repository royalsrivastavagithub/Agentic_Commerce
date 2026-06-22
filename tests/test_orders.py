from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.address import Address
from app.models.cart import Cart, CartItem
from app.models.order import OrderStatus
from app.core.security import create_access_token, get_password_hash


SAMPLE_PRODUCT = {
    "title": "Order Test Product",
    "description": "A product for order testing",
    "price": 29.99,
    "discountPercentage": 10.0,
    "rating": 4.5,
    "stock": 50,
    "tags": ["test"],
    "brand": "TestBrand",
    "sku": "ORD-TST-001",
    "weight": 1.5,
    "dimensions": {"width": 10.0, "height": 5.0, "depth": 3.0},
    "warrantyInformation": "1 year warranty",
    "shippingInformation": "Ships in 3-5 days",
    "availabilityStatus": "In Stock",
    "reviews": [],
    "returnPolicy": "30 days return",
    "minimumOrderQuantity": 1,
    "meta": {
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "barcode": "123456789",
        "qrCode": "https://example.com/qr",
    },
    "images": ["https://example.com/img1.jpg"],
    "thumbnail": "https://example.com/thumb.jpg",
}


def _create_user(db: Session, email: str = "orderuser@test.com", name: str | None = None) -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash("pw123"),
        is_active=True,
        is_verified=True,
        role="user",
        first_name=name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_admin(db: Session) -> User:
    admin = User(
        email="orderadmin@test.com",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_verified=True,
        role="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def _user_token(user: User) -> dict:
    token = create_access_token(subject=user.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}


def _create_category(db: Session, name: str = "order-cat") -> int:
    cat = Category(name=name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat.id


def _create_product(
    db: Session, cat_id: int, overrides: dict | None = None,
) -> Product:
    data = {**SAMPLE_PRODUCT}
    if overrides:
        data.update(overrides)
    product = Product(
        title=data["title"],
        description=data["description"],
        category_id=cat_id,
        price=data["price"],
        discount_percentage=data["discountPercentage"],
        rating=data["rating"],
        stock=data["stock"],
        tags=data["tags"],
        brand=data.get("brand"),
        sku=data["sku"],
        weight=data["weight"],
        dimensions=data["dimensions"],
        warranty_information=data["warrantyInformation"],
        shipping_information=data["shippingInformation"],
        availability_status=data["availabilityStatus"],
        reviews=data["reviews"],
        return_policy=data["returnPolicy"],
        minimum_order_quantity=data["minimumOrderQuantity"],
        meta=data["meta"],
        images=data["images"],
        thumbnail=data["thumbnail"],
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def _create_address(db: Session, user_id: int) -> Address:
    addr = Address(
        user_id=user_id,
        label="Home",
        street="123 Test St",
        city="Mumbai",
        state="Maharashtra",
        pincode="400001",
        country="India",
        is_default=True,
        address_type="both",
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


def _add_to_cart(db: Session, user_id: int, product_id: int, quantity: int = 2):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()


class TestCheckout:
    def test_successful_checkout(self, client: TestClient, db: Session):
        user = _create_user(db, name="John")
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id, {"stock": 10})
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id, quantity=2)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["shipping_name"] == "John"
        assert data["shipping_address_line_1"] == "123 Test St"
        assert data["shipping_city"] == "Mumbai"
        assert data["subtotal"] == round(2 * product.price, 2)
        assert len(data["items"]) == 1

    def test_empty_cart_returns_400(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        address = _create_address(db, user.id)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()

    def test_invalid_address_returns_404(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        _add_to_cart(db, user.id, product.id)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": 99999},
            headers=headers,
        )
        assert resp.status_code == 404

    def test_address_belonging_to_another_user_returns_404(self, client: TestClient, db: Session):
        user1 = _create_user(db, "user1@test.com")
        user2 = _create_user(db, "user2@test.com")
        headers2 = _user_token(user2)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        _add_to_cart(db, user2.id, product.id)

        # address belongs to user1
        address = _create_address(db, user1.id)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers2,
        )
        assert resp.status_code == 404

    def test_insufficient_stock_returns_400(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id, {"stock": 1})
        address = _create_address(db, user.id)
        # Add 5 but only 1 in stock
        _add_to_cart(db, user.id, product.id, quantity=5)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "stock" in resp.json()["detail"].lower()

    def test_cart_emptied_after_checkout(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        client.post("/api/v1/orders", json={"address_id": address.id}, headers=headers)

        cart_resp = client.get("/api/v1/cart", headers=headers)
        assert cart_resp.json()["items"] == []

    def test_stock_reduced_after_checkout(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id, {"stock": 10})
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id, quantity=3)

        client.post("/api/v1/orders", json={"address_id": address.id}, headers=headers)

        db.refresh(product)
        assert product.stock == 7

    def test_order_item_has_product_snapshot(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id, {"price": 15.99})
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id, quantity=2)

        resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        )
        item = resp.json()["items"][0]
        assert item["product_id"] == product.id
        assert item["product_name"] == product.title
        assert item["product_price"] == 15.99
        assert item["quantity"] == 2
        assert item["subtotal"] == 31.98

    def test_order_subtotal_matches_cart_total(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        p1 = _create_product(db, cat_id, {"sku": "MULTI-1", "price": 10.0, "title": "P1"})
        p2 = _create_product(db, cat_id, {"sku": "MULTI-2", "price": 20.0, "title": "P2"})
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, p1.id, quantity=3)
        _add_to_cart(db, user.id, p2.id, quantity=2)

        cart_resp = client.get("/api/v1/cart", headers=headers)
        cart_total = cart_resp.json()["total"]

        order_resp = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        )
        assert order_resp.status_code == 201
        assert order_resp.json()["subtotal"] == cart_total
        assert order_resp.json()["subtotal"] == round(3 * 10.0 + 2 * 20.0, 2)
        assert len(order_resp.json()["items"]) == 2


class TestListOrders:
    def test_list_returns_own_orders_only(self, client: TestClient, db: Session):
        user1 = _create_user(db, "list1@test.com", "User One")
        user2 = _create_user(db, "list2@test.com", "User Two")
        cat_id = _create_category(db)

        p1 = _create_product(db, cat_id, {"sku": "LST-1"})
        addr1 = _create_address(db, user1.id)
        _add_to_cart(db, user1.id, p1.id)
        client.post(
            "/api/v1/orders",
            json={"address_id": addr1.id},
            headers=_user_token(user1),
        )

        p2 = _create_product(db, cat_id, {"sku": "LST-2", "title": "P2"})
        addr2 = _create_address(db, user2.id)
        _add_to_cart(db, user2.id, p2.id)
        client.post(
            "/api/v1/orders",
            json={"address_id": addr2.id},
            headers=_user_token(user2),
        )

        resp1 = client.get("/api/v1/orders", headers=_user_token(user1))
        assert len(resp1.json()) == 1
        assert resp1.json()[0]["shipping_name"] == "User One"

        resp2 = client.get("/api/v1/orders", headers=_user_token(user2))
        assert len(resp2.json()) == 1
        assert resp2.json()[0]["shipping_name"] == "User Two"

    def test_list_orders_newest_first(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        p1 = _create_product(db, cat_id, {"sku": "NEW-1"})
        p2 = _create_product(db, cat_id, {"sku": "NEW-2", "title": "P2"})
        addr = _create_address(db, user.id)

        _add_to_cart(db, user.id, p1.id)
        client.post("/api/v1/orders", json={"address_id": addr.id}, headers=headers)
        db.query(CartItem).delete()
        db.commit()

        _add_to_cart(db, user.id, p2.id)
        client.post("/api/v1/orders", json={"address_id": addr.id}, headers=headers)

        orders = client.get("/api/v1/orders", headers=headers).json()
        assert len(orders) == 2
        assert orders[0]["id"] > orders[1]["id"]


class TestGetOrder:
    def test_get_own_order(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        ).json()

        resp = client.get(f"/api/v1/orders/{created['id']}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_get_other_users_order_returns_404(self, client: TestClient, db: Session):
        user1 = _create_user(db, "get1@test.com")
        user2 = _create_user(db, "get2@test.com")
        cat_id = _create_category(db)

        product = _create_product(db, cat_id)
        address = _create_address(db, user1.id)
        _add_to_cart(db, user1.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=_user_token(user1),
        ).json()

        resp = client.get(
            f"/api/v1/orders/{created['id']}",
            headers=_user_token(user2),
        )
        assert resp.status_code == 404

    def test_get_nonexistent_order_returns_404(self, client: TestClient, db: Session):
        user = _create_user(db)
        resp = client.get("/api/v1/orders/99999", headers=_user_token(user))
        assert resp.status_code == 404


class TestCancelOrder:
    def test_cancel_pending_order(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        ).json()

        resp = client.put(
            f"/api/v1/orders/{created['id']}/cancel",
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "CANCELLED"

    def test_cancel_confirmed_order_returns_400(self, client: TestClient, db: Session):
        user = _create_user(db)
        headers = _user_token(user)
        admin = _create_admin(db)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=headers,
        ).json()

        # Admin sets to CONFIRMED
        client.patch(
            f"/api/v1/admin/orders/{created['id']}/status",
            json={"status": "CONFIRMED"},
            headers=_user_token(admin),
        )

        # User tries to cancel
        resp = client.put(
            f"/api/v1/orders/{created['id']}/cancel",
            headers=headers,
        )
        assert resp.status_code == 400

    def test_cancel_other_users_order_returns_404(self, client: TestClient, db: Session):
        user1 = _create_user(db, "cancel1@test.com")
        user2 = _create_user(db, "cancel2@test.com")
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user1.id)
        _add_to_cart(db, user1.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=_user_token(user1),
        ).json()

        resp = client.put(
            f"/api/v1/orders/{created['id']}/cancel",
            headers=_user_token(user2),
        )
        assert resp.status_code == 404


class TestAdminOrders:
    def test_list_all_orders(self, client: TestClient, db: Session):
        user = _create_user(db)
        admin = _create_admin(db)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)
        client.post("/api/v1/orders", json={"address_id": address.id}, headers=_user_token(user))

        resp = client.get("/api/v1/admin/orders", headers=_user_token(admin))
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_non_admin_cannot_list_all_orders(self, client: TestClient, db: Session):
        user = _create_user(db)
        resp = client.get("/api/v1/admin/orders", headers=_user_token(user))
        assert resp.status_code == 403

    def test_update_order_status(self, client: TestClient, db: Session):
        user = _create_user(db)
        admin = _create_admin(db)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=_user_token(user),
        ).json()

        resp = client.patch(
            f"/api/v1/admin/orders/{created['id']}/status",
            json={"status": "SHIPPED"},
            headers=_user_token(admin),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "SHIPPED"

    def test_update_status_non_admin_forbidden(self, client: TestClient, db: Session):
        user = _create_user(db)
        cat_id = _create_category(db)
        product = _create_product(db, cat_id)
        address = _create_address(db, user.id)
        _add_to_cart(db, user.id, product.id)

        created = client.post(
            "/api/v1/orders",
            json={"address_id": address.id},
            headers=_user_token(user),
        ).json()

        resp = client.patch(
            f"/api/v1/admin/orders/{created['id']}/status",
            json={"status": "SHIPPED"},
            headers=_user_token(user),
        )
        assert resp.status_code == 403

    def test_update_nonexistent_order_returns_404(self, client: TestClient, db: Session):
        admin = _create_admin(db)
        resp = client.patch(
            "/api/v1/admin/orders/99999/status",
            json={"status": "SHIPPED"},
            headers=_user_token(admin),
        )
        assert resp.status_code == 404
