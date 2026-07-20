import type { PersonaKey } from "@/types/account";

/** SPEC.md §11.6.2 — short role labels for profile headings. */
const PERSONA_ROLE_LABELS = {
  backend: "技術メンター",
  frontend: "UI・体験",
  reviewer: "品質チェック",
  pm: "進行・優先順位",
} as const satisfies Record<PersonaKey, string>;

export function getPersonaRoleLabel(personaKey: PersonaKey): string {
  return PERSONA_ROLE_LABELS[personaKey];
}
