import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";

const mockLeaders = [
  { rank: 1, name: "Fatima Al-Mansouri", points: 12450, items: 342, avatar: "🌟" },
  { rank: 2, name: "Ahmed Hassan", points: 10200, items: 289, avatar: "⭐" },
  { rank: 3, name: "Sara Ibrahim", points: 9870, items: 276, avatar: "✨" },
  { rank: 4, name: "Omar Khalid", points: 8340, items: 231, avatar: "🌿" },
  { rank: 5, name: "Layla Noor", points: 7650, items: 213, avatar: "🍃" },
  { rank: 6, name: "Youssef Ali", points: 6980, items: 198, avatar: "♻️" },
  { rank: 7, name: "Mariam Saeed", points: 5430, items: 154, avatar: "🌱" },
  { rank: 8, name: "Khalid Rahman", points: 4870, items: 139, avatar: "🌍" },
  { rank: 9, name: "Nadia Farah", points: 3920, items: 112, avatar: "💚" },
  { rank: 10, name: "Hassan Jaber", points: 3450, items: 98, avatar: "🌏" },
];

const rankStyles: Record<number, string> = {
  1: "border-yellow-500/30 bg-yellow-500/5",
  2: "border-slate-300/30 bg-slate-300/5",
  3: "border-amber-600/30 bg-amber-600/5",
};

const Leaderboard = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Trophy className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">
            {t("leaderboard.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("leaderboard.subtitle")}</p>
        </div>

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
          <div className="col-span-1">{t("leaderboard.rank")}</div>
          <div className="col-span-6">{t("leaderboard.hero")}</div>
          <div className="col-span-3 text-right">{t("leaderboard.points")}</div>
          <div className="col-span-2 text-right">{t("leaderboard.items")}</div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {mockLeaders.map((leader, i) => (
            <motion.div
              key={leader.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`grid grid-cols-12 gap-2 items-center px-4 py-4 rounded-xl border neon-card transition-all hover:scale-[1.01] ${
                rankStyles[leader.rank] || ""
              }`}
            >
              <div className="col-span-1">
                {leader.rank <= 3 ? (
                  <Medal className={`w-5 h-5 ${leader.rank === 1 ? "text-yellow-500" : leader.rank === 2 ? "text-slate-300" : "text-amber-600"}`} />
                ) : (
                  <span className="text-muted-foreground font-display text-sm">#{leader.rank}</span>
                )}
              </div>
              <div className="col-span-6 flex items-center gap-3">
                <span className="text-2xl">{leader.avatar}</span>
                <span className="font-medium text-sm truncate">{leader.name}</span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-primary font-display font-bold text-sm">{leader.points.toLocaleString()}</span>
              </div>
              <div className="col-span-2 text-right text-muted-foreground text-sm">
                {leader.items}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
