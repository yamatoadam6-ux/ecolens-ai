import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Recycle, Cloud, TrendingUp, Award, ScanLine, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const badges = [
  { name: "First Scan", icon: "🎯", threshold: 1, desc: "Complete your first scan" },
  { name: "Recycle King", icon: "👑", threshold: 25, desc: "Scan 25 items" },
  { name: "Earth Protector", icon: "🛡️", threshold: 100, desc: "Scan 100 items" },
  { name: "Eco Legend", icon: "🏆", threshold: 500, desc: "Reach 500 scans" },
  { name: "Green Streak", icon: "🔥", threshold: 50, desc: "Scan 50 items" },
  { name: "Planet Savior", icon: "🌍", threshold: 200, desc: "Scan 200 items" },
];

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, refreshProfile } = useAuth();
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      refreshProfile();
      // Get rank
      supabase
        .from("profiles")
        .select("user_id")
        .order("green_points", { ascending: false })
        .then(({ data }) => {
          if (data) {
            const idx = data.findIndex((p) => p.user_id === user.id);
            setRank(idx >= 0 ? idx + 1 : null);
          }
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <ScanLine className="w-16 h-16 text-primary/40 mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold mb-4">{t("dashboard.login")}</h1>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </Link>
      </div>
    );
  }

  const stats = [
    { label: t("dashboard.scanned"), value: profile?.total_scans ?? 0, icon: ScanLine },
    { label: t("dashboard.co2"), value: `${Number(profile?.co2_saved ?? 0).toFixed(1)} kg`, icon: Cloud },
    { label: t("dashboard.rank"), value: rank ? `#${rank}` : "—", icon: TrendingUp },
    { label: t("dashboard.points"), value: profile?.green_points ?? 0, icon: Award },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-center gradient-text mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-10">
          {profile?.display_name || user.email}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="neon-card rounded-xl p-5 text-center"
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <div className="font-display text-2xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          {t("dashboard.badges")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge, i) => {
            const earned = (profile?.total_scans ?? 0) >= badge.threshold;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`neon-card rounded-xl p-5 text-center transition-all ${
                  earned ? "" : "opacity-40 grayscale"
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="font-display text-xs font-bold mb-1">{badge.name}</div>
                <div className="text-xs text-muted-foreground">{badge.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
