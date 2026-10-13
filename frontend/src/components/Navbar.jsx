import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">HireMate AI</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/upload">Upload Resume</Link>
        <Link to="/history">History</Link>
        <Link to="/copilot">✨ AI Resume Copilot</Link>
        <Link to="/interview/mock">🎙️ Mock Interview</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <div className="navbar-actions">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <span className="navbar-user">{user?.full_name}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
