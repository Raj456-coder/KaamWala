import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage } from "@/lib/firebase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const validateFile = (file: File): { valid: boolean; error: string | null } => {
  if (!file) return { valid: false, error: "No file selected." };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: "File size must be less than 5MB." };
  const isImage = file.type.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  if (!isImage && !isPDF) return { valid: false, error: "Only images and PDF files are allowed." };
  return { valid: true, error: null };
};

export async function uploadFile(
  uid: string,
  fileName: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!storage) {
    return { url: null, error: "Storage service is not available." };
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    return { url: null, error: validation.error };
  }

  try {
    const storageRef = ref(storage, `workers/${uid}/documents/${fileName}`);
    const uploadResult: UploadResult = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(uploadResult.ref);
    return { url, error: null };
  } catch (error: unknown) {
    return { url: null, error: (error as Error).message || "File upload failed." };
  }
}

export async function uploadWorkerDocuments(
  uid: string,
  documents: Record<string, File | null>
): Promise<{ urls: Record<string, string>; error: string | null }> {
  const urls: Record<string, string> = {};

  for (const [key, file] of Object.entries(documents)) {
    if (!file) continue;
    const fileName = `${key}_${Date.now()}_${file.name}`;
    const { url, error } = await uploadFile(uid, fileName, file);
    if (error) return { urls, error };
    urls[key] = url!;
  }

  return { urls, error: null };
}

