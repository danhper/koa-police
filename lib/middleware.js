'use strict';

const _             = require('lodash');
const Manager       = require('./manager');
const PolicyManager = require('./policy-manager');
const assert        = require('assert');

module.exports = function (options) {
  assert(options && options.strategies && options.policies,
    'strategies and policies are required');
  assert(_.isArray(options.strategies), 'strategies should be an array');
  assert(_.isArray(options.policies), 'policies should be an array');

  let manager = new Manager();
  for (let strategy of options.strategies) {
    manager.addStrategy(strategy);
  }
  let policyManager = new PolicyManager(manager);
  for (let policy of options.policies) {
    policyManager.addPolicy(policy);
  }

  return function *(next) {
    let entities = yield policyManager.applyPolicies(this);
    _.assign(this.state, entities);
    yield next;
  };
};
