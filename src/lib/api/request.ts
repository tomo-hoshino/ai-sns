/**
 * Request helpers for Route Handlers.
 * Content-Type and JSON parse failures become validation errors at the caller.
 */

export type ParseJsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "content_type" | "invalid_json" };

export function isJsonContentType(contentType: string | null): boolean {
  if (contentType === null) {
    return false;
  }

  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json";
}

export async function parseJsonBody(
  request: Request,
): Promise<ParseJsonBodyResult> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, reason: "content_type" };
  }

  try {
    const value: unknown = await request.json();
    return { ok: true, value };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
