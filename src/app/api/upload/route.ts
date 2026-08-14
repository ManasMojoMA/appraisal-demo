import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Evidence uploads.
 *
 * Previously these went to a Supabase Storage bucket. Auth moved to Firebase to
 * get off Supabase's two-project limit, and Cloud Storage for Firebase needs
 * billing enabled on a new project — which is not worth turning on for a demo
 * that exists to be thrown away.
 *
 * So the file is stored inline as a data URL in EvidenceFile.fileUrl, which is
 * already a String column. That keeps the feature genuinely working end to end —
 * attach a document to a self-appraisal entry, see it listed, open it again —
 * rather than degrading it to a filename with a dead link.
 *
 * The trade-off is size. Base64 inflates by roughly a third and Neon's free tier
 * holds 0.5 GB, so the ceiling drops from 5 MB to 1 MB. For a demo where the
 * point is showing that evidence attaches to an entry, that is enough; anything
 * real should use object storage.
 */

/** Base64 costs ~33% on top, so 1 MB in is ~1.4 MB stored. */
const MAX_SIZE = 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Uploads write to the database, so they need a session. The original route
    // had no auth check at all — anyone who found the URL could fill the bucket.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          error:
            "Files are capped at 1MB in this demo, because attachments are stored " +
            "inline rather than in object storage.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      fileUrl: dataUrl,
      fileName: file.name,
      fileType: contentType,
      fileSize: file.size,
    });
  } catch (error: unknown) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
