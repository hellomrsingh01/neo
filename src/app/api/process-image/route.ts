import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ProcessImagePayload = {
  productId?: string;
  sourceBucket?: string;
  sourcePath?: string;
  targetBucket?: string;
  thumbnailBucket?: string;
};

const MAIN_MAX_BYTES = 500 * 1024;
const MAIN_QUALITIES = [85, 75, 65, 55, 45, 35];
const THUMB_QUALITIES = [75, 65, 55, 45, 35];

const sanitizeBaseName = (input: string) =>
  input.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

const encodeWebpWithLimit = async (
  inputBuffer: Buffer,
  width: number,
  height: number,
  qualities: number[],
  maxBytes?: number,
) => {
  let bestAttempt: Buffer | null = null;

  for (const quality of qualities) {
    const output = await sharp(inputBuffer)
      .resize(width, height, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    if (!bestAttempt || output.length < bestAttempt.length) {
      bestAttempt = output;
    }

    if (!maxBytes || output.length <= maxBytes) {
      return output;
    }
  }

  if (!bestAttempt) {
    throw new Error("Failed to encode image.");
  }
  return bestAttempt;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProcessImagePayload;
    const supabaseUrl =
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing server environment configuration." },
        { status: 200 },
      );
    }

    const {
      productId,
      sourceBucket,
      sourcePath,
      targetBucket,
      thumbnailBucket,
    } = body;
    if (
      !productId ||
      !sourceBucket ||
      !sourcePath ||
      !targetBucket ||
      !thumbnailBucket
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: productId, sourceBucket, sourcePath, targetBucket, thumbnailBucket.",
        },
        { status: 200 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: sourceFile, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);
    if (downloadError || !sourceFile) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download source image: ${
            downloadError?.message ?? "Unknown error"
          }`,
        },
        { status: 200 },
      );
    }

    const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());
    const metadata = await sharp(sourceBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { success: false, error: "Could not read source image dimensions." },
        { status: 200 },
      );
    }

    if (metadata.width < 300 || metadata.height < 300) {
      return NextResponse.json(
        {
          success: false,
          error: "Image too small. Minimum dimensions are 300x300.",
        },
        { status: 200 },
      );
    }

    const mainBuffer = await encodeWebpWithLimit(
      sourceBuffer,
      1200,
      1200,
      MAIN_QUALITIES,
      MAIN_MAX_BYTES,
    );
    if (mainBuffer.length > MAIN_MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Processed image exceeds 500KB even at lowest supported quality.",
        },
        { status: 200 },
      );
    }

    const thumbBuffer = await encodeWebpWithLimit(
      sourceBuffer,
      400,
      400,
      THUMB_QUALITIES,
    );

    const sourceFilename = sourcePath.split("/").pop() ?? "image";
    const safeBase = sanitizeBaseName(sourceFilename);
    const timestamp = Date.now();
    const processedPath = `${productId}/${safeBase}-${timestamp}.webp`;
    const thumbnailPath = `${productId}/thumb_${safeBase}-${timestamp}.webp`;

    const { error: mainUploadError } = await supabase.storage
      .from(targetBucket)
      .upload(processedPath, mainBuffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (mainUploadError) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload processed image: ${mainUploadError.message}`,
        },
        { status: 200 },
      );
    }

    const { error: thumbUploadError } = await supabase.storage
      .from(thumbnailBucket)
      .upload(thumbnailPath, thumbBuffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (thumbUploadError) {
      await supabase.storage.from(targetBucket).remove([processedPath]);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upload thumbnail: ${thumbUploadError.message}`,
        },
        { status: 200 },
      );
    }

    await supabase.storage.from(sourceBucket).remove([sourcePath]);

    return NextResponse.json(
      { success: true, processedPath, thumbnailPath },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process image.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 200 },
    );
  }
}
