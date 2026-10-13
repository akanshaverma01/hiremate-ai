import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import {
  User,
  Mail,
  Calendar,
  FileText,
  Trash2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResumes = () => {
    setLoading(true);
    api
      .get("/api/resumes/")
      .then((res) => setResumes(res.data))
      .catch(() => setError("Could not load your resumes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    try {
      await api.delete(`/api/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete resume.");
    }
  };

  // Extract initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account Profile
          </h1>
        </div>
        <p className="text-slate-500 text-sm">
          Manage your account credentials and uploaded resume documents.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-slide-up">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            {getInitials(user?.full_name)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{user?.full_name || "User"}</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-600" /> Full Name
            </span>
            <p className="text-sm font-bold text-slate-800">{user?.full_name || "—"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-violet-600" /> Email Address
            </span>
            <p className="text-sm font-bold text-slate-800">{user?.email || "—"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-600" /> Member Since
            </span>
            <p className="text-sm font-bold text-slate-800">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Resumes Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 animate-slide-up" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Uploaded Resumes
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            Total: {resumes.length}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading resumes..." />
        ) : resumes.length === 0 ? (
          <EmptyState
            title="No resumes uploaded yet"
            description="Upload your first resume to start analyzing it against job descriptions."
            ctaLabel="Upload a Resume"
            ctaTo="/upload"
            className="shadow-none border-dashed"
          />
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white text-violet-600 border border-slate-200/80 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                      {r.filename}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Uploaded on {new Date(r.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  title="Delete Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}