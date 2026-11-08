/**
 * Storage contract for the chatbot module.
 *
 * Every method takes companyId as its first argument and only reads or writes rows that carry it.
 * The service depends on the ChatbotStorage interface alone, so tests use createMemoryChatbotStorage()
 * and the database is never touched. The database implementation is in chatbot-store-prisma.ts.
 *
 * LMS port note: the Drizzle implementation (createDrizzleChatbotStorage) was removed from this copy.
 * Interface, types and the in-memory store are unchanged from the Desk file.
 */
import { randomUUID } from "node:crypto";
import { requireCompanyId } from "./chatbot-scope.js";

export type ChatbotMessageRole = "user" | "assistant";
export type TicketStatus = "new" | "closed";
export type MessageContentType = "text" | "titan-ui";

export interface ChatbotRecord {
  id: string;
  companyId: string;
  title: string;
  language: string;
  welcomeMessage: string | null;
  instructions: string | null;
  generativeUiEnabled: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotInsert {
  title: string;
  language?: string;
  welcomeMessage?: string | null;
  instructions?: string | null;
  generativeUiEnabled?: boolean;
  active?: boolean;
}

/** Fields a caller may change. companyId and id are never patchable. */
export type ChatbotPatch = Partial<ChatbotInsert>;

export interface ConversationRecord {
  id: string;
  companyId: string;
  chatbotId: string;
  sessionId: string;
  channel: string;
  /** Set when a human agent takes over. Null while the bot is handling the chat. */
  connectAgentAt: Date | null;
  isShownOnHistory: boolean;
  ticketStatus: TicketStatus;
  pinned: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationInsert {
  chatbotId: string;
  sessionId: string;
  channel?: string;
}

/** Fields a caller may change. companyId, chatbotId and id are never patchable. */
export interface ConversationPatch {
  connectAgentAt?: Date | null;
  ticketStatus?: TicketStatus;
  pinned?: boolean;
  lastActivityAt?: Date;
  isShownOnHistory?: boolean;
}

export interface MessageRecord {
  id: string;
  companyId: string;
  conversationId: string;
  role: ChatbotMessageRole;
  message: string;
  contentType: MessageContentType;
  uiSpec: Record<string, unknown> | null;
  mediaUrl: string | null;
  mediaName: string | null;
  isInternalNote: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface MessageInsert {
  conversationId: string;
  role: ChatbotMessageRole;
  message: string;
  contentType?: MessageContentType;
  uiSpec?: Record<string, unknown> | null;
  mediaUrl?: string | null;
  mediaName?: string | null;
  isInternalNote?: boolean;
  createdAt: Date;
}

export interface ChatbotStorage {
  insertChatbot(companyId: string, input: ChatbotInsert, now: Date): Promise<ChatbotRecord>;
  findChatbot(companyId: string, id: string): Promise<ChatbotRecord | null>;
  listChatbots(companyId: string): Promise<ChatbotRecord[]>;
  updateChatbot(companyId: string, id: string, patch: ChatbotPatch, now: Date): Promise<ChatbotRecord | null>;

  insertConversation(companyId: string, input: ConversationInsert, now: Date): Promise<ConversationRecord>;
  findConversation(companyId: string, id: string): Promise<ConversationRecord | null>;
  listConversations(companyId: string): Promise<ConversationRecord[]>;
  updateConversation(
    companyId: string,
    id: string,
    patch: ConversationPatch,
    now: Date,
  ): Promise<ConversationRecord | null>;

