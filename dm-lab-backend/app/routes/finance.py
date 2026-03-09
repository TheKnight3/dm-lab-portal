"""
Finance endpoints for administrators.

Provides aggregated income over a given date range, grouped by day, week or
month. Only users with the ADMIN role may access this endpoint.
"""

from datetime import datetime, date
from collections import defaultdict
from typing import Dict, List

from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User, Payment, Booking, Role
from ..schemas import FinanceResponseItemSchema

finance_bp = Blueprint("finance", __name__)
finance_item_schema = FinanceResponseItemSchema(many=True)


def parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str).date()
    except ValueError:
        return None


def group_key(dt: datetime, period: str) -> str:
    if period == "daily":
        return dt.date().isoformat()
    if period == "weekly":
        # ISO week number
        year, week, _ = dt.isocalendar()
        return f"{year}-W{week:02d}"
    if period == "monthly":
        return dt.strftime("%Y-%m")
    return dt.date().isoformat()


@finance_bp.get("")
@jwt_required()
def get_finance():
    """Return aggregated revenue for admin users."""
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get(user_id)
    if not user or user.role != Role.ADMIN:
        return {"message": "Forbidden"}, 403

    period = request.args.get("period", "daily").lower()
    if period not in {"daily", "weekly", "monthly"}:
        return {"message": "Invalid period. Use daily, weekly or monthly."}, 400

    from_date = parse_date(request.args.get("from"))
    to_date = parse_date(request.args.get("to"))

    query = Payment.query.join(Booking)
    if from_date:
        query = query.filter(Payment.paid_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(Payment.paid_at <= datetime.combine(to_date, datetime.max.time()))

    payments = query.all()
    aggregated: Dict[str, float] = defaultdict(float)
    for payment in payments:
        key = group_key(payment.paid_at, period)
        aggregated[key] += payment.amount

    # Convert to list of dicts sorted by period key
    result = [
        {"period": k, "total_amount": v} for k, v in sorted(aggregated.items())
    ]
    return finance_item_schema.dump(result), 200