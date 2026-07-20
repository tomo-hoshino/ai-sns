import { describe, expect, it } from "vitest";

import { getPersonaRoleLabel } from "@/features/profiles/utils/persona-role-labels";
import type { PersonaKey } from "@/types/account";

describe("getPersonaRoleLabel", () => {
  it.each([
    ["backend", "技術メンター"],
    ["frontend", "UI・体験"],
    ["reviewer", "品質チェック"],
    ["pm", "進行・優先順位"],
  ] as const satisfies ReadonlyArray<readonly [PersonaKey, string]>)(
    "returns SPEC label for %s",
    (personaKey, expected) => {
      expect(getPersonaRoleLabel(personaKey)).toBe(expected);
    },
  );
});
