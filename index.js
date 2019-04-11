'use strict';

const ApolloClient = require('apollo-client').default;
const fetch = require('node-fetch');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { ApolloLink } = require('apollo-link');
const { createHttpLink } = require('apollo-link-http');

const createErrorLink = require('./lib/link-error');
const createRetryLink = require('./lib/link-retry');

module.exports = function createGraphQLClient (uri) {
  const httpLink = createHttpLink({ uri, fetch });

  const errorLink = createErrorLink();
  const retryLink = createRetryLink();

  const client = new ApolloClient({
    link: ApolloLink.from([
      retryLink,
      errorLink,
      httpLink
    ]),
    cache: new InMemoryCache({
      addTypename: false
    }),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      },
      mutate: {
        errorPolicy: 'all'
      }
    }
  });

  return {
    /**
     * @throws {ServiceUnavailable}
     */
    query: async function query (requestOptions, req) {
      const { data, errors } = await client.query({
        ...requestOptions,
        context: {
          headers: {
            'x-transaction-id': req.transactionId
          }
        }
      });

      if (errors && errors.length) {
        throw errors[0];
      }

      return data;
    },

    /**
     * @throws {ServiceUnavailable}
     */
    mutate: async function mutate (requestOptions, req) {
      const { data, errors } = await client.mutate({
        ...requestOptions,
        context: {
          headers: {
            'x-transaction-id': req.transactionId
          }
        }
      });

      if (errors && errors.length) {
        throw errors[0];
      }

      return data;
    }
  };
};
