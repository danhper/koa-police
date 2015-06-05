'use strict';

const _                   = require('lodash');
const Policy              = require('./policy');
const AuthenticationError = require('./authentication-error');

function PolicyManager(manager) {
  this.manager = manager;
  this._policies = [];
}

_.extend(PolicyManager.prototype, {
  policiesFor: function (path) {
    let policies = [];
    for (let policy of this._policies) {
      if (policy.appliesTo(path)) {
        policies.push(policy);
      }
    }
    return policies;
  },

  applyPolicies: function *(context) {
    let policies = this.policiesFor(context.path);
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
    let entity = yield this.manager.authenticate(context, policy.scope);
    if (!entity && policy.enforce) {
      throw new AuthenticationError(policy);
    }
    return entity;
  },

  addPolicy: function (policy) {
    if (!(policy instanceof Policy)) {
      policy = new Policy(policy);
    }
    this._policies.push(policy);
  },

  policies: function () {
    return Object.create(this._policies);
  }
});

module.exports = PolicyManager;
