# koa-police
[![Build Status](https://travis-ci.org/tuvistavie/koa-police.svg)](https://travis-ci.org/tuvistavie/koa-police) [![Coverage Status](https://coveralls.io/repos/tuvistavie/koa-police/badge.svg)](https://coveralls.io/r/tuvistavie/koa-police)

An easy to use and extend authentication library for [Koa](http://koajs.com/).

It is compatible with node >= 0.11 with the `--harmony` flag, and any version of [io.js](https://iojs.org/en/index.html).

## Installation

Simply run

```sh
$ npm install --save koa-police
```

## Getting started

`koa-police` uses policies to select which path should be protected,
and is used as a normal Koa middleware.

When initializing the middleware, you just need to provide the strategies and
policies you want to use. Here is an example with some dummy strategy.

```javascript
var koa        = require('koa');
var koaPolice  = require('koa-police');

var userTokens = {
  'very-secure-token': {id: 1, username: 'hello'}
};

var dummyStrategy = {
  name: 'dummy',
  authenticate: function *(context, scope) {
    if (scope === 'user' && context.header.authorization) {
      return userTokens[context.header.authorization];
    }
    return false;
  }
};

var app = koa();

app.use(koaPolice({
  defaultStrategies: [dummyStrategy],
  policies: [
    {path: '/admin', scope: 'admin'},
    {path: /\/users.*/, scope: 'user', enforce: false}
  ]
}));

app.use(function *() {
  this.body = {user: this.state.user, admin: this.state.admin};
});
```

This will try to authenticate an admin for the `/admin` path, and to
authenticate a user for any path that matches the regexp `/users.*`.
By default, all policies are enforced, meaning that if no strategy
succeeded to authenticate, and error will be raised.
However, by passing `enforce: false`, the user will be set if found,
and the middleware will be noop otherwise.

The `defaultStrategies` will be used on every policy, unless you explicitly
set `strategies` on the policy object in which case these will be overriden.

When the authentication succeeds, the value returned by the strategy that
succeeded first will be stored in `context.state[scope]` where the `scope`
is the policy scope defaulting to user.

When the authentication fails, an `AuthenticationError` is thrown, so you
just need to check for it in your error handler and do what you want.

## Handling authentication errors

Thanks to Koa middlewares, handling authentication error is trivial,
you just need to use a middleware before calling the `koa-police` middleware
and handle errors as usual. Here is an example middleware:

```javascript
app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    if (err instanceof koaPolice.AuthenticationError) {
      console.log('rejected by: ' + err.policy);
      this.status = 401;
      this.body = 'You are not authorized';
    }
    // handle other errors if you want
  }
});
```

## Custom strategies

Strategies are not shipped with `koa-police` directly, I am currently working
on some reusable strategies, but it is very easy to create your own.
A strategy is an object with a property called `name`, which should be unique and to the strategy, and generator function called `authenticate`.
`authenticate` takes the current request context, as well as the scope
trying to be authenticated. So, for example, the strategy used in the
example above is valid, though not very useful.

Here is a sample strategy trying to authenticate `user`, using `koa-session`.
`findUser` should be something to find the user from a database, or any other backend.

```javascript
var sessionStrategy = {
  name: 'session',
  authenticate: function *(context, scope) {
    if (scope !== 'user' || !context.session.userId) {
      return false;
    }
    return yield findUser(context.session.userId);
  }
};
```

You can also find a full working example using `htpasswd` files in [the koa-police-htpasswd example directory](https://github.com/tuvistavie/koa-police-htpaswd/tree/master/example).

## Motivations

Most authentication libraries around are for Express, or other Connect based
frameworks.
One of the major strength of Koa (in my opinion) is that middlewares
can be implemented in a very clean way. The main goal of this library is
to take advantage of this to get a cleaner authentication process, avoiding
[callback hell](http://callbackhell.com/) and promises all around the place.

## Contributing

This library is still in early stage, but I am open to any help, either to
improve it, or to create cool reusable strategies.