  /** Returns null when the conversation does not belong to companyId. */
  insertMessage(companyId: string, input: MessageInsert): Promise<MessageRecord | null>;
  listMessages(companyId: string, conversationId: string): Promise<MessageRecord[]>;
  /** Sets read_at on the user messages of one conversation. Returns how many rows changed. */
  markUserMessagesRead(companyId: string, conversationId: string, readAt: Date): Promise<number>;
}

/** Copies a record so callers cannot mutate stored state. */
function copy<T>(value: T): T {
  return structuredClone(value);
}

export function createMemoryChatbotStorage(): ChatbotStorage {
  // Outer key is companyId. Every lookup starts there, so rows are isolated by tenant.
  const chatbots = new Map<string, Map<string, ChatbotRecord>>();
  const conversations = new Map<string, Map<string, ConversationRecord>>();
  const messages = new Map<string, Map<string, MessageRecord>>();

  const bucket = <T>(store: Map<string, Map<string, T>>, companyId: string): Map<string, T> => {
    let rows = store.get(companyId);
    if (!rows) {
      rows = new Map<string, T>();
      store.set(companyId, rows);
    }
    return rows;
  };
  const readBucket = <T>(store: Map<string, Map<string, T>>, companyId: string): Map<string, T> =>
    store.get(companyId) ?? new Map<string, T>();

  return {
    async insertChatbot(companyId, input, now) {
      const scope = requireCompanyId(companyId);
      const record: ChatbotRecord = {
        id: randomUUID(),
        companyId: scope,
        title: input.title,
        language: input.language ?? "en",
        welcomeMessage: input.welcomeMessage ?? null,
        instructions: input.instructions ?? null,
        generativeUiEnabled: input.generativeUiEnabled ?? true,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      bucket(chatbots, scope).set(record.id, record);
      return copy(record);
    },

    async findChatbot(companyId, id) {
      const row = readBucket(chatbots, requireCompanyId(companyId)).get(id);
      return row ? copy(row) : null;
    },

    async listChatbots(companyId) {
      return [...readBucket(chatbots, requireCompanyId(companyId)).values()].map(copy);
    },

    async updateChatbot(companyId, id, patch, now) {
      const rows = bucket(chatbots, requireCompanyId(companyId));
      const row = rows.get(id);
      if (!row) return null;
      // Explicit allow-list: a patch can never move a row to another company.
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.language !== undefined) row.language = patch.language;
      if (patch.welcomeMessage !== undefined) row.welcomeMessage = patch.welcomeMessage;
      if (patch.instructions !== undefined) row.instructions = patch.instructions;
      if (patch.generativeUiEnabled !== undefined) row.generativeUiEnabled = patch.generativeUiEnabled;
      if (patch.active !== undefined) row.active = patch.active;
      row.updatedAt = now;
      return copy(row);
    },

    async insertConversation(companyId, input, now) {
      const scope = requireCompanyId(companyId);
      const record: ConversationRecord = {
        id: randomUUID(),
        companyId: scope,
        chatbotId: input.chatbotId,
        sessionId: input.sessionId,
        channel: input.channel ?? "web",
        connectAgentAt: null,
        isShownOnHistory: true,
        ticketStatus: "new",
        pinned: false,
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      };
      bucket(conversations, scope).set(record.id, record);
      return copy(record);
    },

    async findConversation(companyId, id) {
      const row = readBucket(conversations, requireCompanyId(companyId)).get(id);
      return row ? copy(row) : null;
    },

    async listConversations(companyId) {
      return [...readBucket(conversations, requireCompanyId(companyId)).values()].map(copy);
    },

    async updateConversation(companyId, id, patch, now) {
      const rows = bucket(conversations, requireCompanyId(companyId));
      const row = rows.get(id);
      if (!row) return null;
      if (patch.connectAgentAt !== undefined) row.connectAgentAt = patch.connectAgentAt;
      if (patch.ticketStatus !== undefined) row.ticketStatus = patch.ticketStatus;
      if (patch.pinned !== undefined) row.pinned = patch.pinned;
      if (patch.lastActivityAt !== undefined) row.lastActivityAt = patch.lastActivityAt;
      if (patch.isShownOnHistory !== undefined) row.isShownOnHistory = patch.isShownOnHistory;
      row.updatedAt = now;
      return copy(row);
    },

    async insertMessage(companyId, input) {
      const scope = requireCompanyId(companyId);
      if (!readBucket(conversations, scope).has(input.conversationId)) return null;
      const record: MessageRecord = {
        id: randomUUID(),
        companyId: scope,
        conversationId: input.conversationId,
        role: input.role,
        message: input.message,
        contentType: input.contentType ?? "text",
        uiSpec: input.uiSpec ? structuredClone(input.uiSpec) : null,
        mediaUrl: input.mediaUrl ?? null,
        mediaName: input.mediaName ?? null,
        isInternalNote: input.isInternalNote ?? false,
        readAt: null,
        createdAt: input.createdAt,
      };
      bucket(messages, scope).set(record.id, record);
      return copy(record);
    },

    async listMessages(companyId, conversationId) {
      return [...readBucket(messages, requireCompanyId(companyId)).values()]
        .filter((row) => row.conversationId === conversationId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(copy);
    },

    async markUserMessagesRead(companyId, conversationId, readAt) {
      let changed = 0;
      for (const row of readBucket(messages, requireCompanyId(companyId)).values()) {
        if (row.conversationId === conversationId && row.role === "user" && row.readAt === null) {
          row.readAt = readAt;
          changed += 1;
        }
      }
      return changed;
    },
  };
}

