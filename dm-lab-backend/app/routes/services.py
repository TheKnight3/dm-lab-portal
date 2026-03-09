"""
Service catalogue endpoints.

These endpoints expose the list of available healthcare services. They are
public and do not require authentication.
"""

from flask import Blueprint, jsonify

from ..models import Service
from ..schemas import ServiceSchema


services_bp = Blueprint("services", __name__)
service_schema = ServiceSchema()
services_schema = ServiceSchema(many=True)


@services_bp.get("")
def list_services():
    """Return all available services."""
    services = Service.query.all()
    return services_schema.dump(services), 200


@services_bp.get("/<int:service_id>")
def get_service(service_id: int):
    """Return a single service by ID."""
    service = Service.query.get_or_404(service_id)
    return service_schema.dump(service), 200