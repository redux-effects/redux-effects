/**
 * Effects
 */

function effects (...middlewares) {
  return ({dispatch, getState}) => {
    const chain = middlewares.map(fn => fn({dispatch, getState}))
    const stack = compose(...chain, unhandledEffect)

    return next => action => {
      if (action.type !== 'EFFECT') {
        return next(action)
      }

      const q = Promise.resolve(stack(action.payload))
      action.meta && applyPromises(action.meta.steps, q)
    }

    function applyPromises (steps=[], q) {
      steps.reduce((q, [success = noop, failure = noop]) => q.then(val => maybeDispatch(success(val)), err => maybeDispatch(failure(err))), q)
    }

    function maybeDispatch (action) {
      return action && dispatch(action)
    }
  }
}

function unhandledEffect (effect) {
  console.warn('WARNING Unhandled Effect: ', effect)
}

function compose (...funcs) {
  return funcs.reduceRight((composed, f) => f(composed))
}

function noop () {}

/**
 * Exports
 */

export default effects
