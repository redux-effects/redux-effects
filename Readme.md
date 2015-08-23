# redux-effects

You write pure functions, redux-effects handles the rest.

## Installation

`npm install redux-effects`

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

All effectful action creators should export a promise-like interface (I use [declarative-promise](https://github.com/redux-effects/declarative-promise)), even if they are normally synchronous operations (e.g. cookies).  For example:

```javascript
import cookie from 'declarative-cookie'
import {createAction} from 'redux-actions'

function checkAuth () {
  return cookie('authToken')
    .then(setAuthToken)
}

const setAuthToken = createAction('SET_AUTH_TOKEN')
```

You can choose to use a different interface for binding to results, but under the hood it should probably create the same data-structure that [declarative-promise](https://github.com/redux-effects/declarative-promise) does, so that it works nicely with other packages.

## Benefits

  * Trivial isomorphism.  If your effect middleware is isomorphic, your app is isomorphic.
  * Powerful meta-programming facilities (e.g. request caching)
  * More testable code
  * Better insights into what is happening in your application (e.g. logging effects)

## Writing effectful middleware

Effects middleware look essentially just like regular redux middleware, with a few additional specifications.  If your middleware is doing something asynchronous, it should return a promise.  If you are accessing a synchronous impurity (e.g. cookies), you may return it by value.  This list may grow over time, but for now that's it.

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

  * [redux-effects-fetch](https://github.com/redux-effects/redux-effects-fetch) - HTTP Requests
  * [redux-effects-cookie](https://github.com/redux-effects/redux-effects-cookie) - Cookie get/set
  * [redux-effects-location](https://github.com/redux-effects/redux-effects-location) - Location (window.location) binding and setting

### Action creators

Interfaces for creating those effect actions:

  * [declarative-fetch](https://github.com/redux-effects/declarative-fetch)
  * [declarative-cookie](https://github.com/redux-effects/declarative-cookie)
  * [declarative-location](https://github.com/redux-effects/declarative-location)
  * [declarative-promise](https://github.com/redux-effects/declarative-promise) - Should probably only be consumed by other action creators

*Note: All they do is provide an interface for creating plain JS objects, so if you don't like
the interface, you can just create your own*
