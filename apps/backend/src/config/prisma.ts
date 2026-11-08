import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

declare global {
  var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

const SOFT_DELETE_MODELS = new Set(["User", "Course", "Category"]);

// Soft-deleting a user also deactivates the account. Only User has an isActive column (Course and Category do not).
const softDeleteData = (model: string) => (model === "User" ? { deletedAt: new Date(), isActive: false } : { deletedAt: new Date() });

function createPrismaClient() {
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

  client.$on("error" as never, (e: unknown) => logger.error(String(e)));
  client.$on("warn" as never, (e: unknown) => logger.warn(String(e)));

  return client.$extends({
    query: {
      $allModels: {
        async findUnique({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { ...args.where, deletedAt: null } as typeof args.where;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { ...args.where, deletedAt: null } as typeof args.where;
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where } as typeof args.where;
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            return (client as unknown as Record<string, { update: (a: unknown) => unknown }>)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ].update({ where: args.where, data: softDeleteData(model) });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            return (client as unknown as Record<string, { updateMany: (a: unknown) => unknown }>)[
              model.charAt(0).toLowerCase() + model.slice(1)
            ].updateMany({ where: args.where, data: softDeleteData(model) });
          }
          return query(args);
        },
      },
    },
  });
}

export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
