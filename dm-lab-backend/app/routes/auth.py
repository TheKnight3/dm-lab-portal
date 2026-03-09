"""
Authentication endpoints.

Users can register, log in and retrieve their profile. The JWT issued on
successful login must be included in the `Authorization` header for subsequent
requests (e.g. `Authorization: Bearer <token>`).
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import User, Role
from ..schemas import UserRegisterSchema, UserLoginSchema, UserSchema


auth_bp = Blueprint("auth", __name__)

register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()
user_schema = UserSchema()


@auth_bp.post("/register")
def register():
    """Register a new user and return a JWT."""
    json_data = request.get_json() or {}
    errors = register_schema.validate(json_data)
    if errors:
        return {"errors": errors}, 400

    name = json_data["name"].strip()
    email = json_data["email"].lower()
    password = json_data["password"]

    if User.query.filter_by(email=email).first():
        return {"message": "Email already registered"}, 400

    user = User(name=name, email=email, role=Role.USER)
    user.set_password(password)
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"message": "Email already registered"}, 400

    # Identity must be a string per JWT spec; cast the user id to str
    token = create_access_token(identity=str(user.id))
    return {"token": token, "user": user_schema.dump(user)}, 201


@auth_bp.post("/login")
def login():
    """Authenticate a user and return a JWT."""
    json_data = request.get_json() or {}
    errors = login_schema.validate(json_data)
    if errors:
        return {"errors": errors}, 400

    email = json_data["email"].lower()
    password = json_data["password"]
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"message": "Invalid email or password"}, 401

    # Identity must be a string per JWT spec; cast the user id to str
    token = create_access_token(identity=str(user.id))
    return {"token": token, "user": user_schema.dump(user)}, 200


@auth_bp.get("/me")
@jwt_required()
def me():
    """Return the authenticated user."""
    # get_jwt_identity returns the identity as string; cast to int
    user_id_str = get_jwt_identity()
    try:
        user_id = int(user_id_str)
    except (TypeError, ValueError):
        return {"message": "Invalid token"}, 401
    user = User.query.get(user_id)
    if not user:
        return {"message": "User not found"}, 404
    return user_schema.dump(user), 200