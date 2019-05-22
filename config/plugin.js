'use strict';

// had enabled by egg
// exports.static = true;
exports.mongoose = {
  enable: true,
  package: 'egg-mongoose',
};

exports.oss = {
  enable: true,
  package: 'egg-oss',
};

exports.oAuth2Server = {
  enable: true,
  package: 'egg-oauth2-server',
};

exports.io = {
  enable: true,
  package: 'egg-socket.io',
};

exports.alinode = {
  enable: true,
  package: 'egg-alinode'
};

exports.mysql = {
    enable: true,
    package: 'egg-mysql',
};

exports.redis = {
    enable: true,
    package: 'egg-redis',
};
