'use strict';

require('../test-helpers');

const expect        = require('chai').expect;
const request       = require('supertest');
const koa           = require('koa');
const koaPolice     = require('../../lib/middleware');
const dummyStrategy = require('../mocks/dummy-strategy');

let app = koa();
app.use(koaPolice({
  defaultStrategies: [dummyStrategy],
  policies: [{path: /\/private.*/}, {path: /\/admin.*/, scope: 'admin'}]
}));
app.use(function *() {
  this.body = this.state.user || 'not logged in';
});
let server = app.listen(9857);

describe('authentication middleware', function () {
  context('when not logged in', function () {
    it('should return 401', function (done) {
      request(server).get('/private/foo').expect(401, done);
    });
  });

  context('when logged in', function () {
    beforeEach(function () {
      this.request = function (path) {
        return request(server)
          .get(path)
          .set('X-Username', 'foobar');
      };
    });
    context('when scope is correct', function () {
      it('should passthrough', function (done) {
        this.request('/private/bar').expect(200, done);
      });
      it('should set user', function (done) {
        this.request('/private/bar').expect(function (res) {
          expect(res.body.username).to.eq('foobar');
        }).end(done);
      });
    });

    context('when scope is not correct', function () {
      it('should return 401', function (done) {
        this.request('/admin/foo').expect(401, done);
      });
    });
  });
});
