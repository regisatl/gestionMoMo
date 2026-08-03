const winston = require('winston');
const path = require('path');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// En production (Render), on n'écrit que sur la console —
// le filesystem est éphémère et les logs fichier seraient perdus à chaque déploiement.
// En développement, on garde les fichiers pour le debug local.
const transports = [new winston.transports.Console()];

if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.uncolorize(),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.uncolorize(),
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
});

module.exports = logger;
