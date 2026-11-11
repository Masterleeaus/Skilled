/**
 * Tutor conversation retention. Deletes tutor conversations older than the retention period, together with their
 * messages and tool audit rows.
 *
 * - Age is measured from conversation createdAt. A conversation is deleted when createdAt is strictly before the cutoff.
 * - Runs across all organisations. It is a platform job, so it takes no companyId.
 * - Work is done in batches. Each batch selects up to batchSize expired conversation ids, then deletes their audit rows,
 *   messages and conversations in one transaction. The loop stops when a batch comes back short.
 * - The Prisma client is passed in. Nothing here constructs PrismaClient.
 */

export const TUTOR_RETENTION_DAYS = 30;
export const TUTOR_RETENTION_BATCH_SIZE = 500;

const DAY_MS = 86_400_000;

export interface TutorRetentionClient {
  academyTutorConversation: {
    findMany(args: {
      where: { createdAt: { lt: Date } };
      select: { id: true };
      orderBy: { createdAt: 'asc' };
      take: number;
    }): Promise<Array<{ id: string }>>;
    deleteMany(args: { where: { id: { in: string[] }; createdAt: { lt: Date } } }): Promise<{ count: number }>;
  };
  academyTutorMessage: {
    deleteMany(args: { where: { conversationId: { in: string[] } } }): Promise<{ count: number }>;
  };
  academyTutorToolAudit: {
    deleteMany(args: { where: { conversationId: { in: string[] } } }): Promise<{ count: number }>;
  };
  $transaction<T extends unknown[]>(operations: unknown[]): Promise<T>;
}

export interface TutorRetentionOptions {
  /** Retention period in days. Defaults to 30. Must be a positive integer. */
  retentionDays?: number;
  /** Reference time. Defaults to the current time. Exposed so the cutoff can be fixed in tests. */
  now?: Date;
  /** Conversations per batch. Defaults to 500. Must be a positive integer. */
  batchSize?: number;
}

export interface TutorRetentionResult {
  cutoff: Date;
  batches: number;
  conversations: number;
  messages: number;
  toolAudits: number;
}

function requirePositiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`);
  }
  return value;
}

/** The instant before which tutor conversations are expired. */
export function tutorRetentionCutoff(now: Date, retentionDays: number = TUTOR_RETENTION_DAYS): Date {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new RangeError('now must be a valid Date');
  }
  const days = requirePositiveInteger(retentionDays, 'retentionDays');
  return new Date(now.getTime() - days * DAY_MS);
}

export async function purgeExpiredTutorData(
  client: TutorRetentionClient,
  options: TutorRetentionOptions = {},
): Promise<TutorRetentionResult> {
  const retentionDays = requirePositiveInteger(options.retentionDays ?? TUTOR_RETENTION_DAYS, 'retentionDays');
  const batchSize = requirePositiveInteger(options.batchSize ?? TUTOR_RETENTION_BATCH_SIZE, 'batchSize');
  const cutoff = tutorRetentionCutoff(options.now ?? new Date(), retentionDays);

  const result: TutorRetentionResult = { cutoff, batches: 0, conversations: 0, messages: 0, toolAudits: 0 };

  for (;;) {
    const expired = await client.academyTutorConversation.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });
    if (expired.length === 0) break;

    const ids = expired.map((row) => row.id);
    const [audits, messages, conversations] = await client.$transaction<[
      { count: number },
      { count: number },
      { count: number },
    ]>([
      client.academyTutorToolAudit.deleteMany({ where: { conversationId: { in: ids } } }),
      client.academyTutorMessage.deleteMany({ where: { conversationId: { in: ids } } }),
      client.academyTutorConversation.deleteMany({ where: { id: { in: ids }, createdAt: { lt: cutoff } } }),
    ]);

    result.batches += 1;
    result.toolAudits += audits.count;
    result.messages += messages.count;
    result.conversations += conversations.count;

    // Nothing deleted means another run got there first. Stop rather than loop on the same ids.
    if (conversations.count === 0) break;
    if (expired.length < batchSize) break;
  }

  return result;
}
