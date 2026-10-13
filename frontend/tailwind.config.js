/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Reuses the app's EXISTING theme toggle (ThemeContext sets
  // data-theme="dark" on <html>) instead of Tailwind's own .dark class
  // convention - no changes needed to ThemeContext.jsx.
  darkMode: ["selector", '[data-theme="dark"]'],
  corePlugins: {
    // Preflight is Tailwind's global CSS reset (margins, headings, etc.).
    // Disabled on purpose: this project's existing pages (Login, Signup,
    // Dashboard's siblings, etc.) already have their own base styles in
    // global.css. Leaving preflight on would silently change how every
    // other page renders. With it off, Tailwind only ever adds classes you
    // explicitly put in className="..." - it can't affect anything else.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Brand: every "blue/indigo" in the old gradients now resolves to a
        // purple shade, so hero banners go purple -> violet like the mockups.
        brand: {
          purple: "#6D28D9",
          violet: "#A855F7",
          indigo: "#7C3AED",
          blue: "#A855F7",
        },
        // Pull the default "indigo" toward purple so gradients such as
        // "from-violet-600 to-indigo-600" stay purple (not blue-ish).
        indigo: {
          50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
          400: "#a78bfa", 500: "#9d5cf6", 600: "#9333ea", 700: "#7e22ce",
          800: "#6b21a8", 900: "#581c87",
        },
        // Purple-tinted navy replacing Tailwind's cold grey-blue "slate".
        // 950 = page background, 900 = cards/sidebar, 800 = borders.
        slate: {
          50: "#f7f6fd", 100: "#efecfa", 200: "#e1ddf3", 300: "#c5bfe4",
          400: "#9a95c4", 500: "#6f6a99", 600: "#57527f", 700: "#3a3666",
          800: "#25224d", 900: "#14132f", 950: "#0b0a20",
        },
      },
      borderRadius: {
        "xl2": "24px",
        "xl3": "28px",
      },
      boxShadow: {
        // Toned down from the earlier version - premium dark SaaS reads as
        // "controlled glow", not a purple bloom around every card.
        "glass": "0 4px 20px rgba(0, 0, 0, 0.25)",
        "glow": "0 0 16px rgba(139, 92, 246, 0.22)",
        "glow-sm": "0 0 8px rgba(139, 92, 246, 0.18)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #A855F7 100%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        "shimmer": { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "pop": { "0%": { transform: "scale(0.85)", opacity: 0 }, "60%": { transform: "scale(1.06)", opacity: 1 }, "100%": { transform: "scale(1)" } },
        "wave": { "0%, 100%": { transform: "scaleY(0.3)" }, "50%": { transform: "scaleY(1)" } },
        "float-slow": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "shimmer": "shimmer 1.8s linear infinite",
        "pop": "pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        "wave": "wave 1s ease-in-out infinite",
        "float-slow": "float-slow 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};