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
  "nav.ecolocator": { en: "Eco-Locator", ar: "محدد المواقع" },
  "hero.title": { en: "EcoLens AI", ar: "EcoLens AI" },
  "hero.subtitle": { en: "Scan. Classify. Save the Planet.", ar: "امسح. صنّف. أنقذ الكوكب." },
  "hero.cta": { en: "Start Scanning", ar: "ابدأ المسح" },
  "hero.desc": { en: "AI-powered waste classification for a greener tomorrow. Point your camera at any waste item and let our AI identify and classify it instantly.", ar: "تصنيف النفايات بالذكاء الاصطناعي لغد أكثر خضرة. وجّه كاميرتك نحو أي نفاية ودع الذكاء الاصطناعي يتعرف عليها ويصنّفها فوراً." },
  "scanner.title": { en: "AI Vision Scanner", ar: "الماسح الذكي" },
  "scanner.instruction": { en: "Point your camera at a waste item or upload a photo to classify it", ar: "وجّه الكاميرا نحو نفاية أو ارفع صورة لتصنيفها" },
  "scanner.capture": { en: "Capture & Analyze", ar: "التقط وحلّل" },
  "scanner.upload": { en: "Upload from Gallery", ar: "ارفع من المعرض" },
  "scanner.openCamera": { en: "Open Camera", ar: "افتح الكاميرا" },
  "scanner.stop": { en: "Stop", ar: "إيقاف" },
  "scanner.analyzing": { en: "Analyzing...", ar: "جاري التحليل..." },
  "scanner.confidence": { en: "Confidence", ar: "الثقة" },
  "scanner.signIn": { en: "Sign in to earn Green Points", ar: "سجّل الدخول لكسب النقاط الخضراء" },
  "scanner.categories": { en: "Categories", ar: "الفئات" },
  "leaderboard.title": { en: "Hall of Fame", ar: "قاعة المشاهير" },
  "leaderboard.subtitle": { en: "Top Eco-Heroes saving the planet", ar: "أبطال البيئة الأوائل ينقذون الكوكب" },
  "leaderboard.rank": { en: "Rank", ar: "الترتيب" },
  "leaderboard.hero": { en: "Eco-Hero", ar: "بطل البيئة" },
  "leaderboard.points": { en: "Green Points", ar: "النقاط الخضراء" },
  "leaderboard.items": { en: "Items", ar: "العناصر" },
  "leaderboard.empty": { en: "No eco-heroes yet. Be the first!", ar: "لا يوجد أبطال بيئة بعد. كن الأول!" },
  "dashboard.title": { en: "Your Eco Dashboard", ar: "لوحتك البيئية" },
  "dashboard.scanned": { en: "Items Scanned", ar: "العناصر الممسوحة" },
  "dashboard.co2": { en: "CO₂ Saved", ar: "CO₂ موفّر" },
  "dashboard.rank": { en: "Global Rank", ar: "الترتيب العالمي" },
  "dashboard.points": { en: "Green Points", ar: "النقاط الخضراء" },
  "dashboard.badges": { en: "Your Badges", ar: "شاراتك" },
  "dashboard.login": { en: "Sign in to track your progress", ar: "سجّل الدخول لتتبع تقدمك" },
  "dashboard.signIn": { en: "Sign In", ar: "تسجيل الدخول" },
  "about.title": { en: "About EcoLens AI", ar: "حول EcoLens AI" },
  "about.mission": { en: "Our Mission", ar: "مهمتنا" },
  "about.mission.text": { en: "EcoLens AI leverages cutting-edge artificial intelligence to revolutionize waste management. By making recycling accessible, engaging, and rewarding, we empower individuals to become environmental champions.", ar: "يستفيد EcoLens AI من أحدث تقنيات الذكاء الاصطناعي لإحداث ثورة في إدارة النفايات. من خلال جعل إعادة التدوير سهلة وممتعة ومجزية، نمكّن الأفراد من أن يصبحوا أبطالاً للبيئة." },
  "about.how": { en: "How It Works", ar: "كيف يعمل" },
  "about.step1": { en: "Point your camera at any waste item", ar: "وجّه كاميرتك نحو أي نفاية" },
  "about.step2": { en: "AI classifies it instantly (Plastic, Paper, Metal, Glass)", ar: "يصنّفها الذكاء الاصطناعي فوراً (بلاستيك، ورق، معدن، زجاج)" },
  "about.step3": { en: "Earn Green Points and climb the leaderboard", ar: "اكسب النقاط الخضراء وتصدّر المتصدرين" },
  "about.competition": { en: "International Competition Entry", ar: "مشاركة في المسابقة الدولية" },
  "about.competition.text": { en: "This project is developed for the International Environmental Innovation Competition, showcasing how AI can drive sustainable behavior change and promote a circular economy in the UAE and beyond.", ar: "تم تطوير هذا المشروع للمسابقة الدولية للابتكار البيئي، لإظهار كيف يمكن للذكاء الاصطناعي تحفيز التغيير السلوكي المستدام وتعزيز الاقتصاد الدائري في الإمارات وخارجها." },
  "about.developer": { en: "Developed by", ar: "تطوير" },
  "tips.title": { en: "Daily Eco Tips", ar: "نصائح بيئية يومية" },
  "theme.dark": { en: "Dark", ar: "داكن" },
  "theme.light": { en: "Light", ar: "فاتح" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  "footer.developer": { en: "Developed by: Adam Ahmed Saad Al-Hakim | Grade 9-A | Al Shola Private School", ar: "تطوير: آدم أحمد سعد الحكيم | الصف 9-أ | مدرسة الشعلة الخاصة" },
  "locator.title": { en: "Eco-Locator", ar: "محدد المواقع البيئية" },
  "locator.subtitle": { en: "Find nearest recycling centers in Sharjah & UAE", ar: "اعثر على أقرب مراكز إعادة التدوير في الشارقة والإمارات" },
  "locator.useLocation": { en: "Use My Location", ar: "استخدم موقعي" },
  "locator.locating": { en: "Locating...", ar: "جاري تحديد الموقع..." },
  "locator.directions": { en: "Directions", ar: "الاتجاهات" },
  "locator.found": { en: "Location found! Showing nearest centers.", ar: "تم تحديد الموقع! عرض أقرب المراكز." },
  "locator.error": { en: "Could not get your location. Showing all centers.", ar: "تعذر تحديد موقعك. عرض جميع المراكز." },
  // Eco tips
  "tip.1": { en: "Rinse containers before recycling to avoid contamination.", ar: "اشطف الحاويات قبل إعادة التدوير لتجنب التلوث." },
  "tip.2": { en: "One contaminated item can ruin an entire batch of recyclables.", ar: "عنصر ملوث واحد يمكن أن يفسد دفعة كاملة من المواد القابلة لإعادة التدوير." },
  "tip.3": { en: "Aluminum cans can be recycled indefinitely without losing quality.", ar: "يمكن إعادة تدوير علب الألمنيوم إلى ما لا نهاية دون فقدان الجودة." },
  "tip.4": { en: "Glass takes over 1 million years to decompose in a landfill.", ar: "يستغرق الزجاج أكثر من مليون سنة ليتحلل في مكبّ النفايات." },
  "tip.5": { en: "Recycling one ton of paper saves 17 trees and 7,000 gallons of water.", ar: "إعادة تدوير طن واحد من الورق يوفر 17 شجرة و7000 غالون من الماء." },
  "tip.6": { en: "Plastic bags take 500-1000 years to decompose. Use reusable bags instead.", ar: "تستغرق الأكياس البلاستيكية 500-1000 سنة لتتحلل. استخدم أكياساً قابلة لإعادة الاستخدام." },
  "tip.7": { en: "Steel is the most recycled material in the world — over 80 million tons per year.", ar: "الفولاذ هو أكثر المواد إعادة تدويراً في العالم — أكثر من 80 مليون طن سنوياً." },
  "tip.8": { en: "Composting food waste reduces methane emissions from landfills by up to 50%.", ar: "تحويل نفايات الطعام إلى سماد يقلل انبعاثات الميثان من المكبّات بنسبة تصل إلى 50%." },
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
