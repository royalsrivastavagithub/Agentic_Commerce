from sqlalchemy import Column, Integer, String, Float, JSON
from app.db.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    discount_percentage = Column("discountPercentage", Float, nullable=False)
    rating = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    tags = Column(JSON, nullable=False)
    brand = Column(String, nullable=True)
    sku = Column(String, nullable=False)
    weight = Column(Float, nullable=False)
    dimensions = Column(JSON, nullable=False)
    warranty_information = Column("warrantyInformation", String, nullable=False)
    shipping_information = Column("shippingInformation", String, nullable=False)
    availability_status = Column("availabilityStatus", String, nullable=False)
    reviews = Column(JSON, nullable=False)
    return_policy = Column("returnPolicy", String, nullable=False)
    minimum_order_quantity = Column("minimumOrderQuantity", Integer, nullable=False)
    meta = Column(JSON, nullable=False)
    images = Column(JSON, nullable=False)
    thumbnail = Column(String, nullable=False)
