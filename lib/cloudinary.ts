import "server-only";

import { v2 as cloudinary } from "cloudinary";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export class CloudinaryUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.status = status;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new CloudinaryUploadError(
      `Missing required environment variable: ${name}`,
      500
    );
  }
  return value;
}

function getUploadFolder(): string {
  return process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "spaceshirt/products";
}

function ensureConfigured(): void {
  cloudinary.config({
    cloud_name: requiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requiredEnv("CLOUDINARY_API_KEY"),
    api_secret: requiredEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

export type UploadedImage = {
  url: string;
  publicId: string;
};

export async function uploadProductImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<UploadedImage> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new CloudinaryUploadError(
      "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.",
      400
    );
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new CloudinaryUploadError("File too large. Maximum size is 5 MB.", 413);
  }

  ensureConfigured();

  const folder = getUploadFolder();
  const publicIdBase = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 80);

  const result = await new Promise<UploadedImage>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicIdBase || undefined,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url) {
          reject(
            new CloudinaryUploadError(
              error?.message ?? "Cloudinary upload failed",
              500
            )
          );
          return;
        }

        resolve({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      }
    );

    upload.end(buffer);
  });

  return result;
}
