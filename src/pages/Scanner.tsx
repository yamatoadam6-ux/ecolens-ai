import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Camera, ScanLine, AlertCircle, LogIn } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Scanner = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ category: string; confidence: number; details?: string } | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  }, []);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-waste`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(user ? { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` } : {}),
          },
          body: JSON.stringify({ image: imageData }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Classification failed");
      }

      const data = await response.json();
      setResult(data);

      // Save scan to history if logged in and valid category
      if (user && data.category && data.category !== "Unknown") {
        const co2Map: Record<string, number> = { Plastic: 0.3, Paper: 0.2, Metal: 0.5, Glass: 0.25 };
        const pointsMap: Record<string, number> = { Plastic: 10, Paper: 8, Metal: 15, Glass: 12 };
        const co2 = co2Map[data.category] || 0.25;
        const points = pointsMap[data.category] || 10;

        await supabase.from("scan_history").insert({
          user_id: user.id,
          category: data.category,
          confidence: data.confidence,
          co2_saved: co2,
          points_earned: points,
        });

        // Update profile stats
        const { data: profile } = await supabase
          .from("profiles")
          .select("green_points, total_scans, co2_saved")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          await supabase.from("profiles").update({
            green_points: profile.green_points + points,
            total_scans: profile.total_scans + 1,
            co2_saved: Number(profile.co2_saved) + co2,
          }).eq("user_id", user.id);
        }

        toast.success(`+${points} Green Points! 🌿`);
      }
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  }, [user]);

  const categoryEmoji: Record<string, string> = {
    Plastic: "♻️", Paper: "📄", Metal: "🔩", Glass: "🫙", Unknown: "❓",
  };

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-3xl font-bold text-center mb-2 gradient-text">
          {t("scanner.title")}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">{t("scanner.instruction")}</p>

        {!user && (
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign in to earn Green Points
          </Link>
        )}

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden neon-card mb-6">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {!streaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
              <Camera className="w-16 h-16 text-primary/40" />
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button"
              >
                Open Camera
              </button>
            </div>
          )}

          {streaming && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-scan" />
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            </div>
          )}

          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-display text-sm text-primary">Analyzing...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 text-destructive text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {streaming && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={capture}
              disabled={analyzing}
              className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button disabled:opacity-50"
            >
              <ScanLine className="w-4 h-4 inline mr-2" />
              {t("scanner.capture")}
            </button>
            <button
              onClick={() => { stopCamera(); setResult(null); }}
              className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-display font-bold text-sm"
            >
              Stop
            </button>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neon-card rounded-2xl p-6 text-center"
          >
            <div className="text-5xl mb-3">{categoryEmoji[result.category] || "❓"}</div>
            <h3 className="font-display text-2xl font-bold text-primary mb-1">{result.category}</h3>
            <p className="text-muted-foreground text-sm mb-1">
              Confidence: {result.confidence}%
            </p>
            {result.details && (
              <p className="text-xs text-muted-foreground mb-3">{result.details}</p>
            )}
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Scanner;
