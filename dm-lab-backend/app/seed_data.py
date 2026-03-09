"""
Seed data generator.

This module defines a function that inserts a handful of records into the
database so that the application is usable immediately after deployment.
User credentials are sourced from environment variables, and dummy services,
bookings, payments and reports are created across a range of dates.
"""

import os
from datetime import datetime, timedelta
from random import randint

from .extensions import db
from .models import (
    User,
    Service,
    Booking,
    Payment,
    Report,
    Role,
    BookingStatus,
    Location,
    Doctor,
    Availability,
)


def seed_db() -> None:
    """Populate the database with dummy data if it is empty."""
    # If there are already users, assume data has been seeded
    if User.query.first():
        return

    # Create users
    admin_email = os.getenv("ADMIN_EMAIL", "admin@dmlab.it")
    admin_password = os.getenv("ADMIN_PASSWORD", "adminpass")
    user1_email = os.getenv("USER1_EMAIL", "alice@dmlab.it")
    user1_password = os.getenv("USER1_PASSWORD", "password")
    user2_email = os.getenv("USER2_EMAIL", "bob@dmlab.it")
    user2_password = os.getenv("USER2_PASSWORD", "password")

    admin = User(name="Administrator", email=admin_email, role=Role.ADMIN)
    admin.set_password(admin_password)
    user1 = User(name="Alice", email=user1_email, role=Role.USER)
    user1.set_password(user1_password)
    user2 = User(name="Bob", email=user2_email, role=Role.USER)
    user2.set_password(user2_password)

    db.session.add_all([admin, user1, user2])
    db.session.commit()

    # Create services
    services_data = [
        ("Visita Cardiologica", "Consulenza specialistica con cardiologo", 120.0),
        ("Analisi del Sangue", "Esame completo del sangue", 40.0),
        ("Ecografia Addome", "Esame ecografico dell'addome", 90.0),
        ("Risonanza Magnetica", "Risonanza magnetica nucleare", 300.0),
        ("Visita Dermatologica", "Controllo dermatologico completo", 80.0),
        ("Checkup Prevenzione", "Pacchetto di screening generali", 150.0),
        ("Mammografia", "Esame di screening per il seno", 100.0),
        ("Elettrocardiogramma", "Registrazione dell'attività elettrica del cuore", 35.0),
        ("Vaccinazione", "Somministrazione vaccini stagionali", 25.0),
    ]
    services = []
    for name, desc, price in services_data:
        svc = Service(name=name, description=desc, price=price)
        services.append(svc)
        db.session.add(svc)
    db.session.commit()

    # Create locations
    locations_data = [
        ("Laboratorio Infernetto", "Via Canale della Lingua 20/24, Roma"),
        ("Centro Ostia", "Piazza della Stazione Vecchia 20, Ostia Lido"),
        ("Laboratorio Eur", "Viale Europa 101, Roma"),
    ]
    locations: list[Location] = []
    for name, address in locations_data:
        loc = Location(name=name, address=address)
        locations.append(loc)
        db.session.add(loc)
    db.session.commit()

    # Create doctors (assign to locations)
    doctors_data = [
        ("Dr. Giulia Rossi", "Cardiologia", 0),
        ("Dr. Marco Bianchi", "Radiologia", 1),
        ("Dr. Sara Verdi", "Dermatologia", 2),
        ("Dr. Luca Neri", "Medicina Generale", 0),
    ]
    doctors: list[Doctor] = []
    for name, spec, loc_idx in doctors_data:
        doc = Doctor(name=name, specialty=spec, location=locations[loc_idx])
        doctors.append(doc)
        db.session.add(doc)
    db.session.commit()

    # Create availabilities for each doctor-service pair (next 7 days at 9am, 11am, 14pm)
    availabilities: list[Availability] = []
    now = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)
    for doc in doctors:
        # Each doctor offers all services for simplicity
        for svc in services:
            for day_offset in range(1, 8):  # next 7 days
                for hour in [9, 11, 14]:
                    slot_time = (now + timedelta(days=day_offset)).replace(hour=hour)
                    avail = Availability(doctor=doc, service=svc, available_at=slot_time)
                    availabilities.append(avail)
                    db.session.add(avail)
    db.session.commit()

    # Helper to pick random service and user
    def random_service() -> Service:
        return services[randint(0, len(services) - 1)]

    def random_user() -> User:
        return [user1, user2][randint(0, 1)]

    # Create bookings across different dates
    now = datetime.utcnow()
    for i in range(15):
        svc = random_service()
        user = random_user()
        days_offset = randint(-20, 10)  # some past and some future bookings
        scheduled_at = now + timedelta(days=days_offset)
        # Determine status: completed if in the past, else booked
        status = BookingStatus.COMPLETED if scheduled_at < now else BookingStatus.BOOKED
        # Pick a random doctor who offers the service
        doc = doctors[randint(0, len(doctors) - 1)]
        booking = Booking(
            user=user,
            service=svc,
            doctor=doc,
            scheduled_at=scheduled_at,
            status=status,
            notes=f"Prenotazione {i+1}"
        )
        db.session.add(booking)
        # Create a payment only for completed bookings
        if status == BookingStatus.COMPLETED:
            payment = Payment(booking=booking, amount=svc.price, paid_at=scheduled_at)
            db.session.add(payment)
            # Also create a report for completed bookings
            report = Report(
                booking=booking,
                filename=f"report_{booking.id}.pdf",
                file_path=f"report_{booking.id}.pdf",
                uploaded_at=scheduled_at + timedelta(days=1)
            )
            db.session.add(report)
    db.session.commit()