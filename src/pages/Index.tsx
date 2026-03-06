import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Camera, Leaf, Recycle, Zap, ArrowRight } from "lucide-react";

const categories = [
  { name: "Plastic", icon: "♻️", color: "from-blue-500/20 to-blue-600/5" },
  { name: "Paper", icon: "📄", color: "from-amber-500/20 to-amber-600/5" },
  { name: "Metal", icon: "🔩", color: "from-slate-400/20 to-slate-500/5" },
  { name: "Glass", icon: "🫙", color: "from-emerald-500/20 to-emerald-600/5" },
];

const tips = [
  "Rinse containers before recycling to avoid contamination.",
  "One contaminated item can ruin an entire batch of recyclables.",
  "Aluminum cans can be recycled indefinitely without losing quality.",
  "Glass takes over 1 million years to decompose in a landfill.",
];

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 scan-line opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-display mb-8">
              <Zap className="w-3 h-3" />
              AI-Powered Recycling
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-6">
              <span className="gradient-text">{t("hero.title")}</span>
            </h1>

            <p className="text-xl md:text-2xl font-display text-muted-foreground mb-4">
              {t("hero.subtitle")}
            </p>

            <p className="max-w-2xl mx-auto text-muted-foreground mb-10 text-sm md:text-base leading-relaxed">
              {t("hero.desc")}
            </p>

            <Link
              to="/scanner"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button transition-transform hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              {t("hero.cta")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-center mb-10">
            {t("scanner.categories")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`neon-card rounded-xl p-6 text-center bg-gradient-to-b ${cat.color}`}
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <div className="font-display font-bold text-sm">{cat.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16">
        <div className="container">
          <h2 className="font-display text-2xl font-bold text-center mb-10 flex items-center justify-center gap-3">
            <Leaf className="w-6 h-6 text-primary" />
            {t("tips.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {tips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="neon-card rounded-xl p-5 flex items-start gap-3"
              >
                <Recycle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
