import { supabase } from "@/integrations/supabase/client";

export type WasteCategory = "Plastic" | "Paper" | "Metal" | "Glass" | "Unknown";

export interface WasteAnalysisResult {
  category: WasteCategory;
  confidence: number;
  details?: string;
}

const MAX_IMAGE_DIMENSION = 720;
const JPEG_QUALITY = 0.58;

export const getBackendStatusMessage = (message?: string) => {
  const text = (message || "").toLowerCase();
  if (text.includes("failed to fetch") || text.includes("networkerror")) {
    return "Cannot reach the backend right now. Please resume Lovable Cloud, then try again.";
  }
  return message || "AI analysis failed. Please try again.";
};

export const cleanBase64Image = (image: string) => {
  const trimmed = image.trim();
  if (!trimmed.startsWith("data:image/")) {
    throw new Error("Invalid image format. Please capture or upload a JPEG/PNG image.");
  }

  const [header, payload] = trimmed.split(",");
  if (!header || !payload) throw new Error("Image conversion failed. Please try another photo.");

  const compactPayload = payload.replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compactPayload)) {
    throw new Error("Image conversion failed. The Base64 data is invalid.");
  }

  return `${header},${compactPayload}`;
};

export const imageFileToCompressedDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d", { alpha: false })?.drawImage(img, 0, 0, width, height);
      resolve(cleanBase64Image(canvas.toDataURL("image/jpeg", JPEG_QUALITY)));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image. Please try another photo."));
    };

    img.src = objectUrl;
  });

export const videoFrameToCompressedDataUrl = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
  const width = video.videoWidth || 720;
  const height = video.videoHeight || 540;
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d", { alpha: false })?.drawImage(video, 0, 0, canvas.width, canvas.height);
  return cleanBase64Image(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
};

export const analyzeWasteImage = async (imageData: string): Promise<WasteAnalysisResult> => {
  const image = cleanBase64Image(imageData);
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("AI analysis timed out. Please try a clearer, closer photo.")), 20000);
  });

  const request = supabase.functions.invoke("classify-waste", { body: { image } }).then(({ data, error }) => {
    if (error) throw new Error(getBackendStatusMessage(error.message));
    if (!data?.category) throw new Error("The AI response was empty. Please scan again.");
    return {
      category: data.category || "Unknown",
      confidence: Number(data.confidence) || 0,
      details: data.details || "",
    } as WasteAnalysisResult;
  });

  return Promise.race([request, timeout]);
};
