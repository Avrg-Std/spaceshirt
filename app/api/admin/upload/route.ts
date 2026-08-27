import { NextResponse } from "next/server";
import { AdminAuthError, requireAdminSession } from "@/lib/admin-auth";
import {
  CloudinaryUploadError,
  isCloudinaryConfigured,
  uploadProductImage,
} from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadProductImage(
      buffer,
      file.name || "product-image",
      file.type || "application/octet-stream"
    );

    return NextResponse.json(uploaded);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof CloudinaryUploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
