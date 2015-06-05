'use strict';

function AuthenticationError(policy) {
  this.message = 'unable to authenticate with policy: ' + policy.toString();
  this.policy = policy;
  this.status = 401;
}
AuthenticationError.prototype = Object.create(Error.prototype, {
  constructor: AuthenticationError.constructor
});

module.exports = AuthenticationError;
