const ExtendableError       = require('@yo1dog/extendable-error');
const pgBuildeErrorMessage3 = require('./translated/pgBuildErrorMessage3');
const pgConst               = require('./translated/pgConst');
const util                  = require('util');


module.exports = class PGError extends ExtendableError {
  /**
   * @param {any} err 
   * @param {any} query
   * @param {any} options
   */
  constructor(err, query, options) {
    query = formatQuery(query);
    
    const message = createMessage(err, query, options);
    super(message);
    
    this.setUnenumerable('severity',         err.severity);
    this.setUnenumerable('code',             err.code);
    this.setUnenumerable('detail',           err.detail);
    this.setUnenumerable('hint',             err.hint);
    this.setUnenumerable('position',         err.position);
    this.setUnenumerable('internalPosition', err.internalPosition);
    this.setUnenumerable('internalQuery',    err.internalQuery);
    this.setUnenumerable('where',            err.where);
    this.setUnenumerable('schema',           err.schema);
    this.setUnenumerable('table',            err.table);
    this.setUnenumerable('column',           err.column);
    this.setUnenumerable('dataType',         err.dataType);
    this.setUnenumerable('constraint',       err.constraint);
    this.setUnenumerable('file',             err.file);
    this.setUnenumerable('line',             err.line);
    this.setUnenumerable('routine',          err.routine);
    this.setUnenumerable('length',           err.length);
    
    this.setUnenumerable('query', query);
    this.setUnenumerable('origError', err);
  }
};
module.exports.pgConst = pgConst;

/**
 * @param {any} query
 */
function formatQuery(query) {
  if (typeof query === 'string') {
    return {
      text: query
    };
  }
  if (query) {
    return {
      text: query.text,
      values: query.values
    };
  }
  return {};
}

/**
 * @param {any} err 
 * @param {any} query 
 * @param {any} options
 */
function createMessage(err, query, options) {
  const verbosityLevel   = options && typeof options.verbosityLevel   === 'number'? options.verbosityLevel   : pgConst.PQERRORS_VERBOSE;
  const showContextLevel = options && typeof options.showContextLevel === 'number'? options.showContextLevel : pgConst.PQSHOW_CONTEXT_NEVER;
  const hideQuery        = options && options.hideQuery;
  const hideQueryValues  = options && options.hideQueryValues;
  
  const errorMsg = pgBuildeErrorMessage3(
    {
      errorFieldMap: {
        M: toNullableString(err.message         ),
        S: toNullableString(err.severity        ),
        C: toNullableString(err.code            ),
        D: toNullableString(err.detail          ),
        H: toNullableString(err.hint            ),
        P: toNullableString(err.position        ),
        p: toNullableString(err.internalPosition),
        q: toNullableString(err.internalQuery   ),
        W: toNullableString(err.where           ),
        s: toNullableString(err.schema          ),
        t: toNullableString(err.table           ),
        c: toNullableString(err.column          ),
        d: toNullableString(err.dataType        ),
        n: toNullableString(err.constraint      ),
        F: toNullableString(err.file            ),
        L: toNullableString(err.line            ),
        R: toNullableString(err.routine         ),
      },
      queryText: toNullableString(query.text)
    },
    verbosityLevel,
    showContextLevel
  ).trimRight() || err.message;
  
  /** @type {any} */
  let formatedQuery;
  if (!hideQuery && query && typeof query.text !== 'undefined') {
    formatedQuery = {
      text: query.text
    };
    
    if (!hideQueryValues && typeof query.values !== 'undefined') {
      formatedQuery.values = query.values;
    }
  }
  
  let msg = errorMsg;
  if (formatedQuery) {
    msg += `\nQUERY:  ${util.inspect(formatedQuery)}`;
  }
  
  return msg;
}

/**
 * @param {any} val
 */
function toNullableString(val) {
  if (typeof val === 'undefined' || val === null) {
    return null;
  }
  if (typeof val === 'string') {
    return val;
  }
  return String(val);
}