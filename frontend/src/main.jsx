import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// CSS order matters: global -> theme -> tailwind. These must be imported
// BEFORE App (App pulls in AppShell, which also imports tailwind.css and
// would otherwise put Tailwind first). theme.css relies on Tailwind's real
// dark: variants coming later so they win specificity ties.
import "./styles/global.css";
import "./styles/theme.css";
import "./styles/tailwind.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// If the browser restores this page from its back/forward cache (bfcache -
// happens on browser Back/Forward, and sometimes on reopening a tab the OS
// kept alive), it revives the ENTIRE previous JS state exactly as it was -
// every React useState value, every already-fetched API result - without
// re-running any mount effects or re-checking who's logged in now. That's
// how a page that was showing one person's Cover Letter / Skill Gap /
// Recruiter Feedback result could reappear showing their data even after a
// different person has since logged in on the same browser. Forcing a full
// reload on bfcache-restore guarantees a clean remount: AuthContext re-reads
// the CURRENT token from localStorage and every page re-fetches from
// scratch for whoever is actually logged in.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
