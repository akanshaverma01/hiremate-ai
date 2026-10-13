import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import AppShell from "./layouts/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UploadResume from "./pages/UploadResume.jsx";
import AnalysisResult from "./pages/AnalysisResult.jsx";
import RecruiterFeedback from "./pages/RecruiterFeedback.jsx";
import ResumeCopilot from "./pages/ResumeCopilot.jsx";
import CoverLetter from "./pages/CoverLetter.jsx";
import InterviewPrep from "./pages/InterviewPrep.jsx";
import SkillGapAnalyzer from "./pages/SkillGapAnalyzer.jsx";
import MockInterview from "./pages/interview/MockInterview.jsx";
import InterviewReport from "./pages/interview/InterviewReport.jsx";
import History from "./pages/History.jsx";
import Profile from "./pages/Profile.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  const routes = (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
      <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisResult /></ProtectedRoute>} />
      <Route path="/analysis/:id/recruiter-feedback" element={<ProtectedRoute><RecruiterFeedback /></ProtectedRoute>} />
      <Route path="/copilot" element={<ProtectedRoute><ResumeCopilot /></ProtectedRoute>} />
      <Route path="/copilot/:analysisId" element={<ProtectedRoute><ResumeCopilot /></ProtectedRoute>} />
      <Route path="/analysis/:id/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
      <Route path="/analysis/:id/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
      <Route path="/analysis/:id/skill-gap" element={<ProtectedRoute><SkillGapAnalyzer /></ProtectedRoute>} />
      <Route path="/interview/mock" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
      <Route path="/interview/report/:sessionId" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Logged-in pages get the sidebar+topbar shell; auth pages (Login, Signup,
  // Forgot/Reset Password) render on their own full-bleed purple layout with
  // no shell around them, same as before this change.
  return user ? <AppShell>{routes}</AppShell> : <div className="app-shell">{routes}</div>;
}
