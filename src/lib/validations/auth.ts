import { z } from "zod";

export const magicLinkEmailSchema = z
  .string()
  .trim()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください");

export type MagicLinkEmail = z.infer<typeof magicLinkEmailSchema>;

export function parseMagicLinkEmail(
  value: unknown,
): { success: true; email: string } | { success: false; message: string } {
  const result = magicLinkEmailSchema.safeParse(value);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "入力が不正です";
    return { success: false, message };
  }
  return { success: true, email: result.data };
}
