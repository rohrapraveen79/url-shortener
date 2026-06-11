import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Redirect from "./pages/Redirect";

export default function App() {
  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div className={isDark ? "dark" : ""}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage isDark={isDark} setIsDark={setIsDark} />
            } 
          />
          <Route path="/:shortCode" element={<Redirect />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function HomePage({ isDark, setIsDark }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/5 dark:bg-slate-950/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">🔗 URL Shortener</h1>
            <p className="text-purple-200 text-sm">Shorten. Share. Track.</p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-white border border-white/20 hover:border-white/40"
            aria-label="Toggle theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-300" />
            ) : (
              <Moon className="w-5 h-5 text-slate-200" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Home />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8 text-center text-slate-400">
        <p className="text-sm">
          Built with React • Tailwind CSS • Supabase • ❤️
        </p>
      </footer>
    </div>
  );
}
