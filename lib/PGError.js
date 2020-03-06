const ExtendableError = require('@yo1dog/extendable-error');
const util            = require('util');


class PGError extends ExtendableError {
  /**
   * Wraps a PSQL error.
   * 
   * @param {Error}  psqlError 
   * @param {{text?: string, values?: any[]} | string} [query]
   */
  constructor(psqlError, query) {
    // create meta
    const meta = createMeta(psqlError, query);
    const message = createMessage(psqlError, meta);
    
    super(message);
    
    this.setUnenumerable('meta', meta);
    this.setUnenumerable('origError', psqlError);
  }
}

module.exports = PGError;

/**
 * @param {any} psqlError 
 * @param {any} query 
 */
function createMeta(psqlError, query) {
  const meta = Object.assign(
    // show these keys first 
    {
      /* eslint-disable no-undefined */
      message         : undefined,
      detail          : undefined,
      length          : undefined,
      severity        : undefined,
      code            : undefined,
      hint            : undefined,
      queryLine       : undefined,
      queryChar       : undefined,
      queryIndex      : undefined,
      position        : undefined,
      internalPosition: undefined,
      internalQuery   : undefined,
      where           : undefined,
      schema          : undefined,
      table           : undefined,
      column          : undefined,
      dataType        : undefined,
      constraint      : undefined,
      file            : undefined,
      line            : undefined,
      routine         : undefined
      /* eslint-enable no-undefined */
    },
    psqlError,
    {
      query: typeof query === 'string'? {
        text: query
      } : query? {
        text  : query.text,
        values: query.values
      } : {}
    }
  );
  
  meta.queryIndex = getQueryIndex(meta);
  const queryPosition = getQueryPosition(meta);
  if (queryPosition) {
    meta.queryLine = queryPosition.line;
    meta.queryChar = queryPosition.char;
  }
  
  delete meta.name;
  delete meta.stack;
  Object.keys(meta).forEach(key => {
    if (typeof meta[key] === 'undefined') {
      delete meta[key];
    }
  });
  
  return meta;
}

/**
 * @param {any} psqlError 
 * @param {any} meta 
 */
function createMessage(psqlError, meta) {
  const queryDescStr = createQueryDescStr(meta);
  const metaStr = util.inspect(meta);
  
  return (
    psqlError.message +
    (queryDescStr? '\n' + queryDescStr + '\n' : ' ') +
    metaStr
  );
}

/**
 * @param {any} meta 
 */
function getQueryIndex(meta) {
  if (!meta.query.text) return;
  
  const position = parseInt(meta.position, 10);
  if (isNaN(position)) return;
  
  return Math.max(Math.min(position - 1, meta.query.text.length), 0);
}

/**
 * @param {any} meta 
 */
function getQueryPosition(meta) {
  if (typeof meta.queryIndex === 'undefined') return;
  
  let numNewLines = 0;
  let lastNewlineIndex = -1;
  for (let i = 0; i < meta.queryIndex; ++i) {
    if (meta.query.text.charCodeAt(i) === 10) {
      ++numNewLines;
      lastNewlineIndex = i;
    }
  }
  
  const lineStartIndex = lastNewlineIndex + 1;
  
  return {
    line: numNewLines + 1,
    char: (meta.queryIndex - lineStartIndex) + 1
  };
}

/**
 * @param {any} meta 
 */
function createQueryDescStr(meta) {
  if (typeof meta.queryIndex === 'undefined') return;
  
  const queryTextPrefix = (
    meta.query.text
    .substring(meta.queryIndex - 32, meta.queryIndex)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  
  const queryTextSufix = (
    meta.query.text
    .substring(meta.queryIndex, meta.queryIndex + 33)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  
  let str = '';
  if (meta.queryLine) {
    str += `line ${meta.queryLine}, char ${meta.queryChar}:\n`;
  }
  str += `${queryTextPrefix}${queryTextSufix}\n`;
  str += ' '.repeat(queryTextPrefix.length) + '^';
  
  return str;
}