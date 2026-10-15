#!/usr/bin/env python3
"""
FTS Store — Secure Administrator Bootstrap Procedure
Automated bootstrap script for provisioning initial platform super-administrator.
Safe for container entrypoints, CI/CD release phases, and production provisioning.
"""

import sys
import os
import secrets
import string
import argparse

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.db.session import SessionLocal
from app.models.user import User
from app.models.enums import UserRole
from app.core.config import settings
from app.core.security import hash_password

def generate_secure_password(length: int = 18) -> str:
    """Generate cryptographically secure randomized password meeting all complexity rules."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password

def bootstrap_admin(email: str = None, password: str = None, force_reset: bool = False):
    target_email = email or os.getenv("INITIAL_ADMIN_EMAIL") or settings.INITIAL_ADMIN_EMAIL or "admin@frndstech.com"
    target_email = target_email.strip().lower()

    raw_password = password or os.getenv("INITIAL_ADMIN_PASSWORD") or settings.INITIAL_ADMIN_PASSWORD
    generated = False

    if not raw_password:
        raw_password = generate_secure_password()
        generated = True

    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == target_email).first()

        if admin_user:
            if force_reset:
                admin_user.hashed_password = hash_password(raw_password)
                admin_user.role = UserRole.ADMIN
                admin_user.is_active = True
                db.commit()
                print(f"[BOOTSTRAP] Administrator '{target_email}' password reset successfully.")
                if generated:
                    print(f"[SECURITY] Generated Password: {raw_password}")
                    print("[SECURITY] Store this credential in your secure password vault immediately!")
                else:
                    print("[SECURITY] Password updated from provided environment variable.")
            else:
                print(f"[BOOTSTRAP] Administrator '{target_email}' already exists. (Skipping, use --force to reset)")
        else:
            import uuid
            new_admin = User(
                id=str(uuid.uuid4()),
                email=target_email,
                hashed_password=hash_password(raw_password),
                full_name=os.getenv("INITIAL_ADMIN_NAME", "Platform Administrator"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print(f"[BOOTSTRAP] Successfully created initial super-administrator: {target_email}")
            if generated:
                print("=" * 60)
                print(f"[SECURITY CREDENTIAL CREATED]")
                print(f"Email:    {target_email}")
                print(f"Password: {raw_password}")
                print("=" * 60)
                print("[IMPORTANT] Store this password securely. It will not be shown again.")
            else:
                print(f"[SECURITY] Provisioned with pre-configured INITIAL_ADMIN_PASSWORD.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Administrator bootstrap failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="FTS Store Super-Admin Bootstrap")
    parser.add_argument("--email", type=str, help="Administrator email address")
    parser.add_argument("--password", type=str, help="Explicit administrator password")
    parser.add_argument("--force", action="store_true", help="Force reset password if admin already exists")
    args = parser.parse_args()

    bootstrap_admin(email=args.email, password=args.password, force_reset=args.force)
