import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, BarChart3, UserCheck2, FileText, Mic, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getPasswordStrength } from "../utils/passwordStrength.js";
import AuthHeroIllustration from "../components/illustrations/AuthHeroIllustration.jsx";
import { GoogleIcon } from "../components/illustrations/Illustrations.jsx";
import "./AuthLayout.css";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Same rule the backend enforces (see auth_router.py) - this doesn't
    // loosen or replace that check, just gives earlier feedback.
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    // Confirm-password matching is client-side only - never sent to the API.
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(form.full_name, form.email, form.password);
      setSuccess(true);
      // Brief success state before the existing navigate("/") - the signup
      // call and destination are unchanged, this just gives visible
      // confirmation instead of an instant redirect.
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hm-login-page hm-auth-page-split">
      <div className="hm-auth-topbar">
        <div className="hm-auth-logo">
          <div className="hm-auth-logo-badge"><FileText size={17} /></div>
          <span className="hm-auth-logo-text">HireMate <span>AI</span></span>
        </div>
        <span className="hm-auth-nav-text">Smarter Resumes · Better Opportunities</span>
      </div>

      <div className="hm-auth-shell hm-auth-shell-split">
        {/* ---------- Left: marketing panel ---------- */}
        <div className="hm-login-hero hm-hero-split">
          <span className="hm-hero-badge"><Sparkles size={13} /> AI-Powered Resume Platform</span>

          <h1 className="hm-hero-heading">
            Turn Your Resume
            <span className="hm-accent">into Opportunities</span>
          </h1>
          <p className="hm-hero-desc">
            Create your free account and unlock instant ATS scores, AI-powered feedback,
            personalized cover letters and interview prep.
          </p>

          <div className="hm-hero-grid">
            <div className="hm-hero-grid-item">
              <div className="hm-hero-grid-icon"><BarChart3 size={17} /></div>
              <div>
                <p className="hm-hero-grid-title">ATS Resume Analysis</p>
                <p className="hm-hero-grid-sub">Know where you stand</p>
              </div>
            </div>
            <div className="hm-hero-grid-item">
              <div className="hm-hero-grid-icon"><UserCheck2 size={17} /></div>
              <div>
                <p className="hm-hero-grid-title">AI Recruiter Feedback</p>
                <p className="hm-hero-grid-sub">Get structured suggestions</p>
              </div>
            </div>
            <div className="hm-hero-grid-item">
              <div className="hm-hero-grid-icon"><FileText size={17} /></div>
              <div>
                <p className="hm-hero-grid-title">Cover Letter Generator</p>
                <p className="hm-hero-grid-sub">Stand out from the crowd</p>
              </div>
            </div>
            <div className="hm-hero-grid-item">
              <div className="hm-hero-grid-icon"><Mic size={17} /></div>
              <div>
                <p className="hm-hero-grid-title">Interview Prep &amp; Practice</p>
                <p className="hm-hero-grid-sub">Build confidence</p>
              </div>
            </div>
          </div>

          <div className="hm-hero-illustration-wrap">
            <AuthHeroIllustration />
          </div>

          <div className="hm-hero-avatars">
            <div className="hm-avatar-stack">
              <span style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>A</span>
              <span style={{ background: "linear-gradient(135deg,#6366f1,#818cf8)" }}>S</span>
              <span style={{ background: "linear-gradient(135deg,#ec4899,#f472b6)" }}>R</span>
            </div>
            <p className="hm-hero-avatars-text">
              <strong>Join 10,000+ job seekers</strong><br />
              who are building better careers with HireMate AI
            </p>
          </div>

          <p className="hm-hero-footnote">
            Your next job is just a step away <ArrowUpRight size={15} />
          </p>
        </div>

        {/* ---------- Right: signup form ---------- */}
        <div className="hm-login-panel hm-panel-split">
          <form className="hm-login-card" onSubmit={handleSubmit}>
            <h2 className="hm-card-heading">Create Account ✨</h2>
            <p className="hm-card-subtitle">Join HireMate AI and unlock personalized career guidance</p>

            {error && (
              <div className="hm-alert hm-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="hm-alert hm-alert-success">
                <CheckCircle2 size={16} />
                <span>Account created! Taking you to your dashboard...</span>
              </div>
            )}

            <label className="hm-field-label">Full Name</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><User size={18} /></span>
              <input
                type="text" name="full_name" required
                value={form.full_name} onChange={handleChange}
                placeholder="Jane Doe" className="hm-input"
              />
            </div>

            <label className="hm-field-label">Email Address</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><Mail size={18} /></span>
              <input
                type="email" name="email" required
                value={form.email} onChange={handleChange}
                placeholder="you@example.com" className="hm-input"
              />
            </div>

            <label className="hm-field-label">Password</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? "text" : "password"} name="password" required
                value={form.password} onChange={handleChange}
                placeholder="At least 6 characters" className="hm-input hm-input-with-toggle"
              />
              <button type="button" className="hm-eye-toggle" tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.password && (
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

            <label className="hm-field-label">Confirm Password</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><Lock size={18} /></span>
              <input
                type={showConfirm ? "text" : "password"} name="confirm_password" required
                value={form.confirm_password} onChange={handleChange}
                placeholder="Re-enter your password" className="hm-input hm-input-with-toggle"
              />
              <button type="button" className="hm-eye-toggle" tabIndex={-1}
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button className="hm-login-btn" type="submit" disabled={loading} style={{ marginTop: 6 }}>
              {loading && <span className="hm-btn-spinner" />}
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              {!loading && <ArrowUpRight size={16} style={{ transform: "rotate(45deg)" }} />}
            </button>

            <div className="hm-divider">OR</div>
            <button
              type="button"
              className="hm-google-btn"
              disabled
              title="Google sign-up isn't connected yet - UI preview only"
            >
              <GoogleIcon className="w-4 h-4" /> Continue with Google
            </button>

            <p className="hm-signup-row">
              Already have an account? <Link to="/login" className="hm-signup-link">Log In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
