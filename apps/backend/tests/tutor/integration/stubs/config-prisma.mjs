// Edge fake for the Prisma client (src/config/prisma). In-memory rows, filtered by the where clauses the code sends.
// Supports the calls the tutor code makes: create, findFirst, findMany, deleteMany, $transaction, and the
// membership lookup used by the wiring. Anything else throws, so an unexpected query fails the test.

export const db = {
  companyMembers: [],
  conversations: [],
  messages: [],
  audits: [],
};

let seq = 0;

function toTime(value) {
  return value instanceof Date ? value.getTime() : value;
}

export function matches(row, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond) return cond.in.includes(value);
      if ('lt' in cond) return toTime(value) < toTime(cond.lt);
      throw new Error(`prisma stub does not support ${JSON.stringify(cond)}`);
    }
    return value === cond;
  });
}

function sortRows(rows, orderBy) {
  if (!orderBy || !orderBy.createdAt) return [...rows];
  const dir = orderBy.createdAt === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => dir * (toTime(a.createdAt) - toTime(b.createdAt)));
}

function delegate(table, prefix) {
  return {
    async create({ data }) {
      const row = { id: `${prefix}-${++seq}`, createdAt: new Date(), ...data };
      table.push(row);
      return { ...row };
    },
    async findFirst({ where = {}, orderBy } = {}) {
      const row = sortRows(
        table.filter((r) => matches(r, where)),
        orderBy,
      )[0];
      return row ? { ...row } : null;
    },
    async findMany({ where = {}, orderBy, take } = {}) {
      const rows = sortRows(
        table.filter((r) => matches(r, where)),
        orderBy,
      );
      return (take === undefined ? rows : rows.slice(0, take)).map((r) => ({ ...r }));
    },
    async deleteMany({ where = {} } = {}) {
      let count = 0;
      for (let i = table.length - 1; i >= 0; i--) {
        if (matches(table[i], where)) {
          table.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
  };
}

export const prisma = {
  companyMember: delegate(db.companyMembers, 'mem'),
  academyTutorConversation: delegate(db.conversations, 'conv'),
  academyTutorMessage: delegate(db.messages, 'msg'),
  academyTutorToolAudit: delegate(db.audits, 'aud'),
  // Operations are already-started promises, as with the real client. The stub runs them in order.
  async $transaction(operations) {
    return Promise.all(operations);
  },
};

export function resetDb() {
  for (const table of Object.values(db)) table.length = 0;
}

/** Inserts a row as given, including a back-dated createdAt. Used to set up retention cases. */
export function seed(table, row) {
  table.push({ ...row });
  return row;
}
