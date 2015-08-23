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
      action.meta && applyPromises(action.meta.then, q)
    }

    function applyPromises (thens=[], q) {
      thens.forEach(({success, failure, then}) => {
        applyPromises(q.then((res) => dispatch(success(res)), err => dispatch(failure(err))), then)
      })
    }
  }
}

function unhandledEffect (effect) {
  console.warn('WARNING Unhandled Effect: ', effect)
}

function compose (...funcs) {
  return funcs.reduceRight((composed, f) => f(composed))
}

/**
 * Exports
 */

export default effects
