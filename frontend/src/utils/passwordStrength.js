// Simple client-side heuristic for the Weak/Medium/Strong indicator.
// This is purely cosmetic feedback - the actual password rule enforced by
// the backend is still just "at least 6 characters" (see auth_router.py).
// This does not replace or loosen that check.
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score++;

  if (score <= 1) return { score: 1, label: "Weak" };
  if (score <= 3) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
}