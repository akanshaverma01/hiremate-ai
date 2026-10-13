import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import "./AuthLayout.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      // Note: the backend intentionally returns this same success message
      // whether or not the email is actually registered, to prevent account
      // enumeration - so this branch covers "request succeeded", not
      // "email exists."
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
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
            <h2 className="hm-card-heading">Forgot Password?</h2>
            <p className="hm-card-subtitle">Enter your email and we'll send you a reset link.</p>

            {error && (
              <div className="hm-alert hm-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="hm-alert hm-alert-success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {!success && (
              <>
                <label className="hm-field-label">Email</label>
                <div className="hm-input-wrap">
                  <span className="hm-input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="hm-input"
                  />
                </div>

                <button className="hm-login-btn" type="submit" disabled={loading}>
                  {loading && <span className="hm-btn-spinner" />}
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}

            <p className="hm-signup-row">
              <Link to="/login" className="hm-signup-link" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </p>
          </form>
        </div>
      </div>

      <p className="hm-footer-text">Built for students and freshers to crack tech jobs with AI.</p>
    </div>
  );
}