'use strict';

const _      = require('lodash');
const assert = require('assert');

function Manager() {
  this._strategies = [];
}

_.extend(Manager.prototype, {
  addStrategy: function (module) {
    this._checkModule(module);
    this._strategies.push(module);
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
    assert(module.authenticate, 'module authenticate method is required');
    assert(module.authenticate.constructor.name === 'GeneratorFunction',
      'authenticate must be a generator function');
  }
});

module.exports = Manager;
