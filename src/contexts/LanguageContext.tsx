import React, { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "ar";

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<string, Record<Lang, string>> = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.scanner": { en: "Scanner", ar: "الماسح" },
  "nav.leaderboard": { en: "Leaderboard", ar: "المتصدرون" },
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.about": { en: "About", ar: "حول" },
  "hero.title": { en: "EcoLens AI", ar: "EcoLens AI" },
  "hero.subtitle": { en: "Scan. Classify. Save the Planet.", ar: "امسح. صنّف. أنقذ الكوكب." },
  "hero.cta": { en: "Start Scanning", ar: "ابدأ المسح" },
  "hero.desc": { en: "AI-powered waste classification for a greener tomorrow. Point your camera at any waste item and let our AI identify and classify it instantly.", ar: "تصنيف النفايات بالذكاء الاصطناعي لغد أكثر خضرة. وجّه كاميرتك نحو أي نفاية ودع الذكاء الاصطناعي يتعرف عليها ويصنّفها فوراً." },
  "scanner.title": { en: "AI Vision Scanner", ar: "الماسح الذكي" },
  "scanner.instruction": { en: "Point your camera at a waste item to classify it", ar: "وجّه الكاميرا نحو نفاية لتصنيفها" },
  "scanner.capture": { en: "Capture & Analyze", ar: "التقط وحلّل" },
  "scanner.categories": { en: "Categories", ar: "الفئات" },
  "leaderboard.title": { en: "Hall of Fame", ar: "قاعة المشاهير" },
  "leaderboard.subtitle": { en: "Top Eco-Heroes saving the planet", ar: "أبطال البيئة الأوائل" },
  "leaderboard.rank": { en: "Rank", ar: "الترتيب" },
  "leaderboard.hero": { en: "Eco-Hero", ar: "بطل البيئة" },
  "leaderboard.points": { en: "Green Points", ar: "النقاط الخضراء" },
  "leaderboard.items": { en: "Items", ar: "العناصر" },
  "dashboard.title": { en: "Your Eco Dashboard", ar: "لوحتك البيئية" },
  "dashboard.scanned": { en: "Items Scanned", ar: "العناصر الممسوحة" },
  "dashboard.co2": { en: "CO₂ Saved", ar: "CO₂ موفّر" },
  "dashboard.rank": { en: "Global Rank", ar: "الترتيب العالمي" },
  "dashboard.points": { en: "Green Points", ar: "النقاط الخضراء" },
  "dashboard.badges": { en: "Your Badges", ar: "شاراتك" },
  "dashboard.login": { en: "Sign in to track your progress", ar: "سجّل الدخول لتتبع تقدمك" },
  "about.title": { en: "About EcoLens AI", ar: "حول EcoLens AI" },
  "about.mission": { en: "Our Mission", ar: "مهمتنا" },
  "about.mission.text": { en: "EcoLens AI leverages cutting-edge artificial intelligence to revolutionize waste management. By making recycling accessible, engaging, and rewarding, we empower individuals to become environmental champions.", ar: "يستفيد EcoLens AI من أحدث تقنيات الذكاء الاصطناعي لإحداث ثورة في إدارة النفايات. من خلال جعل إعادة التدوير سهلة وممتعة ومجزية، نمكّن الأفراد من أن يصبحوا أبطالاً للبيئة." },
  "about.how": { en: "How It Works", ar: "كيف يعمل" },
  "about.step1": { en: "Point your camera at any waste item", ar: "وجّه كاميرتك نحو أي نفاية" },
  "about.step2": { en: "AI classifies it instantly (Plastic, Paper, Metal, Glass)", ar: "يصنّفها الذكاء الاصطناعي فوراً (بلاستيك، ورق، معدن، زجاج)" },
  "about.step3": { en: "Earn Green Points and climb the leaderboard", ar: "اكسب النقاط الخضراء وتصدّر المتصدرين" },
  "about.competition": { en: "International Competition Entry", ar: "مشاركة في المسابقة الدولية" },
  "about.competition.text": { en: "This project is developed for the International Environmental Innovation Competition, showcasing how AI can drive sustainable behavior change and promote a circular economy in the UAE and beyond.", ar: "تم تطوير هذا المشروع للمسابقة الدولية للابتكار البيئي، لإظهار كيف يمكن للذكاء الاصطناعي تحفيز التغيير السلوكي المستدام وتعزيز الاقتصاد الدائري في الإمارات وخارجها." },
  "tips.title": { en: "Daily Eco Tips", ar: "نصائح بيئية يومية" },
  "theme.dark": { en: "Dark", ar: "داكن" },
  "theme.light": { en: "Light", ar: "فاتح" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = () => setLang((prev) => (prev === "en" ? "ar" : "en"));

  const t = (key: string) => translations[key]?.[lang] ?? key;

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
