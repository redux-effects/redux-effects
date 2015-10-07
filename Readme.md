# redux-effects

Virtual DOM for effects and impurities.  You write pure functions, redux-effects handles the rest.

## Installation

`npm install redux-effects`

## Benefits

  * Trivial universality.  If your effect middleware is universal, your app is universal.
  * [Powerful meta-programming facilities](#metaprogramming) (e.g. request caching)
  * More testable code
  * Better insights into what is happening in your application (e.g. logging effects)
  * Better ability to serialize state

## Usage

This package gives you the ability to compose effectful actions together into promise-like chains, and as such, it must come before all other efffectful redux middlewares in your stack, like so:

```javascript
import effects from 'redux-effects'
import fetch from 'redux-effects-fetch'
import cookie from 'redux-effects-cookie'
import location from 'redux-effects-location'

applyMiddleware(effects, fetch, cookie, location)
```

### In action creators

All effectful action creators should return a declarative object describing the effect to be done, even if their operation is normally synchronous*.  In order to operate on the values returned by these actions, you need to specify your handlers in `.meta.steps` in the action object.  This library comes with a composition utility `bind`, but you are free to write your own such as [declarative-promise](https://github.com/redux-effects/declarative-promise).

**E.g. Math.random or accessing cookies.  These values are also impure, even though they are synchronous, because they are non-deterministic with respect to your function's parameters.*

```javascript
import {bind} from 'redux-effects'
import {cookie} from 'redux-effects-cookie'
import {createAction} from 'redux-actions'

function checkAuth () {
  return bind(cookie('authToken'), setAuthToken)
}

const setAuthToken = createAction('SET_AUTH_TOKEN')
```

The values returned by your actions will be passed to the handlers specified on your action object.  Then, what your handlers return will be dispatched back into redux to either trigger other effects or be preserved in state.  If your functions do not return a value, they do not do anything.  Their only ability to effect the world is by ultimately dispatching actions that trigger state reducers, or by triggering effects that cause state to be preserved elsewhere (e.g. a POST request to an API server).

### Effect composition

Effects compose by placing `steps` in `.meta.steps` on the action object.  E.g.

```javascript
{
  type: 'EFFECT_COMPOSE',
  payload: {
    type: 'FETCH'
    payload: {url: '/some/thing', method: 'GET'}
  },
  meta: {
    steps: [
      [success, failure]
    ]
  }
}
```

Since this is cumbersome to write out, there are libraries / action creators to help with it:

  * `bind` which comes bundled with redux-effects
  * [declarative-promise](https://github.com/redux-effects/declarative-promise)

But it is important to understand that ultimately these libraries just produce plain JS objects, and you are totally free to create your own composition interfaces that behave exactly the way you want if you don't like these.  There is nothing magical going on.

## Writing effectful middleware

Effects middleware look essentially just like regular redux middleware, except that it _*MUST*_ return a promise.  If it does not return a promise, it won't compose with other effects, and so won't be very useful to anyone.

### Example - Simple cookie middleware

```javascript
import cookie from 'component-cookie'

export default function ({dispatch, getState}) {
  return next => action => {
    if (action.type !== 'COOKIE') {
      return next(action)
    }

    switch (action.verb) {
      case 'set':
        return Promise.resolve(cookie(action.name, action.value))
      case 'get':
        return Promise.resolve(cookie(action.name))
    }
  }
}
```

### Example - Universal cookie middleware

```javascript
import _cookie from 'component-cookie'

export default function (cookieMap) {
  return ({dispatch, getState}) => next => action => {
    if (action.type !== 'COOKIE') {
      return next(action)
    }

    switch (action.verb) {
      case 'set':
        return Promise.resolve(cookie(action.name, action.value))
      case 'get':
        return Promise.resolve(cookie(action.name))
    }
  }

  function cookie (name, value) {
    if (arguments.length === 2) {
      if (cookieMap) cookieMap[name] = value
      else _cookie(name, value)
    }

    return cookieMap ? cookieMap[name] : _cookie(name)
  }
}
```

With this form, you can simply initialize your cookie middleware with a map of cookies.  E.g.

```javascript
function (req, res, next) {
  req.store = applyMiddleware(effects(cookie(req.cookies)))(createStore)
}
```

## Metaprogramming

Where this approach gets really interesting is when you start applying transformations to your effects.  Normally these things are implemented in disparate and often hacky ways.  But when you have declarative descriptions of all of your effects, you can unify your transformations into your redux middleware stack, and they can be completely orthogonal to the actual implementations of the effects themselves.  Here are some examples:

### Request caching

```javascript
function httpCache () {
  const {get, set, check} = cache()

  return next => action =>
   !isGetRequest(action)
      ? next(action)
      : check(action.payload.url)
        ? Promise.resolve(get(action.payload.url))
        : next(action).then(set(action.payload.url))
}
```

### Response normalization

```javascript
function normalize () {
  return next => action =>
    isGetRequest(action)
      ? next(action).then(normalizr)
      : next(action)
}
```

Note that while these examples both transform http requests, they are completely orthogonal to the actual implementation of those requests, and completely orthogonal to the action creator interface you choose to use to generate your descriptors.  That means you can:

  * Swap out your http request implementation
  * Change your action creator interface
  * Use a different effect composition strategy
  * ...And most importantly, compose other transformations

And not have to change your transform middleware at all.

## Ecosystem

### Effect drivers

Plugins that enable various effects:

  * [redux-effects-timeout](https://github.com/redux-effects/redux-effects-timeout) - setTimeout/setInterval/requestAnimationFrame
  * [redux-effects-fetch](https://github.com/redux-effects/redux-effects-fetch) - HTTP Requests
  * [redux-effects-cookie](https://github.com/redux-effects/redux-effects-cookie) - Cookie get/set
  * [redux-effects-location](https://github.com/redux-effects/redux-effects-location) - Location (window.location) binding and setting
  * [redux-effects-random](https://github.com/redux-effects/redux-effects-random) - Generate random numbers
  * [redux-effects-events](https://github.com/redux-effects/redux-effects-events) - Dispatch actions in response to `window/document` events (e.g. `scroll/resize/popstate/etc`)
  * [redux-effects-credentials](https://github.com/redux-effects/redux-effects-credentials) - Automatically decorate your fetch requests with credentials stored in state if the url matches a certain pattern.

### Alternate composition middleware

  * [redux-gen](https://github.com/weo-edu/redux-gen)

### Composition helpers

  * [declarative-promise](https://github.com/redux-effects/declarative-promise) - Wrap your actions in a promise-like interface
