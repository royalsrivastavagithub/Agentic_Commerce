from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.admin import AdminOrdersResponse
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.get("", response_model=AdminOrdersResponse, summary="List all orders (newest first)")
def list_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return AdminOrdersResponse(orders=orders, total=total, skip=skip, limit=limit)


@router.patch("/{order_id}/status", response_model=OrderResponse, summary="Update order status")
def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    order.status = status_in.status
    db.commit()
    db.refresh(order)
    return order
