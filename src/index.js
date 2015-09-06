/**
 * Effects
 */

function effects (...middlewares) {
  return ({dispatch, getState}) => {
    const chain = middlewares.map(fn => fn({dispatch, getState}))
    const stack = compose(...chain, unhandledEffect)

    return next => action => {
      // Help people out if they forgot to .toJSON()
      if (isDeclarativePromise(action)) {
        action = action.toJSON()
      }

      if (action.type !== 'EFFECT') {
        return next(action)
      }

      const q = Promise.resolve(stack(action.payload))
      action.meta && applyPromises(action.meta.steps, q)
    }

    function applyPromises (steps=[], q) {
      steps.forEach(({success=noop, failure=noop, steps}) => {
        applyPromises(steps, q.step((res) => maybeDispatch(success(res)), err => maybeDispatch(failure(err))))
      })
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

function isDeclarativePromise (obj) {
  return (typeof obj.step === 'function' && typeof obj.action === 'object' && obj.root)
}

function noop () {}

/**
 * Exports
 */

export default effects
