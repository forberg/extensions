/* globals __DEV__ __WEB__ */

import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { routeReducer } from 'redux-simple-router';

import { rocConfig } from '../universal-config';

/**
 * Redux store creator
 *
 * @param {!object} reducers - Reducers that should be added to the store
 * @param {...function} middlewares - Redux middlewares that should be added to the store
 * @returns {function} A function that has the following interface:
 * `(callback) => (reduxReactRouter, getRoutes, createHistory, initialState)`.
 * The callback will be called when the application is in _DEV_ mode on the client as a way to add hot module update of
 * the reducers. The callback itself will take a function as the parameter that in turn takes the reducers to update.
 */
export default function createReduxStore(reducers, ...middlewares) {
    return (callback) =>
        (initialState) => {
            let finalCreateStore;

            if (__DEV__ && __WEB__) {
                const { persistState } = require('redux-devtools');
                const { instrument } = require('../../client/dev-tools').default;
                const createLogger = require('redux-logger');
                const logger = createLogger({
                    level: rocConfig.dev.reduxLogger.level,
                    collapsed: rocConfig.dev.reduxLogger.collapsed,
                    duration: rocConfig.dev.reduxLogger.duration,
                    timestamp: rocConfig.dev.reduxLogger.timestamp
                });

                const debugMiddlewares = [logger];

                finalCreateStore = compose(
                    applyMiddleware(...middlewares, ...debugMiddlewares),
                    instrument(),
                    persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
                )(createStore);
            } else {
                finalCreateStore = compose(
                    applyMiddleware(...middlewares)
                )(createStore);
            }

            const reducer = combineReducers({
                routing: routeReducer,
                ...reducers
            });

            const store = finalCreateStore(reducer, initialState);

            if (__DEV__ && __WEB__ && module.hot) {
                // Enable Webpack hot module replacement for reducers
                callback((newReducers) => {
                    const nextRootReducer = combineReducers({
                        routing: routeReducer,
                        ...newReducers
                    });
                    store.replaceReducer(nextRootReducer);
                });
            }

            return store;
        };
}
