"""
Marshmallow schemas used for serialising and validating API payloads.

Separate schemas are defined for input (requests) and output (responses) to
avoid inadvertently exposing sensitive fields such as password hashes.
"""

from datetime import datetime
from marshmallow import Schema, fields, validate, validates, ValidationError
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field
from .models import (
    User,
    Service,
    Booking,
    Payment,
    Report,
    BookingStatus,
    Role,
    Location,
    Doctor,
    Availability,
)


class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ("password_hash",)

    # Ensure role is serialised as its string value rather than the enum
    role = fields.Method("_get_role")

    def _get_role(self, obj: User) -> str:
        return obj.role.value


class UserRegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=6))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class ServiceSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Service
        load_instance = True


class BookingCreateSchema(Schema):
    service_id = fields.Integer(required=True)
    doctor_id = fields.Integer(required=True)
    scheduled_at = fields.DateTime(required=True)
    notes = fields.String(required=False)


class BookingSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Booking
        include_fk = True
        include_relationships = True
        load_instance = True

    # Limit nested user and service fields to prevent exposing unnecessary relationships
    user = fields.Nested(UserSchema, only=("id", "name", "email", "role"))
    service = fields.Nested(ServiceSchema, only=("id", "name", "description", "price"))
    doctor = fields.Nested(lambda: DoctorSchema(only=("id", "name", "specialty", "location")), allow_none=True)
    status = fields.Method("_get_status")

    def _get_status(self, obj: Booking) -> str:
        return obj.status.value


class BookingUpdateSchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf([s.value for s in BookingStatus]))


class ReportSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Report
        include_fk = True
        load_instance = True

    booking = fields.Nested(BookingSchema, only=("id", "scheduled_at", "status", "service"))


class FinanceResponseItemSchema(Schema):
    period = fields.String()
    total_amount = fields.Float()

# New schemas for locations, doctors and availabilities

class LocationSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Location  # type: ignore[name-defined]
        load_instance = True

    id = auto_field()
    name = auto_field()
    address = auto_field()


class DoctorSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Doctor  # type: ignore[name-defined]
        load_instance = True

    id = auto_field()
    name = auto_field()
    specialty = auto_field()
    location = fields.Nested(LocationSchema, only=("id", "name", "address"))


class AvailabilitySchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Availability  # type: ignore[name-defined]
        load_instance = True

    id = auto_field()
    doctor = fields.Nested(DoctorSchema, only=("id", "name"))
    service = fields.Nested(ServiceSchema, only=("id", "name"))
    available_at = auto_field()