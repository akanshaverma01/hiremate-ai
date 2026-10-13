import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import { getPasswordStrength } from "../utils/passwordStrength.js";
import "./AuthLayout.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not reset your password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hm-login-page">
      <div className="hm-auth-shell">
        <div className="hm-login-hero">
          <div className="hm-hero-shape hm-hero-shape-1" aria-hidden="true" />
          <div className="hm-hero-shape hm-hero-shape-2" aria-hidden="true" />

          <div className="hm-hero-content">
            <h1 className="hm-hero-title">HireMate AI</h1>
            <p className="hm-hero-tagline">Your AI-Powered Resume &amp; Interview Assistant</p>
            <p className="hm-hero-description">
              Analyze your resume, improve your ATS score, generate AI resume feedback, create cover letters,
              practice AI mock interviews, and get a personalized skill-gap roadmap — all in one platform.
            </p>

            <div className="hm-feature-cards">
              <div className="hm-feature-card">
                <span className="hm-feature-icon">📄</span>
                <span>ATS Resume Analysis</span>
              </div>
              <div className="hm-feature-card">
                <span className="hm-feature-icon">🤖</span>
                <span>AI Resume Copilot</span>
              </div>
              <div className="hm-feature-card">
                <span className="hm-feature-icon">🎤</span>
                <span>Mock Interview + Skill Gap Roadmap</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hm-login-panel">
          <form className="hm-login-card" onSubmit={handleSubmit}>
            <h2 className="hm-card-heading">Set a New Password</h2>
            <p className="hm-card-subtitle">Choose a new password for your account.</p>

            {error && (
              <div className="hm-alert hm-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="hm-alert hm-alert-success">
                <CheckCircle2 size={16} />
                <span>Password reset! Redirecting you to login...</span>
              </div>
            )}

            {!success && (
              <>
                <label className="hm-field-label">New Password</label>
                <div className="hm-input-wrap">
                  <span className="hm-input-icon"><Lock size={18} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="hm-input hm-input-with-toggle"
                  />
                  <button type="button" className="hm-eye-toggle" tabIndex={-1}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {password && (
                  <div className="hm-strength">
                    <div className="hm-strength-track">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`hm-strength-bar ${
                            strength.score >= i
                              ? strength.label === "Weak" ? "hm-strength-active-weak"
                              : strength.label === "Medium" ? "hm-strength-active-medium"
                              : "hm-strength-active-strong"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`hm-strength-label ${strength.label.toLowerCase()}`}>{strength.label}</span>
                  </div>
                )}

                <label className="hm-field-label">Confirm New Password</label>
                <div className="hm-input-wrap">
                  <span className="hm-input-icon"><Lock size={18} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="hm-input"
                  />
                </div>

                <button className="hm-login-btn" type="submit" disabled={loading}>
                  {loading && <span className="hm-btn-spinner" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}

            <p className="hm-signup-row">
              <Link to="/login" className="hm-signup-link">Back to Login</Link>
            </p>
          </form>
        </div>
      </div>

      <p className="hm-footer-text">Built for students and freshers to crack tech jobs with AI.</p>
    </div>
  );
}