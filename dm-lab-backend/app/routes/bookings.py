"""
Booking endpoints.

Users can create and view their own bookings, while administrators can view
bookings of the current day and update their status. A simple role
requirement decorator is implemented locally to avoid code repetition.
"""

from datetime import datetime, date
from functools import wraps
from typing import Callable, TypeVar, Optional

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import (
    User,
    Service,
    Booking,
    Payment,
    Report,
    BookingStatus,
    Role,
    Doctor,
    Availability,
)
from ..schemas import (
    BookingCreateSchema,
    BookingSchema,
    BookingUpdateSchema,
    ServiceSchema,
)


bookings_bp = Blueprint("bookings", __name__)
create_schema = BookingCreateSchema()
booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)
update_schema = BookingUpdateSchema()

# -----------------------------------------------------------------------------
# User-facing endpoints for modifying and cancelling bookings
# -----------------------------------------------------------------------------

@bookings_bp.delete("/bookings/<int:booking_id>")
@jwt_required()
def cancel_booking(booking_id: int):
    """Allow an authenticated user to cancel their own booking.

    Cancelling a booking sets its status to ``CANCELLED`` and removes any
    associated payment. Users may only cancel bookings they own. If the
    booking has already been completed it cannot be cancelled.
    """
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != user_id:
        return {"message": "Forbidden"}, 403
    # Do not allow cancelling completed bookings
    if booking.status == BookingStatus.COMPLETED:
        return {"message": "Completed bookings cannot be cancelled"}, 400
    booking.status = BookingStatus.CANCELLED
    # Remove payment if exists
    if booking.payment:
        db.session.delete(booking.payment)
    db.session.commit()
    return booking_schema.dump(booking), 200


@bookings_bp.patch("/bookings/<int:booking_id>")
@jwt_required()
def update_booking_user(booking_id: int):
    """Allow an authenticated user to modify their own booking.

    Users may update the scheduled time, notes, service and doctor of a
    booking as long as the booking is not completed or cancelled. The
    selected doctor must provide the chosen service. This endpoint does
    not allow changing the status directly; users wishing to cancel a
    booking should call ``DELETE /bookings/<id>`` instead.
    """
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    booking = Booking.query.get_or_404(booking_id)
    if booking.user_id != user_id:
        return {"message": "Forbidden"}, 403
    # Cannot modify completed or cancelled bookings
    if booking.status in {BookingStatus.COMPLETED, BookingStatus.CANCELLED}:
        return {"message": "Cannot modify a completed or cancelled booking"}, 400
    data = request.get_json() or {}
    # Update service if provided
    if "service_id" in data:
        service = Service.query.get(data["service_id"])
        if not service:
            return {"errors": {"service_id": ["Service not found"]}}, 400
        booking.service = service
    # Update doctor if provided
    if "doctor_id" in data:
        doctor = Doctor.query.get(data["doctor_id"])
        if not doctor:
            return {"errors": {"doctor_id": ["Doctor not found"]}}, 400
        # Ensure doctor offers selected or current service
        service_id = data.get("service_id", booking.service.id)
        if not any(av.service_id == service_id for av in doctor.availabilities):
            return {"errors": {"doctor_id": ["Selected doctor is not available for the chosen service"]}}, 400
        booking.doctor = doctor
    # Update scheduled time if provided
    if "scheduled_at" in data:
        try:
            new_datetime = datetime.fromisoformat(data["scheduled_at"])
        except (ValueError, TypeError):
            return {"errors": {"scheduled_at": ["Invalid datetime format"]}}, 400
        booking.scheduled_at = new_datetime
    # Update notes if provided
    if "notes" in data:
        booking.notes = data["notes"]
    db.session.commit()
    return booking_schema.dump(booking), 200


F = TypeVar("F", bound=Callable)


def role_required(required_role: Role) -> Callable[[F], F]:
    """Decorator to restrict access to users with a given role."""

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args, **kwargs):  # type: ignore[misc]
            # get_jwt_identity returns a string; cast to int for DB lookup
            user_id_str = get_jwt_identity()
            try:
                user_id_int = int(user_id_str)
            except (TypeError, ValueError):
                return {"message": "Invalid token"}, 401
            user = User.query.get(user_id_int)
            if not user or user.role != required_role:
                return {"message": "Forbidden"}, 403
            return func(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorator


@bookings_bp.post("/bookings")
@jwt_required()
def create_booking():
    """Create a booking for the authenticated user.

    When a booking is initially created its status is set to ``BOOKED`` and
    no payment is recorded. Payments are recorded only when a booking is
    marked as ``COMPLETED`` by an administrator.
    """
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get_or_404(user_id)

    data = request.get_json() or {}
    errors = create_schema.validate(data)
    if errors:
        return {"errors": errors}, 400

    service = Service.query.get_or_404(data["service_id"])
    doctor = Doctor.query.get_or_404(data["doctor_id"])
    # Ensure the selected doctor provides the chosen service.
    if not any(av.service_id == service.id for av in doctor.availabilities):
        return {"message": "Selected doctor is not available for the chosen service"}, 400
    # Parse scheduled_at from ISO string
    try:
        scheduled_at = datetime.fromisoformat(data["scheduled_at"])
    except (ValueError, TypeError):
        return {"message": "Invalid scheduled_at datetime format"}, 400

    booking = Booking(
        user=user,
        service=service,
        doctor=doctor,
        scheduled_at=scheduled_at,
        status=BookingStatus.BOOKED,
        notes=data.get("notes"),
    )
    db.session.add(booking)
    db.session.commit()
    return booking_schema.dump(booking), 201


@bookings_bp.get("/bookings/me")
@jwt_required()
def list_my_bookings():
    """List bookings belonging to the authenticated user."""
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.scheduled_at.desc()).all()
    return bookings_schema.dump(bookings), 200


