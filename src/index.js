/**
 * Imports
 */

import isPromise from 'is-promise'

/**
 * Effects
 */

function effects ({dispatch, getState}) {
  return next => action => {
    const result = next(action)

    return isPromise(result)
      ? action.meta && applyPromises(action.meta.steps, result)
      : result
  }

  function applyPromises (steps = [], q) {
    steps.reduce((q, [success = noop, failure = noop]) => q.then(val => maybeDispatch(success(val)), err => maybeDispatch(failure(err))), q)
  }

  function maybeDispatch (action) {
    return action && dispatch(action)
  }
}

function noop () {}

/**
 * Exports
 */

export default effects
