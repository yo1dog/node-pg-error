# pg-error

Better PostgreSQL errors from `pg`.

This library creates PostgreSQL errors with messages that emulate the `psql` client. In fact, the code for generating the error messages is translated directly from the [psql C source code](https://github.com/postgres/postgres/blob/c9d29775195922136c09cc980bb1b7091bf3d859/src/interfaces/libpq/fe-protocol3.c#L985) with minimal modifications.

`PGError` wraps errors returned by `pg`. It passes through keys from the original error which provide access to the [PostgreSQL error message fields](https://www.postgresql.org/docs/12/protocol-error-fields.html) for identifiable errors. This includes error code, table name, column name, constraint name, detail message, hint, etc.

You can also include the query that caused the error. This allows `PGError` to capture and display information related to the query. For example, the offending portion of the query can be included in the error message along with the line and character location.

Original:
```
Error: syntax error at or near "1234"
```
PGError:
```
PGError: ERROR:  42601:  syntax error at or near "1234"
LINE 3: CHAR 11:
LEFT JOIN 1234 ON fu = 'bar'
          ^
QUERY:  {
  text: 'SELECT a, b\n' +
    'FROM fubar\n' +
    "LEFT JOIN 1234 ON fu = 'bar'\n' +
    "WHERE a = $1;"
  values: [ 'asdf' ]
}
```

## Quick Start

```
npm install @yo1dog/pg-error
```

```javascript
const PGError = require('@yo1dog/pg-error');

const query = {
  text: `
    SELECT * FROM sometable
    WHERE c = $1
  `,
  values: ['D']
};
pgClient.query(query)
.catch(err => {
  throw new PGError(err, query);
});
```

```
PGError: ERROR:  42P01:  relation "sometable" does not exist
LINE 2: CHAR 21:
      SELECT * FROM sometable
                    ^
LOCATION:  parserOpenTable, parse_relation.c:1160
QUERY: {
  text: '\n' +
    '      SELECT * FROM sometable\n' +
    '      WHERE c = $1\n' +
    '    ',
  values: [ 'D' ]
}
    at Object.<anonymous> (README.js:13:3)
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
```

# Docs

## Usage

`new PGError(err, [query, [options]])`

 param                     | type             | description
---------------------------|------------------|-------------
`err`                      | Error            | Error from pg.
`query`                    | string or object | *(optional)* Query that caused error.
`options.verbosityLevel`   | number           | *(optional)* Level of verbosity. Use one of `PGError.pgConst.PQERRORS_*`. Defaults to `PQERRORS_VERBOSE`.
`options.showContextLevel` | number           | *(optional)* When to show context info in error message. Use one of `PGError.pgConst.PQSHOW_CONTEXT_*`. Defaults to `PQSHOW_CONTEXT_NEVER`.
`options.hideQuery`        | boolean          | *(optional)* If the full query text should not be shown in error message. Defaults to false.
`options.hideQueryValues`  | boolean          | *(optional)* If the query values should not be shown in error message. Defaults to false.

**NOTE:** Due to limitations, `PQSHOW_CONTEXT_ERROR` differs from the original functionality. It will show context for all errors instead of only fatal ones. This makes `PQSHOW_CONTEXT_ERROR` and `PQSHOW_CONTEXT_ALWAYS` equivalent.

## Fields

You can access the original PG error via the `origError` key.

The following keys are passed through from the original PG error. They all have a type of string. I also included relevant documentation from the PostgreSQL docs. See: https://www.postgresql.org/docs/12/protocol-error-fields.html

key | byte | docs
----|------|-----
`message`              | M | Message: the primary human-readable error message. This should be accurate but terse (typically one line). Always present.
`severity`             | S | Severity: the field contents are `ERROR`, `FATAL`, or `PANIC` ... or a localized translation of one of these. Always present.
`code`                 | C | Code: the SQLSTATE code for the error (see [Appendix A](https://www.postgresql.org/docs/12/errcodes-appendix.html)). Not localizable. Always present.
`detail`               | D | Detail: an optional secondary error message carrying more detail about the problem. Might run to multiple lines.
`hint`                 | H | Hint: an optional suggestion what to do about the problem. This is intended to differ from Detail in that it offers advice (potentially inappropriate) rather than hard facts. Might run to multiple lines.
`position`             | P | Position: the field value is a decimal ASCII integer, indicating an error cursor position as an index into the original query string. The first character has index 1, and positions are measured in characters not bytes.
`internalPosition`     | p | Internal position: this is defined the same as the `P` field, but it is used when the cursor position refers to an internally generated command rather than the one submitted by the client. The `q` field will always appear when this field appears.
`internalQuery`        | q | Internal query: the text of a failed internally-generated command. This could be, for example, a SQL query issued by a PL/pgSQL function.
`where`                | W | Where: an indication of the context in which the error occurred. Presently this includes a call stack traceback of active procedural language functions and internally-generated queries. The trace is one entry per line, most recent first.
`schema`               | s | Schema name: if the error was associated with a specific database object, the name of the schema containing that object, if any.
`table`                | t | Table name: if the error was associated with a specific table, the name of the table. (Refer to the schema name field for the name of the table's schema.)
`column`               | c | Column name: if the error was associated with a specific table column, the name of the column. (Refer to the schema and table name fields to identify the table.)
`dataType`             | d | Data type name: if the error was associated with a specific data type, the name of the data type. (Refer to the schema name field for the name of the data type's schema.)
`constraint`           | n | Constraint name: if the error was associated with a specific constraint, the name of the constraint. Refer to fields listed above for the associated table or domain. (For this purpose, indexes are treated as constraints, even if they weren't created with constraint syntax.)
`file`                 | F | File: the file name of the source-code location where the error was reported.
`line`                 | L | Line: the line number of the source-code location where the error was reported.
`routine`              | R | Routine: the name of the source-code routine reporting the error.


The following fields are currently **not** supported due to lack of support by `pg`:

byte | docs
-----|-----
V | Severity: the field contents are `ERROR`, `FATAL`, or `PANIC` ... This is identical to the `S` field except that the contents are never localized. This is present only in messages generated by PostgreSQL versions 9.6 and later.


**Note:** The fields for schema name, table name, column name, data type name, and constraint name are supplied only for a limited number of error types; see [Appendix A](https://www.postgresql.org/docs/12/errcodes-appendix.html). Frontends should not assume that the presence of any of these fields guarantees the presence of another field. Core error sources observe the interrelationships noted above, but user-defined functions may use these fields in other ways. In the same vein, clients should not assume that these fields denote contemporary objects in the current database.

## Examples

Here are some common errors and what the PGError message looks like:

### 42601: syntax_error
```
SELECT a, b
FROM fubar
LEFT JOIN 1234 ON fu = 'bar'
WHERE a = 'a';
```
```
PGError: ERROR:  42601:  syntax error at or near "1234"
LINE 3: CHAR 11:
LEFT JOIN 1234 ON fu = 'bar'
          ^
LOCATION:  scanner_yyerror, scan.l:1128
QUERY: ...
```


### 42P01: undefined_table
```
SELECT a, b
FROM fubar
WHERE a = 'a';
```
```
PGError: ERROR:  42P01:  relation "fubar" does not exist
LINE 2: CHAR 6:
FROM fubar
     ^
LOCATION:  parserOpenTable, parse_relation.c:1160
QUERY: ...
```


### 23502: not_null_violation
```
CREATE TABLE mytable (id INT, mycol INT NOT NULL);
INSERT INTO mytable VALUES (1, NULL);
```
```
PGError: ERROR:  23502:  null value in column "mycol" violates not-null constraint
DETAIL:  Failing row contains (1, null).
SCHEMA NAME:  public
TABLE NAME:  mytable
COLUMN NAME:  mycol
LOCATION:  ExecConstraints, execMain.c:1736
QUERY: ...
```


### 23503: foreign_key_violation
```
CREATE TABLE parenttable (id INT PRIMARY KEY);
CREATE TABLE mytable (id INT, parent_id INT REFERENCES parenttable);
INSERT INTO mytable VALUES (1, -10);
```
```
PGError: ERROR:  23503:  insert or update on table "mytable" violates foreign key constraint "mytable_parent_id_fkey"
DETAIL:  Key (parent_id)=(-10) is not present in table "parenttable".
SCHEMA NAME:  public
TABLE NAME:  mytable
CONSTRAINT NAME:  mytable_parent_id_fkey
LOCATION:  ri_ReportViolation, ri_triggers.c:3269
QUERY: ...
```


### 23505: unique_violation
Primary Key
```
CREATE TABLE mytable (id INT PRIMARY KEY);
INSERT INTO mytable VALUES (20), (20);
```
```
PGError: ERROR:  23505:  duplicate key value violates unique constraint "mytable_pkey"
DETAIL:  Key (id)=(20) already exists.
SCHEMA NAME:  public
TABLE NAME:  mytable
CONSTRAINT NAME:  mytable_pkey
LOCATION:  _bt_check_unique, nbtinsert.c:433
QUERY: ...
```

Unique Constraint
```
CREATE TABLE mytable (id INT, mycol INT UNIQUE);
INSERT INTO mytable VALUES (1, 10), (2, 10);
```
```
PGError: ERROR:  23505:  duplicate key value violates unique constraint "mytable_mycol_key"
DETAIL:  Key (mycol)=(10) already exists.
SCHEMA NAME:  public
TABLE NAME:  mytable
CONSTRAINT NAME:  mytable_mycol_key
LOCATION:  _bt_check_unique, nbtinsert.c:433
QUERY: ...
```


### 23514: check_violation
```
CREATE TABLE mytable (id INT, mycol INT CHECK (mycol > 0));
INSERT INTO mytable VALUES (1, -30);
```
```
PGError: ERROR:  23514:  new row for relation "mytable" violates check constraint "mytable_mycol_check"
DETAIL:  Failing row contains (1, -30).
SCHEMA NAME:  public
TABLE NAME:  mytable
CONSTRAINT NAME:  mytable_mycol_check
LOCATION:  ExecConstraints, execMain.c:1762
QUERY: ...
```


## Caveats

- Not all PostgreSQL error message fields are available because they are not supported by `pg`. See the fields docs above.
- `PQSHOW_CONTEXT_ERROR` and `PQSHOW_CONTEXT_ALWAYS` are equivalent. See usage docs above.
- The line position may not exactly match your editor/terminal if the query contains abnormal line breaks. psql considers `\r`, `\n`, and `\r\n` as line breaks.
- The character position may not exactly match your editor/terminal if the query contains certain "wide" characters or grapheme clusters. This is due to lack of standardization around handling the display width of these characters in fixed width environments and grapheme clusters are counted. For example, the [Family: Man, Woman, Boy, Boy emoji](https://emojipedia.org/family-man-woman-boy-boy/) 👨‍👩‍👦‍👦 may be the same width as 1 character, 2 characters, 2.5, etc. The character after may be considered to be at column/char 2, 3, 8, etc. psql and PGError use an implementation of [`wcwidth`](http://man7.org/linux/man-pages/man3/wcwidth.3.html) and do not support grapheme clustering.


## Project Structure

All library files are in `/lib/`. Code translated from C is in `/lib/translated/`.

The original C code that was translated is kept in `/original/`. If/when the `psql` client code updates and we want to update this library along with it, we can diff the stored originals with the new versions. This will hopefully make updating the translated code easier.