import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Camera, ScanLine, AlertCircle } from "lucide-react";
import { useRef, useState, useCallback } from "react";

const Scanner = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ category: string; confidence: number } | null>(null);

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
    } catch (err) {
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

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    // Mock result — AI integration coming with Lovable Cloud
    const categories = ["Plastic", "Paper", "Metal", "Glass"];
    setResult({
      category: categories[Math.floor(Math.random() * categories.length)],
      confidence: 85 + Math.floor(Math.random() * 14),
    });
  }, []);

  const categoryEmoji: Record<string, string> = {
    Plastic: "♻️",
    Paper: "📄",
    Metal: "🔩",
    Glass: "🫙",
  };

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="font-display text-3xl font-bold text-center mb-2 gradient-text">
          {t("scanner.title")}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">{t("scanner.instruction")}</p>

        {/* Camera viewport */}
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
                {t("scanner.capture").split("&")[0].trim()} Camera
              </button>
            </div>
          )}

          {streaming && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-scan" />
              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
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
              className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm neon-button"
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

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neon-card rounded-2xl p-6 text-center"
          >
            <div className="text-5xl mb-3">{categoryEmoji[result.category]}</div>
            <h3 className="font-display text-2xl font-bold text-primary mb-1">{result.category}</h3>
            <p className="text-muted-foreground text-sm">
              Confidence: {result.confidence}%
            </p>
            <div className="mt-4 w-full bg-secondary rounded-full h-2 overflow-hidden">
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
