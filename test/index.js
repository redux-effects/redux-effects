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
  const store = create(effects, mw)

  plan(2)
  store.dispatch({type: 'test', meta: {steps: [[val => equal(val, 'someVal')]]}})
  store.dispatch({type: 'other', meta: {steps: [[() => {}, err => equal(err, 'otherVal')]]}})

  function mw (api) {
    return next => action =>
      action.type === 'test'
        ? Promise.resolve('someVal')
        : Promise.reject('otherVal')
  }
})

/**
 * Helpers
 */

function create (...mw) {
  return applyMiddleware(...mw)(createStore)(() => {}, {})
}
