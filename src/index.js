/**
 * Imports
 */

import DeclarativePromise from 'declarative-promise'

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

function isDeclarativePromise (obj) {
  return (typeof obj.then === 'function' && typeof obj.action === 'object' && obj.root)
}

/**
 * Exports
 */

export default effects
