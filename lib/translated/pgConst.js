// translated from ../../original/pgConst.c
module.exports = {
  PQSHOW_CONTEXT_NEVER : 0,     /* never show CONTEXT field */
  PQSHOW_CONTEXT_ERRORS: 1,     /* show CONTEXT for errors only (default) */
  PQSHOW_CONTEXT_ALWAYS: 2,     /* always show CONTEXT field */
  
  PQERRORS_TERSE   : 0,    /* single-line error messages */
  PQERRORS_DEFAULT : 1,    /* recommended style */
  PQERRORS_VERBOSE : 2,    /* all the facts, ma'am */
  PQERRORS_SQLSTATE: 3,    /* only error severity and SQLSTATE code */
  
  /* Identifiers of error message fields. */
  PG_DIAG_SEVERITY             : 'S',
  PG_DIAG_SEVERITY_NONLOCALIZED: 'V',
  PG_DIAG_SQLSTATE             : 'C',
  PG_DIAG_MESSAGE_PRIMARY      : 'M',
  PG_DIAG_MESSAGE_DETAIL       : 'D',
  PG_DIAG_MESSAGE_HINT         : 'H',
  PG_DIAG_STATEMENT_POSITION   : 'P',
  PG_DIAG_INTERNAL_POSITION    : 'p',
  PG_DIAG_INTERNAL_QUERY       : 'q',
  PG_DIAG_CONTEXT              : 'W',
  PG_DIAG_SCHEMA_NAME          : 's',
  PG_DIAG_TABLE_NAME           : 't',
  PG_DIAG_COLUMN_NAME          : 'c',
  PG_DIAG_DATATYPE_NAME        : 'd',
  PG_DIAG_CONSTRAINT_NAME      : 'n',
  PG_DIAG_SOURCE_FILE          : 'F',
  PG_DIAG_SOURCE_LINE          : 'L',
  PG_DIAG_SOURCE_FUNCTION      : 'R',
};