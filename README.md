# pg-error

PG Error

## Quick Start

```javascript
const PGError = require('@yo1dog/pg-error');

const query = {
  text: `
    SELECT * FROM sometable
    LEFT JOIN othertable ON a = b
    WHERE c = $1
  `,
  values: ['D']
};
pgPool.query(query)
.catch(err => {
  throw new PGError(err, query);
});
```

```
PGError: relation "test" does not exist
 * FROM sometable\n    LEFT JOIN othertable ON a = b\n    WHERE c =
                                 ^
{
  length: 82,
  severity: 'ERROR',
  code: '42P01',
  position: '44',
  file: 'parse_relation.c',
  line: '1180',
  routine: 'parserOpenTable',
  query: {
    text: '\n' +
      '    SELECT * FROM sometable\n' +
      '    LEFT JOIN othertable ON a = b\n' +
      '    WHERE c = $1\n' +
      '  ',
    values: ['D']
  }
}
    at Object.<anonymous> (README.js:13:3)
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
```

# Docs

## `new PGError(psqlError, [query])`

 param      | type             | description
------------|------------------|-------------
`psqlError` | Error            | Error from pg.
`query`     | string or object | Query that caused error.


-----

## `PGError.meta`
## `PGError.origError`
