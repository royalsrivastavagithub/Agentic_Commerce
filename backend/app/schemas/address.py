from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AddressBase(BaseModel):
    label: str = "Home"
    street: str
    city: str
    state: str
    pincode: str
    country: str = "India"
    is_default: bool = False
    address_type: str = "both"  # shipping, billing, both

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Pincode must be exactly 6 digits")
        return v


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None
    address_type: Optional[str] = None


class AddressResponse(AddressBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
