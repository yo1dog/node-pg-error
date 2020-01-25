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
 * @param {Error} psqlError 
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
    typeof query === 'string'? {
      query: {
        text: query
      }
    } : query? {
      query: {
        text  : query.text,
        values: query.values
      }
    } : {}
  );
  
  delete meta.name;
  delete meta.stack;
  Object.keys(meta).forEach(key => {
    if (typeof /** @type {any} */(meta)[key] === 'undefined') {
      delete /** @type {any} */(meta)[key];
    }
  });
  
  return meta;
}

/**
 * @param {Error} psqlError 
 * @param {*} meta 
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
 * @param {*} meta 
 */
function createQueryDescStr(meta) {
  if (!meta.query.text) return;
  
  const position = parseInt(meta.position, 10);
  if (isNaN(position)) return;
  
  const index = position - 1;
  
  const queryTextSufix = (
    meta.query.text.substring(index, index + 33)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  if (queryTextSufix.length === 0) return;
  
  const queryTextPrefix = (
    meta.query.text.substring(index - 32, index)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  
  return queryTextPrefix + queryTextSufix + '\n' + ' '.repeat(queryTextPrefix.length) + '^';
}