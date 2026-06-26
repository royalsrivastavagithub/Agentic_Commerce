from langchain_core.tools import tool
from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.services.cart_service import (
    add_cart_item as _add_cart_item,
    update_cart_item as _update_cart_item,
    remove_cart_item as _remove_cart_item,
    clear_cart as _clear_cart,
)
from app.services.product_service import (
    search_products as _search_products_sql,
    search_products_typesense as _search_products_ts,
    get_product_by_id as _get_product_by_id,
)


def _to_card(p: Product) -> dict:
    return {
        "product_id": p.id,
        "title": p.title,
        "price": p.price,
        "rating": p.rating,
        "brand": p.brand,
        "category": p.category,
        "thumbnail": p.thumbnail,
        "stock": p.stock,
        "description": p.description,
    }


def _make_context(db: Session, query: str | None, category: str | None) -> tuple[str | None, int | None]:
    search_query = query or ""
    category_id = None
    if category:
        cat = db.query(Category).filter(Category.name.ilike(category)).first()
        if cat:
            category_id = cat.id
        elif not search_query:
            search_query = category
    return search_query, category_id


def _tied_top(items: list[Product], attr: str, top_n: int = 10) -> tuple[list[Product], str]:
    if not items:
        return [], ""
    top_val = getattr(items[0], attr)
    tied = [p for p in items if getattr(p, attr) == top_val][:top_n]
    if len(tied) == 1:
        label = tied[0].title
    elif len(tied) <= 3:
        label = f"tie: {'; '.join(p.title for p in tied)}"
    else:
        label = f"{len(tied)} products tied at {top_val}"
    return tied, label


_ATTR_DISPLAY = {
    "id": "id",
    "price": "price",
    "rating": "rating",
    "discount_percentage": "discount_percentage",
    "review_count": "review_count",
    "stock": "stock",
}

_SORT_LABELS = {
    ("price", "asc"): "Cheapest",
    ("price", "desc"): "Most expensive",
    ("rating", "desc"): "Highest rated",
    ("rating", "asc"): "Lowest rated",
    ("discount_percentage", "desc"): "Best discount",
    ("review_count", "desc"): "Most reviewed",
    ("review_count", "asc"): "Least reviewed",
    ("id", "desc"): "Newest",
    ("stock", "desc"): "Highest stock",
    ("stock", "asc"): "Lowest stock",
}


def _search_results(items: list[Product], sort_by: str, sort_order: str) -> dict:
    if not items:
        return {"message": "No products found.", "product_ids": []}
    ids = [p.id for p in items]
    if sort_by:
        tied, label = _tied_top(items, sort_by)
        sort_label = _SORT_LABELS.get((sort_by, sort_order), "Sorted")
        attr = _ATTR_DISPLAY.get(sort_by, "")
        if attr == "price":
            msg = f"{sort_label}: {label} (${tied[0].price})"
        elif attr == "discount_percentage":
            msg = f"{sort_label}: {label} ({tied[0].discount_percentage}% off)"
        elif attr:
            msg = f"{sort_label}: {label} ({getattr(tied[0], attr)})"
        else:
            msg = f"{sort_label}: {label}"
        return {"message": msg, "product_ids": [p.id for p in tied]}
    return {"message": f"Found {len(items)} results.", "product_ids": ids}


_SORTABLE_FIELDS = {"price", "rating", "discount", "review_count", "created_at", "stock", "title"}

_SORT_ATTR_MAP = {
    "price": "price",
    "rating": "rating",
    "discount": "discount_percentage",
    "review_count": "review_count",
    "created_at": "id",
    "stock": "stock",
}


