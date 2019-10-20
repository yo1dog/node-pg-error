declare class PGError extends Error {
  /**
   * Creates a PG Error.
   */
  public constructor(
    pgError: Error,
    message?: string,
    sql?: {
      text?  : string,
      values?: any[]
    }
  );
  
  public meta: {
    message?         : string;
    detail?          : string;
    length?          : number;
    severity?        : string;
    code?            : string;
    hint?            : string;
    position?        : number;
    internalPosition?: number;
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
    sql?: {
      text?  : string,
      values?: any[]
    }
  }
}

export = PGError;