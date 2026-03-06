import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Trophy, BarChart3, Info, Home, Sun, Moon, Globe, Menu, X, MapPin, LogIn, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/", labelKey: "nav.home", icon: Home },
  { path: "/scanner", labelKey: "nav.scanner", icon: Camera },
  { path: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy },
  { path: "/dashboard", labelKey: "nav.dashboard", icon: BarChart3 },
  { path: "/eco-locator", label: "Eco-Locator", icon: MapPin },
  { path: "/about", labelKey: "nav.about", icon: Info },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { t, toggleLang, lang, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-background font-body">
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-primary neon-text">EcoLens</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active ? "bg-primary/10 text-primary neon-text" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.labelKey ? t(item.labelKey) : item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === "/admin" ? "bg-primary/10 text-primary neon-text" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "عربي" : "EN"}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <button onClick={signOut} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link to="/auth" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground neon-button">
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg bg-secondary text-secondary-foreground">
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border overflow-hidden"
            >
              <div className="container py-3 flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.labelKey ? t(item.labelKey) : item.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                {user ? (
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 EcoLens AI. {t("footer.rights")}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
