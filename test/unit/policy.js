'use strict';

require('../test-helpers');

const expect   = require('chai').expect;
const Policy   = require('../../lib/policy');
const Executor = require('../../lib/executor');

describe('Policy', function () {
  describe('creation', function () {
    it('should fail without path', function () {
      expect(function () {
        return new Policy();
      }).to.throw(Error);
    });

    it('should fail with invalid path', function () {
      expect(function () {
        return new Policy({path: []});
      }).to.throw(Error);
    });

    it('should work with string and regexp paths', function () {
      expect(function () {
        return new Policy({path: '/dashboard'});
      }).not.to.throw(Error);
      expect(function () {
        return new Policy({path: /\/dashboard.*/});
      }).not.to.throw(Error);
    });

    it('should assign default scope', function () {
      expect(new Policy({path: '/dashboard'}).scope).to.eq('user');
    });

    it('should not override scope', function () {
      expect(new Policy({path: '/dashboard', scope: 'admin'}).scope).to.eq('admin');
    });

    it('should enforce by default', function () {
      expect(new Policy({path: '/dashboard'}).enforce).to.be.true;
    });

    it('should not override enforce', function () {
      expect(new Policy({path: '/dashboard', enforce: false}).enforce).to.be.false;
    });
  });

  describe('appliesTo', function () {
    it('should return true with equal strings', function () {
      let policy = new Policy({path: '/dashboard'});
      expect(policy.appliesTo('/dashboard')).to.be.true;
    });

    it('should return true with matching regex', function () {
      let policy = new Policy({path: /\/dashboard\/public.*/});
      expect(policy.appliesTo('/dashboard/public')).to.be.true;
      expect(policy.appliesTo('/dashboard/public/foo')).to.be.true;
    });

    it('should return false otherwise', function () {
      let policy = new Policy({path: /\/dashboard\/public\/.*/});
      expect(policy.appliesTo('/foo/dashboard')).to.be.false;
      expect(policy.appliesTo('/dashboard')).to.be.false;
    });
  });

  describe('toString', function () {
    it('should pretty format policy', function () {
      let policy = new Policy({path: /\/dashboard.*/, scope: 'user', enforce: false});
      let expected = 'Path: /\\/dashboard.*/, scope: user, enforce: false';
      expect(policy.toString()).to.equal(expected);
    });
  });

  describe('hasStrategy', function () {
    let policy;
    beforeEach(function () {
      policy = new Policy({path: 'foo'});
      policy.executor = new Executor([require('../mocks/dummy-strategy')]);
    });
    it('should return true when strategy present', function () {
      expect(policy.hasStrategy('dummy')).to.be.true;
    });

    it('should return false otherwise', function () {
      expect(policy.hasStrategy('inexistent')).to.be.false;
    });
  });
});
