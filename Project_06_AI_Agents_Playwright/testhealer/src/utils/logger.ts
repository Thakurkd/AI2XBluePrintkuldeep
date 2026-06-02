import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

const lineFormat = printf(({ level, message, timestamp: ts, scope }) => {
    const tag = scope ? ` [${scope as string}]` : '';
    return `${ts as string} [${level}]${tag} ${message as string}`;
});

export const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), lineFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize({ level: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), lineFormat),
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

export function createLogger(scope: string): winston.Logger {
    return logger.child({ scope });
}

export type Logger = winston.Logger;
export default logger;
