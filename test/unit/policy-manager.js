'use strict';

require('../test-helpers');

const co            = require('co');
const expect        = require('chai').expect;
const dummyStrategy = require('../mocks/dummy-strategy');
const Manager       = require('../../lib/manager');
const PolicyManager = require('../../lib/policy-manager');
const Policy        = require('../../lib/policy');

describe('PolicyManager', function () {
  let policyManager;
  beforeEach(function () {
    let manager = new Manager();
    policyManager = new PolicyManager(manager);
    manager.addStrategy(dummyStrategy);
    policyManager._policies = [];
    policyManager.addPolicy(new Policy({path: '/secure'}));
    policyManager.addPolicy({path: /\/dashboard.*/, enforce: false});
    policyManager.addPolicy({path: /\/dashboard\/profile.*/, enforce: true});
    policyManager.addPolicy({path: /\/dashboard\/admin.*/, scope: 'admin'});
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
  });
});
