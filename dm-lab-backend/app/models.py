"""
Database models for the DMlab application.

These SQLAlchemy models describe the core entities used by the system: users,
services, bookings, payments and reports. Relationships are defined to
simplify queries across tables.
"""

from __future__ import annotations

import enum
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
from .extensions import db


class Role(enum.Enum):
    """User roles."""

    USER = "USER"
    ADMIN = "ADMIN"


class BookingStatus(enum.Enum):
    """Possible states of a booking."""

    BOOKED = "BOOKED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(Role), default=Role.USER, nullable=False)

    bookings = db.relationship("Booking", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User {self.email}>"


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)

    bookings = db.relationship("Booking", back_populates="service")

    def __repr__(self) -> str:
        return f"<Service {self.name}>"


class Location(db.Model):
    """A clinic or laboratory location.

    Locations represent physical sites where services are provided. Each doctor
    is associated with exactly one location, and bookings can be filtered by
    location through the doctor relationship. Additional fields such as
    address or contact details can be added as needed.
    """

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)

    # One-to-many: a location has many doctors
    doctors = db.relationship("Doctor", back_populates="location", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Location {self.name}>"


class Doctor(db.Model):
    """Medical professionals providing services.

    Doctors belong to a specific location and may perform multiple types of
    services. Availability slots are stored separately and referenced via
    the ``Availability`` model.
    """

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    specialty = db.Column(db.String(120), nullable=True)
    location_id = db.Column(db.Integer, db.ForeignKey("location.id"), nullable=False)

    location = db.relationship("Location", back_populates="doctors")
    availabilities = db.relationship("Availability", back_populates="doctor", cascade="all, delete-orphan")
    bookings = db.relationship("Booking", back_populates="doctor", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Doctor {self.name} @ {self.location.name}>"


class Availability(db.Model):
    """Represents an available appointment slot for a doctor.

    Each availability ties a doctor to a specific service and datetime. The
    booking wizard queries these slots to allow users to choose an available
    appointment. Once a booking is made, the slot can be removed or marked
    as taken (not implemented here for simplicity). In a real system, you
    would also want to handle concurrency and slot reservation.
    """

    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("service.id"), nullable=False)
    available_at = db.Column(db.DateTime, nullable=False)

    doctor = db.relationship("Doctor", back_populates="availabilities")
    service = db.relationship("Service")

    def __repr__(self) -> str:
        return f"<Availability {self.service.name} with {self.doctor.name} on {self.available_at}>"


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("service.id"), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum(BookingStatus), default=BookingStatus.BOOKED, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship("User", back_populates="bookings")
    service = db.relationship("Service", back_populates="bookings")
    payment = db.relationship("Payment", back_populates="booking", uselist=False)
    report = db.relationship("Report", back_populates="booking", uselist=False)

    # New: reference to doctor. The location can be inferred via the doctor.
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)
    doctor = db.relationship("Doctor", back_populates="bookings")

    def __repr__(self) -> str:
        return f"<Booking {self.id} for user {self.user_id} on {self.scheduled_at}>"


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    paid_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship("Booking", back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment {self.id} amount {self.amount}>"


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), unique=True, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship("Booking", back_populates="report")

    def __repr__(self) -> str:
        return f"<Report {self.filename}>"