def make_context_tools(db: Session, user: User) -> list:

    # ── Search + Sort (consolidated) ────────────────────────

    @tool
    def search_products(
        query: str,
        category: str | None = None,
        sort_by: str | None = None,
        sort_order: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_rating: float | None = None,
        in_stock: bool | None = None,
    ) -> dict:
        """Search products by keyword with optional filters and sorting.

        Args:
            query: The search keyword or product name (e.g. "watches", "iphone").
            category: Optional category name to filter by (e.g. "smartphones", "mens-watches").
            sort_by: Sort field — "price", "rating", "discount", "review_count", "created_at", "stock".
            sort_order: "asc" or "desc" (default "asc"). Use "desc" for highest/most/best, "asc" for lowest/cheapest/worst.
            min_price: Minimum price filter.
            max_price: Maximum price filter.
            min_rating: Minimum rating filter.
            in_stock: True for in-stock only, False for out-of-stock only.
        """
        sort_order = sort_order or "asc"
        sort_by_field = _SORT_ATTR_MAP.get(sort_by, "") if sort_by else ""

        if settings.TYPESENSE_ENABLED:
            items, total = _search_products_ts(
                db=db, q=query, category=category,
                in_stock=in_stock, min_price=min_price, max_price=max_price,
                min_rating=min_rating, sort_by=sort_by_field, sort_order=sort_order,
                limit=20,
            )
        else:
            search_query, category_id = _make_context(db, query, category)
            items, total = _search_products_sql(
                db=db, q=search_query, category_id=category_id,
                min_price=min_price, max_price=max_price, min_rating=min_rating,
                in_stock=in_stock, sort_by=sort_by_field, sort_order=sort_order,
                limit=20,
            )
        return _search_results(items, _SORT_ATTR_MAP.get(sort_by, "") if sort_by else "", sort_order)

    # ── Product info ───────────────────────────────────────

    @tool
    def get_product_details(product_id: int) -> dict:
        """Get full details for a specific product by its ID. Returns the product object."""
        try:
            p = _get_product_by_id(db, product_id)
            return _to_card(p)
        except NotFoundError:
            return {"error": f"Product with ID {product_id} not found."}

    @tool
    def list_categories() -> dict:
        """List all available product categories."""
        cats = db.query(Category).order_by(Category.name).all()
        return {"categories": [c.name for c in cats]}

    # ── Cart operations ─────────────────────────────────────

    @tool
    def add_to_cart(product_name: str, quantity: int = 1) -> dict:
        """Add a product to your shopping cart by product name.

        Args:
            product_name: The exact product name to add (search first if unsure).
            quantity: How many units to add (default 1).
        """
        p = db.query(Product).filter(Product.title.ilike(product_name)).first()
        if not p:
            return {"success": False, "message": f"Could not find a product named '{product_name}'."}
        try:
            _add_cart_item(db, user.id, p.id, quantity)
            return {"success": True, "message": f"Added {quantity} × {p.title} to your cart.", "product_id": p.id}
        except (BadRequestError, NotFoundError) as e:
            return {"success": False, "message": str(e)}

    @tool
    def get_cart_summary() -> dict:
        """View the current user's shopping cart contents and total price."""
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart or not cart.items:
            return {"items": [], "total": 0.0, "message": "Your cart is empty."}

        items = []
        product_ids = []
        total = 0.0
        for item in cart.items:
            p = item.product
            if not p:
                continue
            product_ids.append(p.id)
            subtotal = item.quantity * item.product_price
            total += subtotal
            items.append({
                "product_id": p.id,
                "title": p.title,
                "quantity": item.quantity,
                "unit_price": item.product_price,
                "subtotal": round(subtotal, 2),
            })

        return {
            "items": items,
            "total": round(total, 2),
            "product_ids": product_ids,
            "message": f"Cart: {len(items)} item(s), ${total:.2f} total.",
        }

    @tool
    def update_cart_item(product_name: str, quantity: int) -> dict:
        """Update the quantity of a product in your cart by product name.

        Args:
            product_name: The product name whose cart quantity to change.
            quantity: New quantity (must be > 0). Set to 0 to remove.
        """
        p = db.query(Product).filter(Product.title.ilike(product_name)).first()
        if not p:
            return {"success": False, "message": f"Could not find a product named '{product_name}'."}
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            return {"success": False, "message": "Cart is empty."}
        citem = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == p.id)
            .first()
        )
        if not citem:
            return {"success": False, "message": "Product not found in your cart."}
        try:
            if quantity <= 0:
                _remove_cart_item(db, user.id, citem.id)
                return {"success": True, "message": f"Removed product from cart.", "product_name": product_name}
            _update_cart_item(db, user.id, citem.id, quantity)
            return {"success": True, "message": f"Updated quantity to {quantity}.", "product_name": product_name}
        except (BadRequestError, NotFoundError) as e:
            return {"success": False, "message": str(e)}

    @tool
    def remove_cart_item(product_name: str) -> dict:
        """Remove a product from your shopping cart by product name.

        Args:
            product_name: The product name to remove from cart.
        """
        p = db.query(Product).filter(Product.title.ilike(product_name)).first()
        if not p:
            return {"success": False, "message": f"Could not find a product named '{product_name}'."}
        cart = db.query(Cart).filter(Cart.user_id == user.id).first()
        if not cart:
            return {"success": False, "message": "Cart is empty."}
        citem = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.id, CartItem.product_id == p.id)
            .first()
        )
        if not citem:
            return {"success": False, "message": "Product not found in your cart."}
        try:
            _remove_cart_item(db, user.id, citem.id)
            return {"success": True, "message": f"Removed from cart.", "product_name": product_name}
        except (BadRequestError, NotFoundError) as e:
            return {"success": False, "message": str(e)}

    @tool
    def clear_cart() -> dict:
        """Remove all items from your shopping cart."""
        _clear_cart(db, user.id)
        return {"success": True, "message": "Cart cleared."}

    return [
        search_products,
        get_product_details,
        list_categories,
        add_to_cart,
        get_cart_summary,
        update_cart_item,
        remove_cart_item,
        clear_cart,
    ]
