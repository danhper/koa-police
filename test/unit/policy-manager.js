'use strict';

require('../test-helpers');

const co            = require('co');
const expect        = require('chai').expect;
const dummyStrategy = require('../mocks/dummy-strategy');
const PolicyManager = require('../../lib/policy-manager');
const Policy        = require('../../lib/policy');
const AuthError     = require('../../lib/authentication-error');

const MyError = function (message) {
  this.message = message;
};
MyError.prototype = Object.create(Error.prototype, {constructor: MyError.constructor});

const allThroughStrategy = {
  name: 'allThrough',
  authenticate: function *() {
    return 'all through, yeahh';
  }
};

const failingStrategy = {
  name: 'throws-auth',
  authenticate: function *() {
    throw new AuthError('whatever');
  }
};

const erroringStrategy = {
  name: 'i-have-errors',
  authenticate: function *() {
    throw new MyError('something really not cool happened');
  }
};

describe('PolicyManager', function () {
  let policyManager;
  beforeEach(function () {
    policyManager = new PolicyManager([], [dummyStrategy]);
    policyManager._policies = [];
    policyManager.addPolicy(new Policy({path: '/secure'}));
    policyManager.addPolicy({path: /\/dashboard.*/, enforce: false});
    policyManager.addPolicy({path: /\/dashboard\/profile.*/, enforce: true});
    policyManager.addPolicy({path: /\/dashboard\/admin.*/, scope: 'admin'});
    policyManager.addPolicy({path: '/not-very-safe', strategies: [allThroughStrategy]});
    policyManager.addPolicy({path: '/throwing-auth-error', strategies: [failingStrategy]});
    policyManager.addPolicy({path: '/throwing-error', strategies: [erroringStrategy]});
    policyManager.policies().forEach(function (p) {
      expect(p).to.be.an.instanceof(Policy);
    });
  });

  describe('policiesFor', function () {
    it('should return all policies for path', function () {
      expect(policyManager.policiesFor('/')).to.have.length(0);
      expect(policyManager.policiesFor('/secure')).to.have.length(1);
      expect(policyManager.policiesFor('/dashboard')).to.have.length(1);
      expect(policyManager.policiesFor('/dashboard/profile')).to.have.length(2);
      expect(policyManager.policiesFor('/dashboard/admin')).to.have.length(2);
    });
  });

  describe('applyPolicy', function () {
    const policy = function (n) {
      return policyManager.policies()[n];
    };

    beforeEach(function () {
      this.applyPolicy =
        co.wrap(policyManager.applyPolicy.bind(policyManager));
    });

    context('when logged in', function () {
      it('should return entity', function () {
        let user = {username: 'foobar'};
        expect(this.applyPolicy(policy(1), user)).to.eventually.deep.equal(user);
      });
    });

    context('when not logged in', function () {
      it('should return false when policy not enforced', function () {
        expect(this.applyPolicy(policy(1), {username: 'barfoo'})).to.eventually.be.false;
      });

      it('should throw when policy enforced', function () {
        expect(this.applyPolicy(policy(2), {username: 'foobar'})).to.eventually.be.rejected;
      });
    });
  });

  describe('applyPolicies', function () {
    beforeEach(function () {
      this.applyPolicies =
        co.wrap(policyManager.applyPolicies.bind(policyManager));
    });

    it('should apply all policies', function () {
      expect(this.applyPolicies({path: '/'})).to.eventually.deep.equal({});
      expect(this.applyPolicies({path: '/dashboard/admin'})).to.eventually.be.rejected;
    });

    it('should return scopes', function () {
      let request = {path: '/dashboard/profile', username: 'foobar'};
      expect(this.applyPolicies(request)).to.eventually.deep.equal({user: {username: 'foobar'}});
    });

    describe('strategy override', function () {
      it('should use strategies provided to policy', function () {
        let promise = this.applyPolicies({path: '/not-very-secure'});
        expect(promise).to.eventually.equal('all through, yeahh');
      });
    });

    describe('handling of throwing strategies', function () {
      it('should handle thrown authentication errors', function () {
        let promise = this.applyPolicies({path: '/throwing-auth-error'});
        expect(promise).to.be.rejectedWith(AuthError);
      });

      it('should bubble up other errors', function () {
        let promise = this.applyPolicies({path: '/throwing-error'});
        expect(promise).to.be.rejectedWith(MyError);
      });
    });
  });
});
