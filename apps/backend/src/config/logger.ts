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

// Size-based rotation. With tailable, the newest lines always stay in error.log and combined.log, and older
// copies are error1.log, error2.log and so on, up to LOG_FILE_MAX_FILES.
const rotation = {
  maxsize: env.LOG_FILE_MAX_BYTES,
  maxFiles: env.LOG_FILE_MAX_FILES,
  tailable: true,
};

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      ...rotation,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      ...rotation,
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
