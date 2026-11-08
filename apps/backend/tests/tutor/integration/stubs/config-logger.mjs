// Edge stub for src/config/logger. Records every entry so tests can check what reached the log.
export const entries = [];

export const logger = {
  info() {},
  error() {},
  debug() {},
  warn(event, fields) {
    entries.push({ level: 'warn', event, fields });
  },
};
