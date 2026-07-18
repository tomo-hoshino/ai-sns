import type { Account, PersonaKey } from "@/types/account";

const PERSONA_BORDER_CLASS = {
  backend: "border-l-ai-backend",
  frontend: "border-l-ai-frontend",
  reviewer: "border-l-ai-reviewer",
  pm: "border-l-ai-pm",
} as const satisfies Record<PersonaKey, string>;

const PERSONA_BADGE_CLASS = {
  backend: "bg-ai-backend text-ai-backend-foreground",
  frontend: "bg-ai-frontend text-ai-frontend-foreground",
  reviewer: "bg-ai-reviewer text-ai-reviewer-foreground",
  pm: "bg-ai-pm text-ai-pm-foreground",
} as const satisfies Record<PersonaKey, string>;

const PERSONA_MENTION_CLASS = {
  backend: "text-ai-backend",
  frontend: "text-ai-frontend",
  reviewer: "text-ai-reviewer",
  pm: "text-ai-pm",
} as const satisfies Record<PersonaKey, string>;

export function getAuthorBorderClass(author: Account): string {
  if (author.accountType !== "ai" || author.personaKey === null) {
    return "border-l-border";
  }

  return PERSONA_BORDER_CLASS[author.personaKey];
}

export function getAiBadgeClass(personaKey: PersonaKey): string {
  return PERSONA_BADGE_CLASS[personaKey];
}

export function getMentionClass(account: Account): string {
  if (account.accountType !== "ai" || account.personaKey === null) {
    return "text-primary";
  }

  return PERSONA_MENTION_CLASS[account.personaKey];
}
