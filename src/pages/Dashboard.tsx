import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Recycle, Cloud, TrendingUp, Award, ScanLine } from "lucide-react";

const mockStats = {
  scanned: 47,
  co2Saved: "12.3 kg",
  rank: 156,
  points: 1240,
};

const badges = [
  { name: "First Scan", icon: "🎯", earned: true, desc: "Complete your first scan" },
  { name: "Recycle King", icon: "👑", earned: true, desc: "Scan 25 items" },
  { name: "Earth Protector", icon: "🛡️", earned: false, desc: "Scan 100 items" },
  { name: "Eco Legend", icon: "🏆", earned: false, desc: "Reach top 10 globally" },
  { name: "Green Streak", icon: "🔥", earned: true, desc: "Scan 7 days in a row" },
  { name: "Planet Savior", icon: "🌍", earned: false, desc: "Save 50kg CO₂" },
];

const Dashboard = () => {
  const { t } = useLanguage();

  const stats = [
    { label: t("dashboard.scanned"), value: mockStats.scanned, icon: ScanLine, suffix: "" },
    { label: t("dashboard.co2"), value: mockStats.co2Saved, icon: Cloud, suffix: "" },
    { label: t("dashboard.rank"), value: `#${mockStats.rank}`, icon: TrendingUp, suffix: "" },
    { label: t("dashboard.points"), value: mockStats.points, icon: Award, suffix: "" },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-center gradient-text mb-10">
          {t("dashboard.title")}
        </h1>

        {/* Stats grid */}
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
              <div className="font-display text-2xl font-bold text-foreground mb-1">{stat.value}{stat.suffix}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          {t("dashboard.badges")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={`neon-card rounded-xl p-5 text-center transition-all ${
                badge.earned ? "" : "opacity-40 grayscale"
              }`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className="font-display text-xs font-bold mb-1">{badge.name}</div>
              <div className="text-xs text-muted-foreground">{badge.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
