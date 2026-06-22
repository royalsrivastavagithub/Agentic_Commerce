from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CartProductInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    price: float
    thumbnail: str
    stock: int


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cart_id: int
    product_id: int
    quantity: int
    product: CartProductInfo


class CartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    items: list[CartItemResponse] = []
    total: float = 0
    created_at: datetime
    updated_at: datetime
