"""
FTS Store — Safe Administrator Account Creation CLI
Usage:
    python -m app.cli.create_admin --email admin@example.com --name "System Admin"
    (Will prompt securely for password without echoing)
"""
import argparse
import getpass
import re
import sys
import uuid

from app.db.session import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import hash_password

def validate_password_complexity(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")

def create_admin_user(email: str, full_name: str, password: str) -> bool:
    email = email.strip().lower()
    full_name = full_name.strip()

    validate_password_complexity(password)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role == UserRole.ADMIN:
                print(f"[!] Administrator account with email '{email}' already exists.")
                return False
            else:
                existing.role = UserRole.ADMIN
                existing.hashed_password = hash_password(password)
                existing.full_name = full_name
                db.commit()
                print(f"[OK] Existing account '{email}' promoted to Administrator.")
                return True

        hashed = hash_password(password)
        admin = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name,
            hashed_password=hashed,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print(f"[OK] Successfully created new Administrator account for '{email}'.")
        return True
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Create or promote an FTS Store administrator.")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--name", default="System Administrator", help="Administrator full name")
    parser.add_argument("--password", help="Administrator password (if omitted, prompts securely)")

    args = parser.parse_args()

    pwd = args.password
    if not pwd:
        pwd = getpass.getpass("Enter administrator password: ")
        confirm_pwd = getpass.getpass("Confirm administrator password: ")
        if pwd != confirm_pwd:
            print("[x] Error: Passwords do not match.", file=sys.stderr)
            sys.exit(1)

    try:
        success = create_admin_user(args.email, args.name, pwd)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"[x] Error creating administrator: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
