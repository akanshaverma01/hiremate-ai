import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { UploadIllustration } from "../components/illustrations/Illustrations.jsx";
import { 
  FileText, 
  Briefcase, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  PlusCircle,
  FolderCheck
} from "lucide-react";

export default function UploadResume() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeId, setResumeId] = useState(null);
  const [resumeName, setResumeName] = useState("");

  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [jdMode, setJdMode] = useState("existing"); // "existing" | "new"
  const [selectedJdId, setSelectedJdId] = useState("");
  const [newJdTitle, setNewJdTitle] = useState("");
  const [newJdText, setNewJdText] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/job-descriptions/").then((res) => {
      setJobDescriptions(res.data);
      if (res.data.length === 0) setJdMode("new");
    });
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResumeId(res.data.id);
      setResumeName(res.data.filename);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload resume. Try a different PDF/DOCX file.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError("");

    if (!resumeId) {
      setError("Upload a resume first.");
      return;
    }

    setAnalyzing(true);
    try {
      let jdId = selectedJdId;

      if (jdMode === "new") {
        if (!newJdTitle.trim() || !newJdText.trim()) {
          setError("Please provide a job title and description.");
          setAnalyzing(false);
          return;
        }
        const jdRes = await api.post("/api/job-descriptions/", {
          title: newJdTitle,
          description_text: newJdText,
        });
        jdId = jdRes.data.id;
      }

      if (!jdId) {
        setError("Select a job description.");
        setAnalyzing(false);
        return;
      }

      const analysisRes = await api.post("/api/analysis/", {
        resume_id: resumeId,
        job_description_id: Number(jdId),
      });

      navigate(`/analysis/${analysisRes.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-fade-in">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
          <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
          <Sparkles className="w-8 h-8 text-violet-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-slate-800">Analyzing your resume...</p>
          <p className="text-sm text-slate-500 mt-1">Matching it against the job description and scoring ATS fit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-100 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI Resume Optimizer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            New Resume Analysis
          </h1>
          <p className="text-violet-100 text-sm sm:text-base opacity-90">
            Upload your resume and pair it with a job description to calculate your ATS match score and unlock AI insights.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Upload Resume */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Upload Resume</h3>
                <p className="text-xs text-slate-400">PDF or DOCX format (Max 10MB)</p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <label className="relative border-2 border-dashed border-violet-200 hover:border-violet-500 bg-violet-50/30 hover:bg-violet-50/60 transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer group text-center">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <UploadIllustration className="w-28 h-24 text-violet-500 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-600 transition-colors">
                  {file ? file.name : "Choose a file or drag it here"}
                </span>
                <span className="text-xs text-slate-400 mt-1">Supports PDF, DOC, DOCX</span>
              </label>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Upload Selected Resume</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {resumeId && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-pop">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Ready: {resumeName}</span>
            </div>
          )}
        </div>

        {/* Step 2: Job Description */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Target Job</h3>
                <p className="text-xs text-slate-400">Select or paste description</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  jdMode === "existing"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setJdMode("existing")}
                disabled={jobDescriptions.length === 0}
              >
                Saved
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  jdMode === "new"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setJdMode("new")}
              >
                New JD
              </button>
            </div>
          </div>

          {jdMode === "existing" ? (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Select Saved Role
              </label>
              <div className="relative">
                <select
                  value={selectedJdId}
                  onChange={(e) => setSelectedJdId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Choose a job description --</option>
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title}
                    </option>
                  ))}
                </select>
                <FolderCheck className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newJdTitle}
                  onChange={(e) => setNewJdTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Job Description Text
                </label>
                <textarea
                  rows={4}
                  value={newJdText}
                  onChange={(e) => setNewJdText(e.target.value)}
                  placeholder="Paste key responsibilities and requirements here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main CTA */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={handleAnalyze}
          disabled={!resumeId}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          <span>Run ATS Analysis</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}