import { supabase } from "@/integrations/supabase/client";

export type WasteCategory = "Plastic" | "Paper" | "Metal" | "Glass" | "Unknown";

export interface WasteAnalysisResult {
  category: WasteCategory;
  confidence: number;
  details?: string;
}

const MAX_IMAGE_DIMENSION = 720;
const JPEG_QUALITY = 0.58;
const AI_TIMEOUT_MS = 25_000;
const VALID_IMAGE_HEADER = /^data:image\/(png|jpe?g|webp);base64$/i;
const ALLOWED_CATEGORIES: WasteCategory[] = ["Plastic", "Paper", "Metal", "Glass", "Unknown"];

export const getBackendStatusMessage = (message?: string) => {
  const text = (message || "").toLowerCase();
  if (text.includes("failed to fetch") || text.includes("networkerror") || text.includes("timeout")) {
    return "Cannot reach the backend right now. Please resume Lovable Cloud or check your connection, then try again.";
  }
  return message || "AI analysis failed. Please try again.";
};

export const cleanBase64Image = (image: string) => {
  const trimmed = (image || "").trim();
  const commaIndex = trimmed.indexOf(",");

  if (!trimmed.startsWith("data:image/") || commaIndex === -1) {
    throw new Error("Invalid image format. Please capture or upload a JPEG/PNG image.");
  }

  const rawHeader = trimmed.slice(0, commaIndex).replace("image/jpg", "image/jpeg");
  const header = rawHeader.toLowerCase();
  let payload = trimmed.slice(commaIndex + 1).replace(/\s/g, "");

  if (!VALID_IMAGE_HEADER.test(header)) {
    throw new Error("Unsupported image type. Please use JPEG, PNG, or WebP.");
  }

  if (!payload || payload.length < 100) {
    throw new Error("Image conversion failed. Please take a clearer photo and try again.");
  }

  const remainder = payload.length % 4;
  if (remainder === 1) throw new Error("Image conversion failed. The Base64 data is invalid.");
  if (remainder > 1) payload = payload.padEnd(payload.length + (4 - remainder), "=");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) {
    throw new Error("Image conversion failed. The Base64 data is invalid.");
  }

  return `${header},${payload}`;
};

const canvasToDataUrl = (canvas: HTMLCanvasElement): Promise<string> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed. Please try again."));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve(cleanBase64Image(String(reader.result)));
        reader.onerror = () => reject(new Error("Image conversion failed. Please try again."));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

const drawSourceToCanvas = (source: CanvasImageSource, sourceWidth: number, sourceHeight: number, canvas = document.createElement("canvas")) => {
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Your browser could not prepare the image canvas.");

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return canvas;
};

export const imageFileToCompressedDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) throw new Error("Please select a valid image file.");

  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = drawSourceToCanvas(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      return await canvasToDataUrl(canvas);
    } catch (error) {
      console.warn("[EcoLens AI] createImageBitmap failed, falling back to HTMLImageElement", error);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = drawSourceToCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        resolve(await canvasToDataUrl(canvas));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image. Please try another photo."));
    };

    img.src = objectUrl;
  });
};

export const videoFrameToCompressedDataUrl = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    throw new Error("Camera is still starting. Please wait one second and capture again.");
  }

  const renderedCanvas = drawSourceToCanvas(video, video.videoWidth, video.videoHeight, canvas);
  return canvasToDataUrl(renderedCanvas);
};

export const analyzeWasteImage = async (imageData: string): Promise<WasteAnalysisResult> => {
  const image = cleanBase64Image(imageData);
  const startedAt = performance.now();
  let timeoutId: number | undefined;

  console.debug("[EcoLens AI] Sending image to AI", { sizeKB: Math.round(image.length / 1024) });

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("AI analysis timed out. Please try a clearer, closer photo.")), AI_TIMEOUT_MS);
  });

  try {
    const { data, error } = await Promise.race([
      supabase.functions.invoke("classify-waste", { body: { image } }),
      timeout,
    ]);

    if (error) throw new Error(getBackendStatusMessage(error.message));
    if (data?.error) throw new Error(getBackendStatusMessage(data.error));
    if (!data?.category) throw new Error("The AI response was empty. Please scan again.");

    const category = ALLOWED_CATEGORIES.includes(data.category) ? data.category : "Unknown";
    const confidence = Math.max(0, Math.min(100, Number(data.confidence) || 0));

    console.debug("[EcoLens AI] AI analysis completed", {
      category,
      confidence,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return {
      category,
      confidence,
      details: typeof data.details === "string" ? data.details : "",
    };
  } catch (error: any) {
    console.error("[EcoLens AI] AI analysis failed", error);
    throw new Error(getBackendStatusMessage(error?.message));
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};
