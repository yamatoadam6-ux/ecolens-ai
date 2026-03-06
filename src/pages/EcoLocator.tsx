import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface RecyclingCenter {
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
  types: string[];
  distance?: number;
}

const recyclingCenters: RecyclingCenter[] = [
  {
    name: "Bee'ah Recycling Center",
    nameAr: "مركز بيئة لإعادة التدوير",
    address: "Al Sajaa Industrial Area, Sharjah",
    addressAr: "المنطقة الصناعية الصجعة، الشارقة",
    lat: 25.3463,
    lng: 55.4209,
    phone: "+971 6 502 0000",
    hours: "7:00 AM - 5:00 PM",
    types: ["Plastic", "Paper", "Metal", "Glass"],
  },
  {
    name: "Sharjah Recycling Plant",
    nameAr: "مصنع الشارقة لإعادة التدوير",
    address: "Industrial Area 15, Sharjah",
    addressAr: "المنطقة الصناعية 15، الشارقة",
    lat: 25.3200,
    lng: 55.4100,
    phone: "+971 6 533 1111",
    hours: "8:00 AM - 6:00 PM",
    types: ["Plastic", "Metal"],
  },
  {
    name: "Emirates Environmental Group",
    nameAr: "مجموعة الإمارات للبيئة",
    address: "Al Qusais, Dubai (near Sharjah border)",
    addressAr: "القصيص، دبي (بالقرب من حدود الشارقة)",
    lat: 25.2866,
    lng: 55.3841,
    phone: "+971 4 344 8622",
    hours: "9:00 AM - 5:00 PM",
    types: ["Paper", "Plastic", "Glass", "Metal"],
  },
  {
    name: "Tadweer Waste Management",
    nameAr: "تدوير لإدارة النفايات",
    address: "Muwaileh Commercial, Sharjah",
    addressAr: "مويلح التجارية، الشارقة",
    lat: 25.3100,
    lng: 55.4500,
    phone: "+971 6 544 2222",
    hours: "7:30 AM - 4:30 PM",
    types: ["Plastic", "Paper", "Metal"],
  },
  {
    name: "iRecycle Collection Point",
    nameAr: "نقطة تجميع iRecycle",
    address: "Sahara Centre, Sharjah",
    addressAr: "مركز الصحراء، الشارقة",
    lat: 25.2965,
    lng: 55.3755,
    phone: "+971 4 800 4732",
    hours: "10:00 AM - 10:00 PM",
    types: ["Plastic", "Paper", "Glass"],
  },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EcoLocator = () => {
  const { t, lang } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centers, setCenters] = useState(recyclingCenters);
  const [locating, setLocating] = useState(false);

  const requestLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        const sorted = recyclingCenters
          .map((c) => ({ ...c, distance: haversineDistance(loc.lat, loc.lng, c.lat, c.lng) }))
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        setCenters(sorted);
        setLocating(false);
        toast.success("Location found! Showing nearest centers.");
      },
      (err) => {
        toast.error("Could not get your location. Showing all centers.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const categoryColors: Record<string, string> = {
    Plastic: "bg-blue-500/20 text-blue-400",
    Paper: "bg-amber-500/20 text-amber-400",
    Metal: "bg-slate-400/20 text-slate-300",
    Glass: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <MapPin className="w-12 h-12 text-primary mx-auto mb-4 animate-float" />
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">
            {lang === "ar" ? "محدد المواقع البيئية" : "Eco-Locator"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {lang === "ar"
              ? "اعثر على أقرب مراكز إعادة التدوير في الشارقة والإمارات"
              : "Find nearest recycling centers in Sharjah & UAE"}
          </p>

          <button
            onClick={requestLocation}
            disabled={locating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
            {locating
              ? lang === "ar" ? "جاري تحديد الموقع..." : "Locating..."
              : lang === "ar" ? "استخدم موقعي" : "Use My Location"}
          </button>
        </div>

        {/* Map embed */}
        <div className="neon-card rounded-2xl overflow-hidden mb-8">
          <iframe
            title="Recycling Centers Map"
            src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=recycling+centers+Sharjah+UAE${
              userLocation ? `&center=${userLocation.lat},${userLocation.lng}&zoom=12` : "&center=25.3463,55.4209&zoom=11"
            }`}
            className="w-full h-64 md:h-80"
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* Centers list */}
        <div className="space-y-4">
          {centers.map((center, i) => (
            <motion.div
              key={center.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="neon-card rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-sm font-bold mb-1">
                    {lang === "ar" ? center.nameAr : center.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lang === "ar" ? center.addressAr : center.address}
                  </p>
                </div>
                {center.distance !== undefined && (
                  <span className="text-xs font-display text-primary font-bold whitespace-nowrap">
                    {center.distance.toFixed(1)} km
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {center.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {center.hours}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {center.types.map((type) => (
                    <span
                      key={type}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[type] || ""}`}
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {lang === "ar" ? "الاتجاهات" : "Directions"}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EcoLocator;
