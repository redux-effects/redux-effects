# redux-effects

You write pure functions, redux-effects handles the rest.

## Installation

`npm install redux-effects`

## Benefits

  * Trivial isomorphism.  If your effect middleware is isomorphic, your app is isomorphic.
  * Powerful meta-programming facilities (e.g. request caching)
  * More testable code
  * Better insights into what is happening in your application (e.g. logging effects)
  * Better ability to serialize state

## Usage

The `redux-effects` package offers very little functionality on its own.  It provides an isolated, namespaced middleware stack for other effectful redux middlewares.  For instance:

```javascript
import effects from 'redux-effects'
import fetch from 'redux-effects-fetch'
import cookie from 'redux-effects-cookie'
import location from 'redux-effects-location'

applyMiddleware(effects(fetch, cookie, location))
```

This would enable you to write pure actions that are capable of manipulating each of the respective effect domains.

### In action creators

All effectful action creators should return a declarative action rather than an impure value, even if their operation is normally synchronous (e.g. Math.random or cookie retrieval).  In order to operate on the values returned by these actions, you need to specify your handlers in `.meta.steps` in the action object.  It is recommended that you use a composition library like [bind-effect](https://github.com/redux-effects/bind-effect) or [declarative-promise](https://github.com/redux-effects/declarative-promise) to make that feel more natural and be less syntactically cumbersome.

```javascript
import bind from 'bind-effect'
import cookie from 'declarative-cookie'
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
  type: 'EFFECT',
  payload: someEffectfulAction,
  steps: [
    [success, failure]
  ]
}
```

Since this is cumbersome to write out, there are libraries to help with it:

  * [bind-effect](https://github.com/redux-effects/bind-effect)
  * [declarative-promise](https://github.com/redux-effects/declarative-promise)

But it is important to understand that ultimately these libraries just produce simple plain JS objects as described above, and you are totally free to create your own composition interfaces that behave exactly the way you want if you don't like these.  There is nothing magical going on.

## Writing effectful middleware

Effects middleware look essentially just like regular redux middleware, with a few additional specifications:

  * If your middleware is doing something asynchronous, it should return a promise.
  * If you are accessing a synchronous impurity (e.g. cookies), you may return it by value.

This list may grow over time, but for now that's it.

### Example - Simple cookie middleware

```javascript
import cookie from 'component-cookie'

export default function ({dispatch, getState}) {
  return next => effect => {
    if (effect.type !== 'COOKIE') {
      return next(action)
    }

    switch (effect.verb) {
      case 'set':
        return cookie(effect.name, effect.value)
      case 'get':
        return cookie(effect.name)
    }
  }
}
```

### Example - Isomorphic cookie middleware

```javascript
import _cookie from 'component-cookie'

export default function (cookieMap) {
  return ({dispatch, getState}) => next => effect => {
    if (effect.type !== 'COOKIE') {
      return next(action)
    }

    switch (effect.verb) {
      case 'set':
        return cookie(effect.name, effect.value)
      case 'get':
        return cookie(effect.name)
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

## Ecosystem

### Middleware

Plugins that enable various effects:

  * [redux-effects-timeout](https://github.com/redux-effects/redux-effects-timeout) - setTimeout/setInterval/requestAnimationFrame
  * [redux-effects-fetch](https://github.com/redux-effects/redux-effects-fetch) - HTTP Requests
  * [redux-effects-cookie](https://github.com/redux-effects/redux-effects-cookie) - Cookie get/set
  * [redux-effects-location](https://github.com/redux-effects/redux-effects-location) - Location (window.location) binding and setting
  * [redux-effects-random](https://github.com/redux-effects/redux-effects-random) - Generate random numbers
### Action creators
  * [redux-effects-events](https://github.com/redux-effects/redux-effects-events) - Dispatch actions in response to `window/document` events (e.g. `scroll/resize/popstate/etc`)
  * [redux-effects-credentials](https://github.com/redux-effects/redux-effects-credentials) - Automatically decorate your fetch requests with credentials stored in state if the url matches a certain pattern.

### Action creators
Interfaces for creating those effect actions:

  * [declarative-timeout](https://github.com/redux-effects/declarative-timeout)
  * [declarative-fetch](https://github.com/redux-effects/declarative-fetch)
  * [declarative-cookie](https://github.com/redux-effects/declarative-cookie)
  * [declarative-location](https://github.com/redux-effects/declarative-location)
  * [declarative-random](https://github.com/redux-effects/declarative-random)
  * [declarative-events](https://github.com/redux-effects/declarative-events)

### Composition helpers

  * [bind-effect](https://github.com/redux-effects/bind-effect) - `bind(action, success, failure)`
  * [declarative-promise](https://github.com/redux-effects/declarative-promise) - Wrap your actions in a promise-like interface