@bookings_bp.get("/admin/bookings")
@jwt_required()
@role_required(Role.ADMIN)
def list_bookings_admin():
    """List bookings for administrators with optional filters.

    Administrators can query bookings across arbitrary date ranges using
    ``start`` and ``end`` query parameters in ``YYYY-MM-DD`` format. If
    no range is provided, all bookings are returned. Additional filters
    include ``status`` (BOOKED, CONFIRMED, COMPLETED, CANCELLED), ``email``
    (user email substring match) and ``service`` (service name substring
    match). Results are sorted by scheduled time ascending.
    """
    # Date range filtering
    query = Booking.query
    start_str = request.args.get("start")
    end_str = request.args.get("end")
    try:
        if start_str:
            start_date = datetime.fromisoformat(start_str).date()
            query = query.filter(db.func.date(Booking.scheduled_at) >= start_date)
        if end_str:
            end_date = datetime.fromisoformat(end_str).date()
            query = query.filter(db.func.date(Booking.scheduled_at) <= end_date)
    except ValueError:
        return {"errors": {"date": ["Invalid start or end date format; expected YYYY-MM-DD"]}}, 400

    # Filter by status
    status = request.args.get("status")
    if status and status in [s.value for s in BookingStatus]:
        query = query.filter(Booking.status == BookingStatus(status))

    # Filter by user email
    email = request.args.get("email")
    if email:
        query = query.join(User).filter(User.email.ilike(f"%{email}%"))

    # Filter by service name
    service_name = request.args.get("service")
    if service_name:
        query = query.join(Service).filter(Service.name.ilike(f"%{service_name}%"))

    bookings = query.order_by(Booking.scheduled_at.asc()).all()
    return bookings_schema.dump(bookings), 200


@bookings_bp.patch("/admin/bookings/<int:booking_id>")
@jwt_required()
@role_required(Role.ADMIN)
def update_booking_admin(booking_id: int):
    """Update a booking's details or status (admin only).

    This endpoint allows administrators to modify the service, doctor,
    scheduled time and notes of an existing booking as well as update
    its status. When the status is changed to ``COMPLETED`` a payment
    record will be created if none exists. Conversely, if the status
    is changed to ``CANCELLED`` any existing payment will be removed.
    """
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json() or {}
    # Validate status if provided
    status_value = data.get("status")
    if status_value is not None:
        try:
            new_status = BookingStatus(status_value)
        except ValueError:
            return {"errors": {"status": ["Invalid status"]}}, 400
    else:
        new_status = None

    # Update core fields if provided
    service_id = data.get("service_id")
    if service_id is not None:
        service = Service.query.get(service_id)
        if not service:
            return {"errors": {"service_id": ["Service not found"]}}, 400
        booking.service = service
    doctor_id = data.get("doctor_id")
    if doctor_id is not None:
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return {"errors": {"doctor_id": ["Doctor not found"]}}, 400
        # Ensure doctor offers the booking's service
        if booking.service and not any(av.service_id == booking.service.id for av in doctor.availabilities):
            return {"errors": {"doctor_id": ["Selected doctor is not available for the chosen service"]}}, 400
        booking.doctor = doctor
    scheduled_at = data.get("scheduled_at")
    if scheduled_at is not None:
        try:
            new_datetime = datetime.fromisoformat(scheduled_at)
        except (ValueError, TypeError):
            return {"errors": {"scheduled_at": ["Invalid datetime format"]}}, 400
        booking.scheduled_at = new_datetime
    if "notes" in data:
        booking.notes = data["notes"]

    # Handle status change
    if new_status is not None:
        booking.status = new_status
        if new_status == BookingStatus.COMPLETED:
            # Create payment if it does not exist
            if booking.payment is None:
                payment = Payment(booking=booking, amount=booking.service.price)
                db.session.add(payment)
            # If report is not yet uploaded by admin, create placeholder (so user sees it)
            if booking.report is None:
                filename = f"report_{booking.id}.pdf"
                report = Report(
                    booking=booking,
                    filename=filename,
                    file_path=filename,
                )
                db.session.add(report)
        elif new_status == BookingStatus.CANCELLED:
            # Remove payment if booking is cancelled
            if booking.payment:
                db.session.delete(booking.payment)
        # For other statuses (BOOKED, CONFIRMED), no payment change

    db.session.commit()
    return booking_schema.dump(booking), 200