declare class PGError extends Error {
  public constructor(
    err: Error,
    query?: string | {
      text?  : string | null,
      values?: any[] | null
    }
  );
  
  public severity         : string;
  public code             : string;
  public detail?          : string;
  public hint?            : string;
  public position?        : string;
  public internalPosition?: string;
  public internalQuery?   : string;
  public where?           : string;
  public schema?          : string;
  public table?           : string;
  public column?          : string;
  public dataType?        : string;
  public constraint?      : string;
  public file?            : string;
  public line?            : string;
  public routine?         : string;
  public length           : number;
  public query: {
    text?  : string | null,
    values?: any[] | null
  }
  
  public origError: Error & {
    severity         : string;
    code             : string;
    detail?          : string;
    hint?            : string;
    position?        : string;
    internalPosition?: string;
    internalQuery?   : string;
    where?           : string;
    schema?          : string;
    table?           : string;
    column?          : string;
    dataType?        : string;
    constraint?      : string;
    file?            : string;
    line?            : string;
    routine?         : string;
    length           : number;
  };
  
  public static pgConst: {
    PQSHOW_CONTEXT_NEVER : number;
    PQSHOW_CONTEXT_ERRORS: number;
    PQSHOW_CONTEXT_ALWAYS: number;
    
    PQERRORS_TERSE   : number;
    PQERRORS_DEFAULT : number;
    PQERRORS_VERBOSE : number;
    PQERRORS_SQLSTATE: number;
    
    PG_DIAG_SEVERITY             : number;
    PG_DIAG_SEVERITY_NONLOCALIZED: number;
    PG_DIAG_SQLSTATE             : number;
    PG_DIAG_MESSAGE_PRIMARY      : number;
    PG_DIAG_MESSAGE_DETAIL       : number;
    PG_DIAG_MESSAGE_HINT         : number;
    PG_DIAG_STATEMENT_POSITION   : number;
    PG_DIAG_INTERNAL_POSITION    : number;
    PG_DIAG_INTERNAL_QUERY       : number;
    PG_DIAG_CONTEXT              : number;
    PG_DIAG_SCHEMA_NAME          : number;
    PG_DIAG_TABLE_NAME           : number;
    PG_DIAG_COLUMN_NAME          : number;
    PG_DIAG_DATATYPE_NAME        : number;
    PG_DIAG_CONSTRAINT_NAME      : number;
    PG_DIAG_SOURCE_FILE          : number;
    PG_DIAG_SOURCE_LINE          : number;
    PG_DIAG_SOURCE_FUNCTION      : number;
  }
}

export = PGError;