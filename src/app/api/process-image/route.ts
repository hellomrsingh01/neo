import { NextRequest, NextResponse } from "next/server";

type ProcessImagePayload = {
  productId?: string;
  sourceBucket?: string;
  sourcePath?: string;
  targetBucket?: string;
  thumbnailBucket?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProcessImagePayload;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Missing server environment configuration." },
        { status: 200 },
      );
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/process-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(body),
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const errorMessage =
        (payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string" &&
          (payload as { error: string }).error) ||
        `Edge function failed with status ${response.status}`;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 200 },
      );
    }

    return NextResponse.json(payload ?? { success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process image.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 200 },
    );
  }
}
