# mnr-graphql-client

Opinionated wrapper around apollo-client

## You may not need it!

This is a custom, highly opinionated solution aimed at code reuse for a few private projects. You'd be better off using [Apollo Client](https://www.apollographql.com/docs/) directly.


## Installation

```bash
$ npm install --save mnr-graphql-client
```

## Usage example

```javascript
const createGraphQLClient = require('mnr-graphql-client');

const graphQLClient = createGraphQLClient('https://my-graphql-server.com/graphql');

// This is an Express endpoint handler
async function handleRequest (req, res, next) {
  try {
    const query = buildQuerySomehow();
    const variables1 = { var: 'foo' };

    const data1 = await graphQLClient.query({ query, variables: variables1 }, req);

    const mutation = buildQuerySomehow();
    const variables2 = { var: 'bar' };

    const data2 = await graphQLClient.mutate({ mutation, variables: variables2 }, req);
  } catch (err) {
    if (err.name === 'ServiceUnavailable') {
      res.status(503).end();
      return;
    }

    next(err);
  }
}
```


## API Reference

### `createGraphQLClient(uri)`

* `{String} uri` URI of the GraphQL server.

* Returns `{Object} graphQLClient`.

Creates a client object which exposes methods for querying GraphQL server.


### `graphQLClient.query(requestOptions, req)`

* `{Object} requestOptions` Options to pass in Apollo's original `query` method.

* `{Object} req` Express' `Request` object.

* Returns `{Promise<Object>}` Full original Apollo's response object.

* Throws `{ServiceUnavailable}`, `BadGraphQLRequest`, `UnexpectedError`.


Alias for Apollo's original `query` method.


### `graphQLClient.mutate(requestOptions, req)`

* `{Object} requestOptions` Options to pass in Apollo's original `mutate` method.

* `{Object} req` Express' `Request` object.

* Returns `{Promise<Object>}` Full original Apollo's response object.

* Throws `{ServiceUnavailable}`, `BadGraphQLRequest`, `UnexpectedError`.

Alias for Apollo's original `mutate` method.
