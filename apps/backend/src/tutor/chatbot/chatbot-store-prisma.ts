/**
 * Prisma implementation of ChatbotStorage for the LMS tutor.
 *
 * Port of createDrizzleChatbotStorage() in Desk server/modules/chatbot/chatbot-storage.ts. Same method
 * contract, same results, same company scoping: every query filters on companyId, and companyId is
 * checked by requireCompanyId() before any query runs.
 *
 * The Prisma client is a constructor argument. This file imports no database module and reads no
 * DATABASE_URL, so it loads in tests without a generated client. ChatbotPrismaClient is the structural
 * subset of PrismaClient this storage uses.
 *
 * Model names follow the chatbot models merged into prisma/schema.prisma (AcademyChatbot,
 * AcademyChatbotConversation, AcademyChatbotMessage). If they are renamed, change the three delegate keys below.
 */
import type {
  ChatbotInsert,
  ChatbotMessageRole,
  ChatbotPatch,
  ChatbotRecord,
  ChatbotStorage,
  ConversationInsert,
  ConversationPatch,
  ConversationRecord,
  MessageContentType,
  MessageInsert,
  MessageRecord,
  TicketStatus,
} from "./chatbot-storage.js";
import { requireCompanyId } from "./chatbot-scope.js";

export interface ChatbotRow {
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

export interface ConversationRow {
  id: string;
  companyId: string;
  chatbotId: string;
  sessionId: string;
  channel: string;
  connectAgentAt: Date | null;
  isShownOnHistory: boolean;
  ticketStatus: string;
  pinned: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRow {
  id: string;
  companyId: string;
  conversationId: string;
  role: string;
  message: string;
  contentType: string;
  uiSpec: unknown | null;
  mediaUrl: string | null;
  mediaName: string | null;
  isInternalNote: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/** The subset of a Prisma model delegate this storage calls. A generated delegate satisfies it. */
interface ModelDelegate<Row> {
  create(args: { data: Record<string, unknown> }): Promise<Row>;
  findFirst(args: { where: Record<string, unknown>; select?: Record<string, boolean> }): Promise<Row | null>;
  findMany(args: {
    where: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
  }): Promise<Row[]>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
}

export interface ChatbotPrismaClient {
  academyChatbot: ModelDelegate<ChatbotRow>;
  academyChatbotConversation: ModelDelegate<ConversationRow>;
  academyChatbotMessage: ModelDelegate<MessageRow>;
}

/**
 * Fields a chatbot patch may write. Explicit allow-list: companyId and id are never written, so a patch
 * cannot move a row to another company.
 */
function chatbotPatchData(patch: ChatbotPatch, now: Date): Record<string, unknown> {
  const data: Record<string, unknown> = { updatedAt: now };
  if (patch.title !== undefined) data.title = patch.title;
  if (patch.language !== undefined) data.language = patch.language;
  if (patch.welcomeMessage !== undefined) data.welcomeMessage = patch.welcomeMessage;
  if (patch.instructions !== undefined) data.instructions = patch.instructions;
  if (patch.generativeUiEnabled !== undefined) data.generativeUiEnabled = patch.generativeUiEnabled;
  if (patch.active !== undefined) data.active = patch.active;
  return data;
}

/** Same allow-list as chatbotPatchData, for conversations. companyId, chatbotId and id are never written. */
function conversationPatchData(patch: ConversationPatch, now: Date): Record<string, unknown> {
  const data: Record<string, unknown> = { updatedAt: now };
  if (patch.connectAgentAt !== undefined) data.connectAgentAt = patch.connectAgentAt;
  if (patch.ticketStatus !== undefined) data.ticketStatus = patch.ticketStatus;
  if (patch.pinned !== undefined) data.pinned = patch.pinned;
  if (patch.lastActivityAt !== undefined) data.lastActivityAt = patch.lastActivityAt;
  if (patch.isShownOnHistory !== undefined) data.isShownOnHistory = patch.isShownOnHistory;
  return data;
}

export class PrismaChatbotStorage implements ChatbotStorage {
  private readonly prisma: ChatbotPrismaClient;

  constructor(prisma: ChatbotPrismaClient) {
    this.prisma = prisma;
  }

  async insertChatbot(companyId: string, input: ChatbotInsert, now: Date): Promise<ChatbotRecord> {
    const scope = requireCompanyId(companyId);
    const row = await this.prisma.academyChatbot.create({
      data: {
        companyId: scope,
        title: input.title,
        language: input.language ?? "en",
        welcomeMessage: input.welcomeMessage ?? null,
        instructions: input.instructions ?? null,
        generativeUiEnabled: input.generativeUiEnabled ?? true,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toChatbot(row);
  }

  async findChatbot(companyId: string, id: string): Promise<ChatbotRecord | null> {
    const row = await this.prisma.academyChatbot.findFirst({
      where: { companyId: requireCompanyId(companyId), id },
    });
    return row ? toChatbot(row) : null;
  }

  async listChatbots(companyId: string): Promise<ChatbotRecord[]> {
    const rows = await this.prisma.academyChatbot.findMany({
      where: { companyId: requireCompanyId(companyId) },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toChatbot);
  }

  async updateChatbot(companyId: string, id: string, patch: ChatbotPatch, now: Date): Promise<ChatbotRecord | null> {
    const scope = requireCompanyId(companyId);
    // updateMany carries the tenant in its where clause. Prisma's update() needs a unique key, and
    // (companyId, id) would work too, but updateMany returns a count instead of throwing when nothing matches.
    const { count } = await this.prisma.academyChatbot.updateMany({
      where: { companyId: scope, id },
      data: chatbotPatchData(patch, now),
    });
    if (count === 0) return null;
    const row = await this.prisma.academyChatbot.findFirst({ where: { companyId: scope, id } });
    return row ? toChatbot(row) : null;
  }

  async insertConversation(companyId: string, input: ConversationInsert, now: Date): Promise<ConversationRecord> {
    const scope = requireCompanyId(companyId);
    // connectAgentAt, isShownOnHistory, ticketStatus and pinned take their schema defaults, as in Desk.
    // The composite foreign key (companyId, chatbotId) rejects a chatbot from another company.
    const row = await this.prisma.academyChatbotConversation.create({
      data: {
        companyId: scope,
        chatbotId: input.chatbotId,
        sessionId: input.sessionId,
        channel: input.channel ?? "web",
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toConversation(row);
  }

  async findConversation(companyId: string, id: string): Promise<ConversationRecord | null> {
    const row = await this.prisma.academyChatbotConversation.findFirst({
      where: { companyId: requireCompanyId(companyId), id },
    });
    return row ? toConversation(row) : null;
  }

  async listConversations(companyId: string): Promise<ConversationRecord[]> {
    const rows = await this.prisma.academyChatbotConversation.findMany({
      where: { companyId: requireCompanyId(companyId) },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toConversation);
  }

  async updateConversation(
    companyId: string,
    id: string,
    patch: ConversationPatch,
    now: Date,
  ): Promise<ConversationRecord | null> {
    const scope = requireCompanyId(companyId);
    const { count } = await this.prisma.academyChatbotConversation.updateMany({
      where: { companyId: scope, id },
      data: conversationPatchData(patch, now),
    });
    if (count === 0) return null;
    const row = await this.prisma.academyChatbotConversation.findFirst({ where: { companyId: scope, id } });
    return row ? toConversation(row) : null;
  }

  async insertMessage(companyId: string, input: MessageInsert): Promise<MessageRecord | null> {
    const scope = requireCompanyId(companyId);
    // Check ownership first so a foreign conversation returns null, not a foreign-key error.
    const owner = await this.prisma.academyChatbotConversation.findFirst({
      where: { companyId: scope, id: input.conversationId },
      select: { id: true },
    });
    if (!owner) return null;
    const row = await this.prisma.academyChatbotMessage.create({
      data: {
        companyId: scope,
        conversationId: input.conversationId,
        role: input.role,
        message: input.message,
        contentType: input.contentType ?? "text",
        // A Prisma Json? column rejects a JS null on create. Leaving it out stores SQL NULL, which is what Desk stores.
        uiSpec: input.uiSpec ? structuredClone(input.uiSpec) : undefined,
        mediaUrl: input.mediaUrl ?? null,
        mediaName: input.mediaName ?? null,
        isInternalNote: input.isInternalNote ?? false,
        createdAt: input.createdAt,
      },
    });
    return toMessage(row);
  }

  async listMessages(companyId: string, conversationId: string): Promise<MessageRecord[]> {
    const rows = await this.prisma.academyChatbotMessage.findMany({
      where: { companyId: requireCompanyId(companyId), conversationId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toMessage);
  }

  async markUserMessagesRead(companyId: string, conversationId: string, readAt: Date): Promise<number> {
    const { count } = await this.prisma.academyChatbotMessage.updateMany({
      where: {
        companyId: requireCompanyId(companyId),
        conversationId,
        role: "user",
        readAt: null,
      },
      data: { readAt },
    });
    return count;
  }
}

/** Factory form, matching Desk's createDrizzleChatbotStorage(). Same behaviour as new PrismaChatbotStorage(). */
export function createPrismaChatbotStorage(prisma: ChatbotPrismaClient): ChatbotStorage {
  return new PrismaChatbotStorage(prisma);
}

function toChatbot(row: ChatbotRow): ChatbotRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    title: row.title,
    language: row.language,
    welcomeMessage: row.welcomeMessage,
    instructions: row.instructions,
    generativeUiEnabled: row.generativeUiEnabled,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    chatbotId: row.chatbotId,
    sessionId: row.sessionId,
    channel: row.channel,
    connectAgentAt: row.connectAgentAt,
    isShownOnHistory: row.isShownOnHistory,
    ticketStatus: row.ticketStatus as TicketStatus,
    pinned: row.pinned,
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    conversationId: row.conversationId,
    role: row.role as ChatbotMessageRole,
    message: row.message,
    contentType: row.contentType as MessageContentType,
    uiSpec: (row.uiSpec ?? null) as Record<string, unknown> | null,
    mediaUrl: row.mediaUrl,
    mediaName: row.mediaName,
    isInternalNote: row.isInternalNote,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}
