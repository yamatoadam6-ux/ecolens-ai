import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ScanLine, AlertCircle, LogIn, ImagePlus, SwitchCamera } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const co2Map: Record<string, number> = { Plastic: 0.3, Paper: 0.2, Metal: 0.5, Glass: 0.25 };
const pointsMap: Record<string, number> = { Plastic: 10, Paper: 8, Metal: 15, Glass: 12 };
const categoryEmoji: Record<string, string> = {
  Plastic: "♻️", Paper: "📄", Metal: "🔩", Glass: "🫙", Unknown: "❓",
};

const Scanner = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ category: string; confidence: number; details?: string } | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user" = facingMode) => {
    try {
      setError(null);
      setPreviewSrc(null);
      setResult(null);
      setPointsAwarded(null);
      // Stop any existing stream first
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Use loadedmetadata for fastest possible play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
        setStreaming(true);
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  }, [facingMode]);

  const switchCamera = useCallback(async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  }, [facingMode, startCamera]);

  const savePoints = useCallback(async (category: string) => {
    if (!user || category === "Unknown") return;
    const co2 = co2Map[category] || 0.25;
    const points = pointsMap[category] || 10;

    // Run DB operations in parallel
    const [, { data: profile }] = await Promise.all([
      supabase.from("scan_history").insert({
        user_id: user.id,
        category,
        confidence: result?.confidence ?? 0,
        co2_saved: co2,
        points_earned: points,
      }),
      supabase.from("profiles").select("green_points, total_scans, co2_saved").eq("user_id", user.id).single(),
    ]);

    if (profile) {
      await supabase.from("profiles").update({
        green_points: profile.green_points + points,
        total_scans: profile.total_scans + 1,
        co2_saved: Number(profile.co2_saved) + co2,
      }).eq("user_id", user.id);
    }

    setPointsAwarded(points);
    toast.success(`+${points} Green Points! 🌿`);
  }, [user, result]);

  const analyzeImage = useCallback(async (imageData: string) => {
    setAnalyzing(true);
    setResult(null);
    setPointsAwarded(null);

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

      // Save points after showing result (non-blocking)
      if (user && data.category && data.category !== "Unknown") {
        savePoints(data.category);
      }
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  }, [user, savePoints]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    // Use lower quality for faster transfer
    const imageData = canvas.toDataURL("image/jpeg", 0.5);
    setPreviewSrc(imageData);
    analyzeImage(imageData);
  }, [analyzeImage]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    // Compress via canvas for faster upload
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      setPreviewSrc(dataUrl);
      stopCamera();
      analyzeImage(dataUrl);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  }, [analyzeImage, stopCamera]);

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
            {t("scanner.signIn")}
          </Link>
        )}

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden neon-card mb-6">
          <video ref={videoRef} className={`w-full h-full object-cover ${previewSrc && !streaming ? "hidden" : ""}`} playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {previewSrc && !streaming && (
            <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
          )}

          {!streaming && !previewSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
              <Camera className="w-16 h-16 text-primary/40" />
              <button
                onClick={() => startCamera()}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button"
              >
                {t("scanner.openCamera")}
              </button>
            </div>
          )}

          {streaming && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-scan" />
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              </div>
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors z-10"
                aria-label="Switch camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}

          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-display text-sm text-primary">{t("scanner.analyzing")}</p>
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

        <div className="flex gap-3 mb-6">
          {streaming ? (
            <>
              <button
                onClick={capture}
                disabled={analyzing}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button disabled:opacity-50"
              >
                <ScanLine className="w-4 h-4 inline mr-2" />
                {t("scanner.capture")}
              </button>
              <button
                onClick={() => { stopCamera(); setResult(null); setPreviewSrc(null); setPointsAwarded(null); }}
                className="px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-display font-bold text-sm"
              >
                {t("scanner.stop")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => startCamera()}
                disabled={analyzing}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button disabled:opacity-50"
              >
                <Camera className="w-4 h-4 inline mr-2" />
                {t("scanner.openCamera")}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="flex-1 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-display font-bold text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ImagePlus className="w-4 h-4 inline mr-2" />
                {t("scanner.upload")}
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="neon-card rounded-2xl p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", damping: 10 }}
                className="text-5xl mb-3"
              >
                {categoryEmoji[result.category] || "❓"}
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-primary mb-1">{result.category}</h3>
              <p className="text-muted-foreground text-sm mb-1">
                {t("scanner.confidence")}: {result.confidence}%
              </p>
              {result.details && (
                <p className="text-xs text-muted-foreground mb-3">{result.details}</p>
              )}
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>

              <AnimatePresence>
                {pointsAwarded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 py-2 px-4 rounded-lg bg-primary/10 text-primary font-display font-bold text-sm inline-block"
                  >
                    🌿 +{pointsAwarded} Green Points!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Scanner;
