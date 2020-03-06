declare class PGError extends Error {
  /**
   * Creates a PG Error.
   */
  public constructor(
    psqlError: Error,
    query?: string | {
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
    queryLine        : number;
    queryChar        : number;
    queryIndex       : number;
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
    query: {
      text?  : string,
      values?: any[]
    }
  }
  
  public origError: Error;
}

export = PGError;