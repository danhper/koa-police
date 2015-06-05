'use strict';

const _ = require('lodash');

module.exports = {
  name: 'dummy',
  _authorizedUsers: [{username: 'foobar'}],
  authenticate: function *(context, scope) {
    scope = scope || 'user';
    if (scope === 'user') {
      let username = context.header && context.header['x-username'];
      let user = username && _.find(this._authorizedUsers, 'username', username);
      return user;
    }
    return false;
  }
};
