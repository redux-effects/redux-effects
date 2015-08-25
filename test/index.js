/**
 * Imports
 */

import test from 'tape'
import {createStore, applyMiddleware} from 'redux'
import effects from '../src'

/**
 * Tests
 */

test('should work', ({plan, equal}) => {
  const store = create(mw)

  plan(1)
  store.dispatch({type: 'EFFECT', payload: {type: 'test'}})

  function mw (api) {
    return next => {
      return effect => {
        equal(effect.type, 'test')
      }
    }
  }
})

/**
 * Helpers
 */

function create (...mw) {
  return applyMiddleware(effects(...mw))(createStore)(() => {}, {})
}
