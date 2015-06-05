'use strict';

require('../test-helpers');

const co          = require('co');
const expect      = require('chai').expect;

const Manager = require('../../lib/manager');

const dummyStrategy = require('../mocks/dummy-strategy');

const invalidStrategy = {
  authenticate: function () {
  }
};

describe('Manager', function () {
  let manager;
  beforeEach(function () {
    manager = new Manager();
    manager.addStrategy(dummyStrategy);
  });

  describe('addStrategy', function () {
    it('should throw error on missing method', function () {
      expect(manager.addStrategy.bind(manager, {})).to.throw();
    });
    it('should throw error on invalid authenticate method', function () {
      expect(manager.addStrategy.bind(manager, invalidStrategy)).to.throw();
    });
  });

  describe('authenticate', function () {
    beforeEach(function () {
      this.authenticate =
        co.wrap(manager.authenticate.bind(manager));
    });

    it('should return user when authenticated', function () {
      return co(function *() {
        this.params = {header: {'x-username': 'foobar'}};
        let user = yield this.authenticate(this.params);
        expect(user).not.to.be.null;
        expect(user).to.deep.equal({username: 'foobar'});
      }.bind(this));
    });

    it('should return false when user not found', function () {
      this.params = {header: {'x-username': 'barfoo'}};
      let user = this.authenticate(this.params);
      return expect(user).to.eventually.be.false;
    });

    it('should return false when user not found in scope', function () {
      this.params = {header: {'x-username': 'foobar'}};
      let user = this.authenticate(this.params, 'admin');
      return expect(user).to.eventually.be.false;
    });
  });
});
