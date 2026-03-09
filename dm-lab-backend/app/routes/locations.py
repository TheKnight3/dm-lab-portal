"""
Location and doctor listing endpoints.

These endpoints allow the frontend to retrieve a list of clinic locations,
doctors filtered by location and service, and available appointment slots. All
endpoints under this module are read-only and do not require authentication.
"""

from flask import Blueprint, request

from ..models import Location, Doctor, Availability, Service
from ..schemas import LocationSchema, DoctorSchema, AvailabilitySchema


locations_bp = Blueprint("locations", __name__)

location_schema = LocationSchema()
locations_schema = LocationSchema(many=True)
doctor_schema = DoctorSchema()
doctors_schema = DoctorSchema(many=True)
availability_schema = AvailabilitySchema()
availabilities_schema = AvailabilitySchema(many=True)


@locations_bp.get("")
def list_locations():
    """Return all available locations."""
    locations = Location.query.all()
    return locations_schema.dump(locations), 200


@locations_bp.get("/doctors")
def list_doctors():
    """List doctors filtered by service and location.

    Query parameters:
    - service_id (int): optional, filter doctors that offer a given service via availability slots.
    - location_id (int): optional, filter doctors located at a specific location.
    
    If no filters are provided, all doctors are returned.
    """
    service_id = request.args.get("service_id", type=int)
    location_id = request.args.get("location_id", type=int)
    query = Doctor.query
    if location_id:
        query = query.filter_by(location_id=location_id)
    if service_id:
        # join availability to filter by service
        query = query.join(Availability).filter(Availability.service_id == service_id)
    doctors = query.all()
    return doctors_schema.dump(doctors), 200


@locations_bp.get("/availabilities")
def list_availabilities():
    """Return available time slots for a given doctor.

    Required query parameters:
    - doctor_id (int): ID of the doctor

    Returns a list of Availability resources ordered chronologically.
    """
    doctor_id = request.args.get("doctor_id", type=int)
    if not doctor_id:
        return {"message": "doctor_id is required"}, 400
    availabilities = (
        Availability.query.filter_by(doctor_id=doctor_id)
        .order_by(Availability.available_at.asc())
        .all()
    )
    return availabilities_schema.dump(availabilities), 200