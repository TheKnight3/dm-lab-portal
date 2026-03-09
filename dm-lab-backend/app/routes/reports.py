"""
Report endpoints.

Users can list their own reports and download individual report files. The
download endpoint verifies that the requesting user owns the report or is an
administrator. Files are served from a dedicated ``reports`` folder in the
backend project.
"""

import os
from datetime import datetime
from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import User, Role, Report, Booking
from ..schemas import ReportSchema
from werkzeug.utils import secure_filename

# Directory where uploaded reports are stored (relative to this file)
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")


reports_bp = Blueprint("reports", __name__)
report_schema = ReportSchema()
reports_schema = ReportSchema(many=True)


@reports_bp.get("/reports/me")
@jwt_required()
def list_my_reports():
    """Return all reports belonging to the authenticated user."""
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    reports = (
        Report.query
        .join(Booking)
        .filter(Booking.user_id == user_id)
        .order_by(Report.uploaded_at.desc())
        .all()
    )
    return reports_schema.dump(reports), 200


@reports_bp.get("/reports/<int:report_id>/download")
@jwt_required()
def download_report(report_id: int):
    """Allow a user or admin to download a specific report."""
    report = Report.query.get_or_404(report_id)
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get(user_id)
    # Permission check
    if not user:
        return {"message": "User not found"}, 404
    if user.role != Role.ADMIN and report.booking.user_id != user_id:
        return {"message": "Forbidden"}, 403

    # The actual files are stored under backend/app/reports.
    reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports")
    file_path = os.path.join(reports_dir, report.file_path)
    # If the report file does not exist, fall back to a placeholder PDF
    if not os.path.isfile(file_path):
        file_path = os.path.join(reports_dir, "report_placeholder.pdf")
    directory = os.path.dirname(file_path)
    filename = os.path.basename(file_path)
    return send_from_directory(directory=directory, path=filename, as_attachment=True)


# -----------------------------------------------------------------------------
# Admin and user endpoints for uploading and updating reports
# -----------------------------------------------------------------------------

@reports_bp.post("/admin/reports/<int:booking_id>")
@jwt_required()
def upload_report_admin(booking_id: int):
    """Upload or replace a report file for a booking (admin only).

    Administrators can upload a PDF report for a given booking. If a
    report already exists for the booking its file will be replaced.
    """
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get(user_id)
    if not user or user.role != Role.ADMIN:
        return {"message": "Forbidden"}, 403
    booking = Booking.query.get_or_404(booking_id)
    # Expect a file named 'file' in form-data
    file = request.files.get("file")
    if not file:
        return {"errors": {"file": ["No file uploaded"]}}, 400
    filename = secure_filename(file.filename or "report.pdf")
    if not filename.lower().endswith(".pdf"):
        return {"errors": {"file": ["Report must be a PDF file"]}}, 400
    # Ensure reports directory exists
    os.makedirs(REPORTS_DIR, exist_ok=True)
    # Determine a unique file path (prefix with booking id and timestamp)
    unique_name = f"report_{booking.id}_{int(datetime.utcnow().timestamp())}.pdf"
    file_path = os.path.join(REPORTS_DIR, unique_name)
    file.save(file_path)
    # Remove old file if exists
    if booking.report and booking.report.file_path:
        old_path = os.path.join(REPORTS_DIR, booking.report.file_path)
        try:
            if os.path.exists(old_path):
                os.remove(old_path)
        except OSError:
            pass
        report = booking.report
        report.filename = filename
        report.file_path = unique_name
        report.uploaded_at = datetime.utcnow()
    else:
        report = Report(
            booking=booking,
            filename=filename,
            file_path=unique_name,
        )
        db.session.add(report)
    db.session.commit()
    return report_schema.dump(report), 201


@reports_bp.put("/reports/<int:report_id>")
@jwt_required()
def update_report(report_id: int):
    """Replace an existing report file.

    Users can update their own report and administrators can update any
    report. The same rules as uploading apply: a PDF file must be
    provided under the ``file`` form field. Existing files will be
    removed.
    """
    report = Report.query.get_or_404(report_id)
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get(user_id)
    if not user:
        return {"message": "User not found"}, 404
    # Check permissions: admin or owner of booking
    if user.role != Role.ADMIN and report.booking.user_id != user_id:
        return {"message": "Forbidden"}, 403
    file = request.files.get("file")
    if not file:
        return {"errors": {"file": ["No file uploaded"]}}, 400
    filename = secure_filename(file.filename or "report.pdf")
    if not filename.lower().endswith(".pdf"):
        return {"errors": {"file": ["Report must be a PDF file"]}}, 400
    # Unique name
    unique_name = f"report_{report.booking.id}_{int(datetime.utcnow().timestamp())}.pdf"
    # Save file
    os.makedirs(REPORTS_DIR, exist_ok=True)
    file_path = os.path.join(REPORTS_DIR, unique_name)
    file.save(file_path)
    # Delete old file
    old_path = os.path.join(REPORTS_DIR, report.file_path)
    try:
        if os.path.exists(old_path):
            os.remove(old_path)
    except OSError:
        pass
    report.filename = filename
    report.file_path = unique_name
    report.uploaded_at = datetime.utcnow()
    db.session.commit()
    return report_schema.dump(report), 200