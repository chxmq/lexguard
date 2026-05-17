const PREFIX = '[LexGuard]';

function format(level, tag, message, meta) {
  const head = tag ? `${PREFIX}[${tag}]` : PREFIX;
  const tail = meta !== undefined ? ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}` : '';
  return `${head} ${message}${tail}`;
}

export const logger = {
  info(tag, message, meta) {
    console.log(format('info', tag, message, meta));
  },
  warn(tag, message, meta) {
    console.warn(format('warn', tag, message, meta));
  },
  error(tag, message, meta) {
    console.error(format('error', tag, message, meta));
  },
};
