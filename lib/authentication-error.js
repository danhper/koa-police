'use strict';

function AuthenticationError(message, policy) {
  this.message = '';
  if (policy) {
    this.message = 'unable to authenticate with policy: ' + policy.toString() + '\n';
  }
  this.message += message;
  this.policy = policy;
  this.status = 401;
}
AuthenticationError.prototype = Object.create(Error.prototype, {
  constructor: AuthenticationError.constructor
});

module.exports = AuthenticationError;
