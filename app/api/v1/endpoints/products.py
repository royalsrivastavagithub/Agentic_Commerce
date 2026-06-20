import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.product import ProductSchema, ProductsResponse

DATA_DIR = Path(__file__).resolve().parents[4] / "data"
PRODUCTS_FILE = DATA_DIR / "products.json"

router = APIRouter(tags=["products"])
categories_router = APIRouter(tags=["categories"])


def _load_products() -> list[dict]:
    with open(PRODUCTS_FILE) as f:
        data = json.load(f)
    return data["products"]


@router.get("/products", response_model=ProductsResponse)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
):
    all_products = _load_products()
    total = len(all_products)
    paged = all_products[skip : skip + limit]
    return ProductsResponse(products=paged, total=total, skip=skip, limit=limit)


@router.get("/products/search", response_model=ProductsResponse)
async def search_products(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
):
    all_products = _load_products()
    q_lower = q.lower()
    matched = [p for p in all_products if q_lower in p["title"].lower()]
    total = len(matched)
    paged = matched[skip : skip + limit]
    return ProductsResponse(products=paged, total=total, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductSchema)
async def get_product(product_id: int):
    all_products = _load_products()
    for p in all_products:
        if p["id"] == product_id:
            return p
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Product with id {product_id} not found",
    )


@categories_router.get("/categories", response_model=list[str])
async def get_categories():
    all_products = _load_products()
    seen: set[str] = set()
    for p in all_products:
        seen.add(p["category"])
    return sorted(seen)


@categories_router.get("/categories/{category_name}", response_model=ProductsResponse)
async def get_products_by_category(
    category_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
):
    all_products = _load_products()
    matched = [p for p in all_products if p["category"] == category_name]
    if not matched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category_name}' not found",
        )
    total = len(matched)
    paged = matched[skip : skip + limit]
    return ProductsResponse(products=paged, total=total, skip=skip, limit=limit)
