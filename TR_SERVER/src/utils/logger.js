// 结构化日志工具 - 运维友好
// 输出 JSON 格式，便于 ELK/Loki/Grafana 等日志系统采集解析

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

function log(level, message, extra = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[LEVEL]) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...extra,
  };

  const output = JSON.stringify(entry);

  if (level === 'ERROR') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  debug: (msg, extra) => log('DEBUG', msg, extra),
  info: (msg, extra) => log('INFO', msg, extra),
  warn: (msg, extra) => log('WARN', msg, extra),
  error: (msg, extra) => log('ERROR', msg, extra),
};

export default logger;
