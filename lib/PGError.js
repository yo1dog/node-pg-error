const ExtendableError = require('@yo1dog/extendable-error');
const CError          = require('@yo1dog/cerror');
const formatMessage   = require('./formatMessage');


class PGError extends ExtendableError {
  /**
   * Wraps a PSQL error.
   * 
   * @param {Error}  pgError 
   * @param {string} [message] 
   * @param {{text?: string, values?: any[]} | string} [sql]
   */
  constructor(pgError, message, sql) {
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
    
    super(formatMessage(message, meta));
    
    CError.chain(pgError, this);
    
    this.setUnenumerable('meta', meta);
  }
}

module.exports = PGError;