
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 6%)",
        surface: "hsl(222 37% 10%)",
        border: "hsl(220 12% 18%)",
        text: {
          primary: "hsl(210 15% 92%)",
          secondary: "hsl(215 12% 65%)"
        },
        accent: {
          from: "hsl(280 80% 60%)",
          to: "hsl(200 90% 55%)"
        },
        success: "hsl(150 70% 45%)",
        warning: "hsl(40 90% 55%)",
        danger: "hsl(0 75% 55%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(120, 119, 198, 0.25)",
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      transitionTimingFunction: {
        'gentle': 'cubic-bezier(0.22,1,0.36,1)',
      }
    },
  },
  plugins: [],
}
