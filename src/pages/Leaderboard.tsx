import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { useEffect, useState } from "react";

interface Leader {
  rank: number;
  display_name: string;
  green_points: number;
  total_scans: number;
}

const rankEmoji = ["🌟", "⭐", "✨", "🌿", "🍃", "♻️", "🌱", "🌍", "💚", "🌏"];

const rankStyles: Record<number, string> = {
  1: "border-yellow-500/30 bg-yellow-500/5",
  2: "border-slate-300/30 bg-slate-300/5",
  3: "border-amber-600/30 bg-amber-600/5",
};

const Leaderboard = () => {
  const { t } = useLanguage();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, green_points, total_scans")
        .order("green_points", { ascending: false })
        .limit(10);

      if (data) {
        setLeaders(data.map((d, i) => ({ ...d, rank: i + 1 })));
      }
      setLoading(false);
    };
    fetchLeaders();
  }, []);

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

        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
          <div className="col-span-1">{t("leaderboard.rank")}</div>
          <div className="col-span-6">{t("leaderboard.hero")}</div>
          <div className="col-span-3 text-right">{t("leaderboard.points")}</div>
          <div className="col-span-2 text-right">{t("leaderboard.items")}</div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t("leaderboard.empty")}</div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, i) => (
              <motion.div
                key={i}
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
                  <span className="text-2xl">{rankEmoji[i] || "🌿"}</span>
                  <span className="font-medium text-sm truncate">{leader.display_name || "Anonymous"}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-primary font-display font-bold text-sm">{leader.green_points.toLocaleString()}</span>
                </div>
                <div className="col-span-2 text-right text-muted-foreground text-sm">
                  {leader.total_scans}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Leaderboard;
