'use strict';

const { ApolloLink, Observable } = require('apollo-link');
const VError = require('verror');

const MAX_RETRY_ATTEMPTS = 2;
const INITIAL_DELAY_MS = 200;
const EXPONENT = 2;

module.exports = function createRetryLink () {
  return new ApolloLink(createObservable);
};

function createObservable (operation, forward) {
  return new Observable(observer => {
    const subscriptions = [];
    let retryAttempts = 0;

    function performAttempt () {
      let subscription;

      try {
        subscription = forward(operation).subscribe({
          next: result => {
            const { errors } = result;

            if (errors && errors.length) {
              const error = errors[0];

              switch (error.name) {
                case 'ServiceUnavailableWithoutRetry':
                  observer.next({
                    ...result,
                    errors: [
                      new VError(
                        {
                          name: 'ServiceUnavailable',
                          cause: error
                        },
                        'GraphQL service unavailable'
                      )
                    ]
                  });
                  return;
                case 'ServiceUnavailableWithRetry':
                case 'NetworkError':
                  if (retryAttempts < MAX_RETRY_ATTEMPTS) {
                    retryAttempts++;

                    setTimeout(
                      () => performAttempt(),
                      INITIAL_DELAY_MS * EXPONENT ** (retryAttempts - 1)
                    );
                  } else {
                    observer.next({
                      ...result,
                      errors: [
                        new VError(
                          {
                            name: 'ServiceUnavailable',
                            cause: error
                          },
                          'GraphQL service unavailable'
                        )
                      ]
                    });
                  }

                  return;
              }
            }

            observer.next(result);
          },
          error: err => {
            observer.error(err);
          },
          complete: () => {
            observer.complete.bind(observer)();
          }
        });

        subscriptions.push(subscription);
      } catch (e) {
        observer.error(e);
      }
    }

    performAttempt();

    return () => {
      for (const subscription of subscriptions) {
        if (subscription) subscription.unsubscribe();
      }
    };
  });
}
