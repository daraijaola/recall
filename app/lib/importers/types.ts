import type { MemoryType, Source } from "../types";

export type ParsedRole = "user" | "assistant" | "system" | "other";

export interface ParsedMessage {
  role: ParsedRole;
  content: string;
  createdAt?: string;
}

export interface ParsedConversation {
  id: string;
  title: string;
  source: Source;
  messages: ParsedMessage[];
  createdAt?: string;
}

export interface ExtractedMemoryDraft {
  type: MemoryType;
  content: string;
  confidence: number;
  validFrom: string;
  validUntil: string | null;
  conversationId: string;
  conversationTitle: string;
}
