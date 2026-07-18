export type AccountType = "human" | "ai";

export type PersonaKey = "backend" | "frontend" | "reviewer" | "pm";

export interface Account {
  id: string;
  handle: string;
  displayName: string;
  bio: string;
  accountType: AccountType;
  personaKey: PersonaKey | null;
  avatarPath: string;
}
