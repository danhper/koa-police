'use strict';

const _                   = require('lodash');
const assert              = require('assert');
const Policy              = require('./policy');
const Executor            = require('./executor');
const AuthenticationError = require('./authentication-error');

function PolicyManager(policies, defaultStrategies) {
  if (defaultStrategies) {
    this._defaultExecutor = new Executor(defaultStrategies);
  }

  this._policies = [];

  policies = policies || [];
  assert(_.isArray(policies), 'policies should be an array');

  for (let policy of policies) {
    this.addPolicy(policy);
  }
}

_.extend(PolicyManager.prototype, {
  policiesFor: function (path, method) {
    let policies = [];
    for (let policy of this._policies) {
      if (policy.appliesTo(path, method)) {
        policies.push(policy);
      }
    }
    return policies;
  },

  applyPolicies: function *(context) {
    let policies = this.policiesFor(context.path, context.method);
    let entities = {};
    for (let policy of policies) {
      if (entities[policy.scope]) {
        continue;
      }
      entities[policy.scope] = yield this.applyPolicy(policy, context);
    }
    return entities;
  },

  applyPolicy: function *(policy, context) {
    let entity, errMessage;
    try {
      entity = yield policy.executor.authenticate(context, policy.scope);
    } catch (err) {
      if (err instanceof AuthenticationError) {
        errMessage = err.message;
      } else {
        throw err;
      }
    }
    if (!entity && policy.enforce) {
      throw new AuthenticationError(errMessage || 'authentication failed', policy);
    }
    return entity;
  },

  addPolicy: function (policy) {
    if (!(policy instanceof Policy)) {
      policy = new Policy(policy);
    }
    if (policy.strategies) {
      policy.executor = new Executor(policy.strategies);
    } else {
      policy.executor = this._defaultExecutor;
    }
    assert(policy.executor,
      'you must provide a default strategy or a strategy for each policy');
    this._policies.push(policy);
  },

  policies: function () {
    return Object.create(this._policies);
  }
});

module.exports = PolicyManager;
