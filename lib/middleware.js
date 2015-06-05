'use strict';

const _             = require('lodash');
const PolicyManager = require('./policy-manager');
const assert        = require('assert');

module.exports = function (options) {
  assert(options && options.policies, 'policies are required');

  let policyManager = new PolicyManager(options.policies, options.defaultStrategies);

  return function *(next) {
    let entities = yield policyManager.applyPolicies(this);
    _.assign(this.state, entities);
    yield next;
  };
};
