const ExtendableError = require('@yo1dog/extendable-error');
const util            = require('util');


class PGError extends ExtendableError {
  /**
   * Wraps a PSQL error.
   * 
   * @param {Error}  psqlError 
   * @param {{text?: string, values?: any[]} | string} [sql]
   */
  constructor(psqlError, sql) {
    // create meta
    const meta = createMeta(psqlError, sql);
    const message = createMessage(psqlError, meta);
    
    super(message);
    
    this.setUnenumerable('meta', meta);
    this.setUnenumerable('origError', psqlError);
  }
}

module.exports = PGError;

function createMeta(pgError, sql) {
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
    pgError,
    typeof sql === 'string'? {
      sql: {
        text: sql
      }
    } : sql? {
      sql: {
        text  : sql.text,
        values: sql.values
      }
    } : {}
  );
  
  delete meta.name;
  delete meta.stack;
  Object.keys(meta).forEach(key => {
    if (typeof meta[key] === 'undefined') {
      delete meta[key];
    }
  });
  
  return meta;
}

function createMessage(pgError, meta) {
  const sqlDescStr = createSQLDescStr(meta);
  const metaStr = util.inspect(meta);
  
  return (
    pgError.message +
    (sqlDescStr? '\n' + sqlDescStr + '\n' : ' ') +
    metaStr
  );
}

function createSQLDescStr(meta) {
  if (!meta.sql.text) return;
  
  const position = parseInt(meta.position, 10);
  if (isNaN(position)) return;
  
  const index = position - 1;
  
  const sqlTextSufix = (
    meta.sql.text.substring(index, index + 33)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  if (sqlTextSufix.length === 0) return;
  
  const sqlTextPrefix = (
    meta.sql.text.substring(index - 32, index)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
  );
  
  return sqlTextPrefix + sqlTextSufix + '\n' + ' '.repeat(sqlTextPrefix.length) + '^';
}