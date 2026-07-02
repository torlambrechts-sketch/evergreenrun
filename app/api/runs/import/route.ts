import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { importRunFromUpload } from "@/lib/upload/import-run";
import { MAX_UPLOAD_BYTES, UploadError } from "@/lib/upload/validate";
import { ParseError } from "@/lib/parsers/types";

export const runtime = "nodejs"; // needs node:crypto / Buffer for hashing + FIT

function redirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect(request, "/login");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(request, "/runs/import?error=Could+not+read+the+upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return redirect(request, "/runs/import?error=Choose+a+file+to+import.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return redirect(request, "/runs/import?error=That+file+is+too+large+(max+5+MB).");
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await importRunFromUpload(file.name, bytes);
    return redirect(
      request,
      result.status === "duplicate" ? "/runs?import=duplicate" : "/runs?import=ok",
    );
  } catch (err) {
    if (err instanceof UploadError || err instanceof ParseError) {
      return redirect(request, `/runs/import?error=${encodeURIComponent(err.message)}`);
    }
    // Never leak internals; log server-side only (no health data involved).
    console.error("[import] unexpected error", err);
    return redirect(request, "/runs/import?error=Something+went+wrong+importing+that+file.");
  }
}
