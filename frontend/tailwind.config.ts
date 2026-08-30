import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vintage-paper office — muted paper grounds + corporate blue.
        cream: "#F5EEDB", // copy paper
        parchment: "#EFE3C6", // aged memo
        manila: "#E6D4A8", // folder
        ink: "#2B2622", // typewriter black-brown
        faded: "#6B6152", // faded typewriter ink
        corp: "#123F63", // corporate blue — nav, buttons, monitor
        "corp-light": "#3E6E96",
        interview: "#0F3A5C", // confessional / talking-head backdrop
        concrete: "#8C8A80", // warehouse / cubicle grey
        stamp: "#9E2B1E", // red rubber stamp
        coffee: "#6B4A2F",
        highlight: "#F0CE3E", // highlighter yellow
        sage: "#6E8253", // "approved" green
        cork: "#C8A06A", // bulletin board
      },
      fontFamily: {
        typewriter: ["var(--font-typewriter)", "Courier New", "monospace"],
        serif: ["var(--font-slab)", "Georgia", "serif"],
        sans: ["var(--font-slab)", "Georgia", "serif"],
      },
      boxShadow: {
        paper: "0 1px 2px rgba(43,38,34,0.14), 0 8px 20px -8px rgba(43,38,34,0.28)",
        card: "0 2px 10px rgba(43,38,34,0.18)",
        lift: "0 14px 34px -10px rgba(43,38,34,0.4)",
        "inset-rule": "inset 0 -1px 0 rgba(43,38,34,0.15)",
      },
      keyframes: {
        sweep: { to: { transform: "rotate(360deg)" } },
        "stamp-in": {
          "0%": { opacity: "0", transform: "rotate(-12deg) scale(1.6)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "rotate(-8deg) scale(1)" },
        },
        "type-blink": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        "paper-shift": { to: { backgroundPosition: "0 -12px" } },
        steam: {
          "0%": { opacity: "0", transform: "translateY(3px)" },
          "35%": { opacity: "0.7" },
          "100%": { opacity: "0", transform: "translateY(-11px)" },
        },
      },
      animation: {
        sweep: "sweep 1.8s linear infinite",
        "stamp-in": "stamp-in 0.35s ease-out",
        "type-blink": "type-blink 1s step-end infinite",
        "paper-shift": "paper-shift 0.9s linear infinite",
        steam: "steam 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
