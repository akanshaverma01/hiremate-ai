import { Sparkles } from "lucide-react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-wrap animate-fade-in">
      <div className="relative" style={{ width: 36, height: 36, marginBottom: 12 }}>
        <div className="spinner" style={{ marginBottom: 0 }} />
        <Sparkles
          className="absolute inset-0 m-auto animate-pulse"
          style={{ width: 14, height: 14, color: "var(--primary)" }}
        />
      </div>
      <p>{label}</p>
    </div>
  );
}
