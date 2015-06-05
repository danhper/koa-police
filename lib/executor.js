'use strict';

const _      = require('lodash');
const assert = require('assert');

function Executor(strategies) {
  this._strategies = [];

  strategies = strategies || [];
  assert(_.isArray(strategies), 'strategies must be an array');

  for (let strategy of strategies) {
    this.addStrategy(strategy);
  }
}

_.extend(Executor.prototype, {
  addStrategy: function (strategy) {
    this._checkModule(strategy);
    this._strategies.push(strategy);
  },

  authenticate: function *(context, scope) {
    for (let module of this._strategies) {
      let user = yield module.authenticate(context, scope);
      if (user) {
        return user;
      }
    }
    return false;
  },

  strategies: function () {
    return _.clone(this._strategies);
  },

  _checkModule: function (module) {
    assert(module.name, 'strategy must have a name');
    assert(module.authenticate, 'strategy authenticate method is required');
    assert(module.authenticate.constructor.name === 'GeneratorFunction',
      'strategy authenticate method must be a generator function');
  }
});

module.exports = Executor;
