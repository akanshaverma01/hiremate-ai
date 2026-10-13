"""
Password reset: token generation/verification and email delivery.

Security notes (worth understanding, not just copying):
- The raw token is only ever held in memory long enough to put it in the
  email/log line. The database stores only sha256(token) - if the DB leaks,
  the hashes alone can't be replayed to reset anyone's password (same
  principle as bcrypt-hashing login passwords, just with a fast hash since
  this token is already high-entropy random data, not a low-entropy
  human-chosen password).
- forgot_password() always returns the same generic outcome regardless of
  whether the email exists, is unregistered, or a token already exists for
  it. This intentionally prevents account enumeration - an attacker
  shouldn't be able to find out which emails have accounts on this platform
  by testing them against this endpoint. This is standard practice (Google,
  GitHub, etc. all do this), even though it means the API "always succeeds"
  from the outside.
"""
import hashlib
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.config import settings
from app import models

GENERIC_FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for that email, a password reset link has been sent."
)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _send_reset_email(to_email: str, reset_link: str):
    subject = "Reset your HireMate AI password"
    body = (
        f"Hi,\n\nSomeone requested a password reset for your HireMate AI account.\n"
        f"If this was you, click the link below to set a new password "
        f"(expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n"
    )

    if not settings.SMTP_HOST or not settings.SMTP_USER:
        # Placeholder path (spec explicitly allows this when SMTP isn't
        # configured): log the link server-side so local development/demos
        # can complete the flow without a real mail server.
        print(f"\n[password reset - SMTP not configured, logging instead of sending]\n"
              f"To: {to_email}\nSubject: {subject}\n{body}\n")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())


def forgot_password(db: Session, email: str) -> None:
    """
    Always completes "successfully" from the caller's perspective - see
    module docstring on why. Only does real work (generate token, send
    email) if the email actually belongs to a user.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return  # deliberately silent - see enumeration note above

    raw_token = secrets.token_urlsafe(32)
    token_row = models.PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(token_row)
    db.commit()

    reset_link = f"{settings.FRONTEND_ORIGIN}/reset-password?token={raw_token}"
    _send_reset_email(user.email, reset_link)


class ResetPasswordError(Exception):
    """Raised for any reset-password failure. Message is always safe to show the user."""


def reset_password(db: Session, raw_token: str, new_password_hash: str) -> None:
    token_hash = _hash_token(raw_token)
    token_row = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token_hash == token_hash)
        .first()
    )

    if not token_row:
        raise ResetPasswordError("This reset link is invalid.")
    if token_row.used:
        raise ResetPasswordError("This reset link has already been used. Please request a new one.")

    expires_at = token_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise ResetPasswordError("This reset link has expired. Please request a new one.")

    user = db.query(models.User).filter(models.User.id == token_row.user_id).first()
    if not user:
        raise ResetPasswordError("This reset link is invalid.")

    user.hashed_password = new_password_hash
    token_row.used = True
    db.commit()