export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  route?: string;
  durationMs?: number;
  [key: string]: unknown;
}

class Logger {
  private formatLog(level: LogLevel, message: string, meta: Record<string, unknown> = {}): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    return JSON.stringify(entry);
  }

  info(message: string, meta: Record<string, unknown> = {}) {
    console.log(this.formatLog("info", message, meta));
  }

  warn(message: string, meta: Record<string, unknown> = {}) {
    console.warn(this.formatLog("warn", message, meta));
  }

  error(message: string, meta: Record<string, unknown> = {}) {
    console.error(this.formatLog("error", message, meta));
  }

  debug(message: string, meta: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatLog("debug", message, meta));
    }
  }
}

export const logger = new Logger();
