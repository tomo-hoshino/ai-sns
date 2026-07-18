import { countUnicodeCodePoints } from "@/lib/validations/common";

/** Truncates a string to at most `maxLength` Unicode code points. */
export function clampUnicodeText(value: string, maxLength: number): string {
  if (maxLength < 0) {
    return "";
  }

  if (countUnicodeCodePoints(value) <= maxLength) {
    return value;
  }

  return Array.from(value).slice(0, maxLength).join("");
}
