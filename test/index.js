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
  store.dispatch({type: 'EFFECT_COMPOSE', payload: {type: 'test'}, meta: {steps: [[val => equal(val, 'someVal')]]}})
  store.dispatch({type: 'EFFECT_COMPOSE', payload: {type: 'other'}, meta: {steps: [[() => {}, err => equal(err, 'otherVal')]]}})

  function mw (api) {
    return next => action =>
      action.type === 'test'
        ? Promise.resolve('someVal')
        : Promise.reject('otherVal')
  }
})

test('unhandled rejections should pass through', ({plan, fail, pass}) => {
  const store = create(effects, mw);

  plan(1)
  const promise = store.dispatch({type: 'EFFECT_COMPOSE', payload: {type: 'test'}, meta: {steps: [[x => x]]}})

  promise.then(fail, pass);

  function mw (api) {
    return next => action =>
      Promise.reject('alwaysReject')
  }
})

/**
 * Helpers
 */

function create (...mw) {
  return applyMiddleware(...mw)(createStore)(() => {}, {})
}
