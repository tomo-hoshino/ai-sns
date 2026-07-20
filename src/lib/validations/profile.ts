import { z } from "zod";

import { accountSchema } from "@/lib/validations/post";

/** ARCHITECTURE.md §6.2 / DB CHECK: lowercase, 1–32 chars, kebab segments. */
export const profileHandleSchema = z
  .string({
    error: "有効なhandleを指定してください。",
  })
  .min(1, "有効なhandleを指定してください。")
  .max(32, "handleは32文字以内で指定してください。")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "handleは小文字の英数字とハイフンのみ使用できます。",
  );

export const getProfileParamsSchema = z.strictObject({
  handle: profileHandleSchema,
});

export const getProfileResponseSchema = z.strictObject({
  data: accountSchema,
});

export type GetProfileParamsParsed = z.output<typeof getProfileParamsSchema>;
export type GetProfileResponseParsed = z.output<
  typeof getProfileResponseSchema
>;
