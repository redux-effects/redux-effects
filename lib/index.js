/**
 * Imports
 */

var DeclarativePromise = require('declarative-promise')

/**
 * Effects
 */

function effects (/* ... middlewares */) {
  var middlewares = [].slice.call(arguments)

  return function (api) {
    var chain = middlewares.map(function (fn) { return fn(api) })
    var stack = compose.apply(null, chain.concat(unhandledEffect))

    return function (next) {
      return function (action) {
        // Help people out if they forgot to .toJSON()
        if (action instanceof DeclarativePromise) {
          action = action.toJSON()
        }

        if (action.type !== 'EFFECT') {
          return next(action)
        }

        var q = Promise.resolve(stack(action.payload))
        action.meta && applyPromises(action.meta.then, q)
      }
    }

    function applyPromises (thens, q) {
      (thens || []).forEach(({success, failure, then}) => {
        applyPromises(q.then(function (res) { return api.dispatch(success(res)) }, function (err) { return api.dispatch(failure(err)) }), then)
      })
    }
  }
}

function unhandledEffect (effect) {
  console.warn('WARNING Unhandled Effect: ', effect)
}

function compose (/* ...funcs */) {
  var funcs = [].slice.call(arguments)
  return funcs.reduceRight(function (composed, f) { return f(composed) })
}

/**
 * Exports
 */

module.exports = effects
