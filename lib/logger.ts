type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  public info(message: string, data?: any) {
    const formatted = this.formatMessage('info', message);
    if (this.isDevelopment) {
      console.log(formatted, data || '');
    }
    // In production, we could send this to a logging service (e.g. Sentry, Axiom, etc.)
  }

  public warn(message: string, data?: any) {
    const formatted = this.formatMessage('warn', message);
    console.warn(formatted, data || '');
  }

  public error(message: string, error?: any) {
    const formatted = this.formatMessage('error', message);
    console.error(formatted, error || '');
    
    // Example of production error tracking
    if (!this.isDevelopment) {
      // sendToLoggingService(formatted, error);
    }
  }

  public debug(message: string, data?: any) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message);
      console.debug(formatted, data || '');
    }
  }
}

export const logger = Logger.getInstance();
