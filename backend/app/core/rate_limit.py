import time
from typing import Dict, List, Tuple
from fastapi import HTTPException, status

class LoginRateLimiter:
    """
    In-memory rate limiter and brute-force mitigation engine for login requests.
    Tracks failed attempts within a sliding time window.
    """
    def __init__(self, max_attempts: int = 5, window_seconds: int = 300, lockout_seconds: int = 300):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.lockout_seconds = lockout_seconds
        # Key -> list of timestamps
        self._attempts: Dict[str, List[float]] = {}
        # Key -> lockout expiry timestamp
        self._lockouts: Dict[str, float] = {}

    def _clean_old_attempts(self, key: str, now: float) -> None:
        if key in self._attempts:
            cutoff = now - self.window_seconds
            self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]
            if not self._attempts[key]:
                del self._attempts[key]

    def check_allowed(self, key: str) -> None:
        now = time.time()

        # Check if currently locked out
        if key in self._lockouts:
            remaining = self._lockouts[key] - now
            if remaining > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed login attempts. Account temporarily locked. Please try again in {int(remaining)} seconds.",
                    headers={"Retry-After": str(int(remaining))}
                )
            else:
                del self._lockouts[key]

        self._clean_old_attempts(key, now)

    def record_failure(self, key: str) -> None:
        now = time.time()
        self._clean_old_attempts(key, now)

        if key not in self._attempts:
            self._attempts[key] = []
        self._attempts[key].append(now)

        if len(self._attempts[key]) >= self.max_attempts:
            self._lockouts[key] = now + self.lockout_seconds
            self._attempts.pop(key, None)

    def record_success(self, key: str) -> None:
        self._attempts.pop(key, None)
        self._lockouts.pop(key, None)

    def reset(self) -> None:
        """Clear all rate limiting records (useful for testing)."""
        self._attempts.clear()
        self._lockouts.clear()

# Global singleton instance for authentication endpoints
login_limiter = LoginRateLimiter(max_attempts=5, window_seconds=300, lockout_seconds=300)
