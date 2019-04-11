'use strict';

const { ApolloLink, Observable } = require('apollo-link');
const VError = require('verror');

module.exports = function createErrorLink () {
  return new ApolloLink((operation, forward) => {
    return new Observable(observer => {
      let sub;

      try {
        sub = forward(operation).subscribe({
          next: result => {
            if (result.errors && result.errors.length) {
              const error = result.errors[0];

              if (error.extensions.code === 'SERVICE_UNAVAILABLE') {
                return;
              }

              result = {
                data: null,
                errors: [
                  new VError(
                    {
                      name: 'UnexpectedError',
                      info: error.extensions.exception
                    },
                    error.message
                  )
                ]
              };
            }

            observer.next(result);
          },
          error: err => {
            let errorName;
            let errorMessage;
            let cause;

            if (err.code) {
              // Handle network errors
              switch (err.code) {
                case 'ECONNREFUSED':
                  errorName = 'NetworkError';
                  errorMessage = 'failed connecting to GraphQL service';
                  cause = err;
              }
            } else {
              // Handle other errors
              const error = err.result.errors[0];

              switch (error.extensions.code) {
                case 'GRAPHQL_VALIDATION_FAILED':
                case 'BAD_REQUEST':
                  errorName = 'BadGraphQLRequest';
                  break;
                case 'SERVICE_UNAVAILABLE':
                  if (error.extensions.retry === false) {
                    errorName = 'ServiceUnavailableWithoutRetry';
                  } else {
                    errorName = 'ServiceUnavailableWithRetry';
                  }
                  break;
                default:
                  errorName = 'UnexpectedError';
              }

              cause = error.extensions.exception;
              errorMessage = error.message;
            }

            const result = {
              data: null,
              errors: [
                new VError(
                  {
                    name: errorName,
                    info: cause
                  },
                  errorMessage
                )
              ]
            };

            observer.next(result);
          },
          complete: () => {
            observer.complete.bind(observer)();
          }
        });
      } catch (e) {
        observer.error(e);
      }

      return () => {
        if (sub) sub.unsubscribe();
      };
    });
  });
};
