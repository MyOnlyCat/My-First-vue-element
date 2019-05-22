'use strict';

module.exports = appInfo => {
  const config = exports = {};

  config.mongoose = {
    client: {
      url: 'mongodb://hcc:Yilunjk123@112.74.88.166:3308/hcc_sms?authMode=scram-sha1&rm.keepAlive=true&rm.tcpNoDelay=true&rm.nbChannelsPerNode=10',
      options: {
        useMongoClient: true,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 10, // Maintain up to 10 socket connections
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
      },
    }
  };

  config.onerror = {
    html(err, ctx) {
      ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}, \n header: ${JSON.stringify(ctx.request.header)}`);
      // html hander
      ctx.body = '<h3>error</h3>';
      ctx.status = 500;
    },
    json(err, ctx) {
      ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}, \n header: ${JSON.stringify(ctx.request.header)}`);
      // json hander
      ctx.body = { message: 'error' };
      ctx.status = 500;
    },
    jsonp(err, ctx) {
      // 一般来说，不需要特殊针对 jsonp 进行错误定义，jsonp 的错误处理会自动调用 json 错误处理，并包装成 jsonp 的响应格式
    },

  };

  exports.alinode = {
    enable: true,
    server: 'wss://agentserver.node.aliyun.com:8080',
    appid: '39582',
    secret: '0eda96744a4a612a73c76c0a96c6a8c2d01dcb15',
  };

  return config;
};
