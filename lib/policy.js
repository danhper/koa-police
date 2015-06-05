'use strict';

const _      = require('lodash');
const assert = require('assert');

function Policy(policy) {
  _.assign(this, policy);
  this._assertValid();
  this._normalize();
}

_.extend(Policy.prototype, {
  _assertValid: function () {
    assert(_.isString(this.path) || _.isRegExp(this.path),
     'policy path must be a string or a regex');
    assert(_.isUndefined(this.scope) || _.isString(this.scope),
     'scope must be a string');
  },

  _normalize: function () {
    this.scope = this.scope || 'user';
    if (_.isUndefined(this.enforce)) {
      this.enforce = true;
    }
  },

  toString: function () {
    return 'Path: ' + this.path + ', scope: ' + this.scope + ', enforce: ' + this.enforce;
  },

  appliesTo: function (path) {
    let m = path.match(this.path);
    return !!m && m.index === 0 && m[0] === path;
  },

  hasStrategy: function (name) {
    if (!this.executor) {
      return false;
    }
    return _.some(this.executor.strategies(), {name: name});
  }
});

module.exports = Policy;
