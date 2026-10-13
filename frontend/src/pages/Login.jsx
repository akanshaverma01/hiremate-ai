import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, BarChart3, UserCheck2, FileText, Mic, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthHeroIllustration from "../components/illustrations/AuthHeroIllustration.jsx";
import { GoogleIcon } from "../components/illustrations/Illustrations.jsx";
import "./AuthLayout.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // UI-only, no functional/auth impact

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
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
            Get instant ATS scores, AI-powered feedback, personalized cover letters and
            interview prep - all in one place.
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

        {/* ---------- Right: login form ---------- */}
        <div className="hm-login-panel hm-panel-split">
          <form className="hm-login-card" onSubmit={handleSubmit}>
            <h2 className="hm-card-heading">Welcome Back 👋</h2>
            <p className="hm-card-subtitle">Sign in to continue your career journey</p>

            {error && (
              <div className="hm-alert hm-alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <label className="hm-field-label">Email Address</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><Mail size={18} /></span>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="hm-input"
              />
            </div>

            <label className="hm-field-label">Password</label>
            <div className="hm-input-wrap">
              <span className="hm-input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="hm-input hm-input-with-toggle"
              />
              <button
                type="button"
                className="hm-eye-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="hm-forgot-row">
              <Link to="/forgot-password" className="hm-forgot-link">Forgot password?</Link>
            </div>

            <button className="hm-login-btn" type="submit" disabled={loading}>
              {loading && <span className="hm-btn-spinner" />}
              <span>{loading ? "Logging in..." : "Log In"}</span>
              {!loading && <ArrowUpRight size={16} style={{ transform: "rotate(45deg)" }} />}
            </button>

            <div className="hm-divider">OR</div>
            <button
              type="button"
              className="hm-google-btn"
              disabled
              title="Google sign-in isn't connected yet - UI preview only"
            >
              <GoogleIcon className="w-4 h-4" /> Continue with Google
            </button>

            <p className="hm-signup-row">
              Don't have an account? <Link to="/signup" className="hm-signup-link">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
