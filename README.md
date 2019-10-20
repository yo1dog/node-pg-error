# pg-error

PG Error

## Quick Start

```javascript
const PGError = require('@yo1dog/pg-error');

const sql = SQL`SELECT 1 FROM fubar`;
pgPool.query(sql)
.catch(err => {
  throw new PGError(err, `Error SELECTing fubar.`, sql)
});
```


# Docs

## `new PGError(pgError, message, [sql])`

 param    | type             | description
----------|------------------|-------------
`pgError` | Error            | Error from pg.
`message` | string           | A human-readable description of the error.
`sql`     | string or object | SQL that caused error.


-----

## `CError.meta`
