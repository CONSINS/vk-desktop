'use strict';

const querystring = require('querystring');
const request = require('./request');

const API_VERSION = '5.87';

let methods = [],
    openedCaptcha = false;

let addToQueue = (method, params) => {
  return new Promise((resolve) => {
    methods.push({ method, params, resolve });
  });
}

setInterval(() => {
  if(methods[0] && !openedCaptcha) {
    method(methods[0].method, methods[0].params, methods[0].resolve);
    methods.splice(0, 1);
  }
}, 1000 / 3);

let method = (name, params, _resolve) => {
  return new Promise(async (resolve) => {
    params = params || {};
    params.v = params.v || API_VERSION;
    params.access_token = params.access_token || (users.get() || {}).access_token;

    let data = await request({
      host: 'api.vk.com',
      path: `/method/${name}?${querystring.stringify(params)}`
    });

    (_resolve || resolve)(JSON.parse(data));

    // TODO: add captcha
  });
}

module.exports = addToQueue;