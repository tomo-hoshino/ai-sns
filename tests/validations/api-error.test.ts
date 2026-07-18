import { describe, expect, it } from "vitest";

import { apiErrorResponseSchema } from "@/lib/validations/common";

describe("apiErrorResponseSchema", () => {
  it("accepts a VALIDATION_ERROR response with details", () => {
    const result = apiErrorResponseSchema.safeParse({
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
        details: [
          {
            path: "content",
            message: "投稿は300文字以内で入力してください。",
          },
        ],
      },
      requestId: "7b0883a1-6b0f-4da8-b66d-ad270f5634cd",
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown error codes and unknown keys", () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: "NOT_A_REAL_CODE",
          message: "失敗しました。",
        },
        requestId: "7b0883a1-6b0f-4da8-b66d-ad270f5634cd",
      }).success,
    ).toBe(false);

    expect(
      apiErrorResponseSchema.safeParse({
        error: {
          code: "INTERNAL_ERROR",
          message: "失敗しました。",
          secret: "should-not-pass",
        },
        requestId: "7b0883a1-6b0f-4da8-b66d-ad270f5634cd",
      }).success,
    ).toBe(false);
  });
});
