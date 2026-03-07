import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Leaf, Camera, Award, Globe2, Target, Users, User } from "lucide-react";

const About = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Camera, text: t("about.step1") },
    { icon: Target, text: t("about.step2") },
    { icon: Award, text: t("about.step3") },
  ];

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Leaf className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text mb-4">
            {t("about.title")}
          </h1>
        </div>

        {/* Developer Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="neon-card rounded-2xl p-8 mb-8 text-center border-primary/30"
        >
          <User className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-display text-lg font-bold text-primary mb-2">{t("about.developer")}</h2>
          <p className="font-display text-base font-bold mb-1">Adam Ahmed Saad Al-Hakim</p>
          <p className="text-sm text-muted-foreground">Grade 9-A | Al Shola Private School</p>
        </motion.div>

        {/* Mission */}
        <div className="neon-card rounded-2xl p-8 mb-8">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary" />
            {t("about.mission")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{t("about.mission.text")}</p>
        </div>

        {/* How it works */}
        <div className="neon-card rounded-2xl p-8 mb-8">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t("about.how")}
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="font-display text-xs text-primary mr-2">0{i + 1}</span>
                  <span className="text-sm">{step.text}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Competition */}
        <div className="neon-card rounded-2xl p-8">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t("about.competition")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{t("about.competition.text")}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default About;
