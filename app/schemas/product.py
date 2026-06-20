from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DimensionSchema(BaseModel):
    width: float
    height: float
    depth: float


class ReviewSchema(BaseModel):
    rating: int
    comment: str
    date: str
    reviewerName: str
    reviewerEmail: str


class MetaSchema(BaseModel):
    createdAt: str
    updatedAt: str
    barcode: str
    qrCode: str


class ProductSchema(BaseModel):
    id: int
    title: str
    description: str
    category: str
    price: float
    discountPercentage: float
    rating: float
    stock: int
    tags: list[str]
    brand: Optional[str] = None
    sku: str
    weight: float
    dimensions: DimensionSchema
    warrantyInformation: str
    shippingInformation: str
    availabilityStatus: str
    reviews: list[ReviewSchema]
    returnPolicy: str
    minimumOrderQuantity: int
    meta: MetaSchema
    images: list[str]
    thumbnail: str


class ProductsResponse(BaseModel):
    products: list[ProductSchema]
    total: int
    skip: int
    limit: int
