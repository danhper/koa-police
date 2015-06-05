# koa-police

An easy to use and extend authentication library for [Koa](http://koajs.com/).

It is compatible with node >= 0.11 and the `--harmony` flag, and any version of [io.js](https://iojs.org/en/index.html).

## Installation

Simply run

```sh
$ npm install --save koa-police
```

## Usage

You just need to provide the strategies and providers when initializing the middleware, here is an example with some dummy strategy.

```javascript
var koa        = require('koa');
var koaPolice  = require('koa-police');

var userTokens = {
  'very-secure-token': {id: 1, username: 'hello'}
};

var dummyStrategy = {
  authenticate: function *(context, scope) {
    if (scope === 'user' && context.header.authorization) {
      return userTokens[context.header.authorization];
    }
    return false;
  }
};

var app = koa();

app.use(koaPolice({
  strategies: [dummyStrategy],
  policies: [
    {path: '/admin', scope: 'admin'},
    {path: /\/users.*/, scope: 'user', enforce: false}
  ]
}));

app.use(function *() {
  // your app, as usual
});
```

This will try to authenticate an admin for the `/admin` path, and to
authenticate a user for any path that matches the regexp `/users.*`.
By default, all policies are enforced, meaning that if no strategy
succeeded to authenticate, and error will be raised. However,
by passing `enforce: false`, the user will be set if found, and the middleware
will be noop otherwise.

When the authentication succeeds, the value returned by the strategy that
succeeded first will be stored in `context.state[scope]` where the `scope`
is the policy scope defaulting to user.

When the authentication fails, an `AuthenticationError` is thrown, so you
just need to check for it in your error handler and do what you want.

## Custom strategies

Strategies are not shipped with `koa-police` directly, I am currently working
on some reusable strategies, but it is very easy to create your own.
A strategy is an object with a generator function called `authenticate`.
`authenticate` takes the current request context, as well as the scope
trying to be authenticated. So, for example, the strategy used in the
example above is valid, though not very useful.

Here is a sample strategy trying to authenticate `user`, using `koa-session`.
`findUser` should be something to find the user from a database, or any other backend.

```javascript
var sessionStrategy = {
  authenticate: function *(context, scope) {
    if (scope !== 'user' || !context.session.userId) {
      return false;
    }
    return yield findUser(context.session.userId);
  }
};
```

## Motivations

Most authentication libraries around are for Express, or other Connect based
frameworks.
One of the major strength of Koa (in my opinion) is that middlewares
can be implemented in a very clean way. The main goal of this library is
to take advantage of this to get a cleaner authentication process, avoiding
[callback hell](http://callbackhell.com/) and promises all around the place.

## Contributing

This library is still in early stage, but I am open to any help, either to
improve it, or to create reusable strategies.
