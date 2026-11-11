import winston from "winston";
import path from "path";
import { env } from "./env";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logDir = path.join(process.cwd(), "logs");

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
  }),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
  exitOnError: false,
});

if (env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// Morgan HTTP request logging is piped into this stream in server.ts
export const httpLogStream = {
  write: (message: string) => logger.info(message.trim()),
};
