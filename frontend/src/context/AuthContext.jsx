import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ara_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("ara_token", res.data.access_token);
    localStorage.setItem("ara_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const signup = async (full_name, email, password) => {
    const res = await api.post("/api/auth/signup", { full_name, email, password });
    localStorage.setItem("ara_token", res.data.access_token);
    localStorage.setItem("ara_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("ara_token");
    localStorage.removeItem("ara_user");
    // Besides the auth keys, a couple of features cache small bits of
    // per-session state in localStorage for convenience (resuming an
    // in-progress mock interview, an unsaved mock-interview form draft).
    // Neither was being cleared on logout, so the NEXT person to log in on
    // the same browser could land back inside the PREVIOUS user's
    // in-progress interview. Clearing them here closes that gap.
    localStorage.removeItem("ara_mock_interview_session_id");
    localStorage.removeItem("mock_interview_form");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
