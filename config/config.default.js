'use strict';

module.exports = appInfo => {
    const config = exports = {};

    // use for cookie sign key, should change to your own and keep security
    config.keys = appInfo.name + '_1509768667718_1758';

    // add your config here
    config.middleware = [];
    // add your config here
    config.security = {
        ignore: '/api/',
        csrf: {
            enable: false,
            // ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
            // domainWhiteList: [], //白名单
        },

        methodnoallow: {
            enable: false,
        },
    };

    config.cors = {
        allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    };

    config.oAuth2Server = {
        grants: ['password', 'refresh_token'],
        expiresIn: 3600,
    };

    config.bodyParser = {
        enable: true,
        encoding: 'utf8',
        formLimit: '100kb',
        jsonLimit: '400kb',
    };

    config.mongoose = {
        client: {
            url: 'mongodb://127.0.0.1/hcc_sms',
            options: {
                useMongoClient: true,
                reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
                reconnectInterval: 500, // Reconnect every 500ms
                poolSize: 10, // Maintain up to 10 socket connections
                // If not connected, return errors immediately rather than waiting for reconnect
                bufferMaxEntries: 0,
            },
        },

        // url: 'mongodb://127.0.0.1/hcc_sms_temp',
        // url: 'mongodb://127.0.0.1/hcc_sms',
        // url: 'mongodb://192.168.0.111/hcc_sms',
        // url: 'mongodb://hcc:Yilunjk123@112.74.88.166:3308/hcc_sms?authMode=scram-sha1&rm.keepAlive=true&rm.tcpNoDelay=true&rm.nbChannelsPerNode=10',
        // options: {
        //   useMongoClient: true,
        //   reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        //   reconnectInterval: 500, // Reconnect every 500ms
        //   poolSize: 10, // Maintain up to 10 socket connections
        //   // If not connected, return errors immediately rather than waiting for reconnect
        //   bufferMaxEntries: 0,
        // },
    };

    config.onerror = {
        html(err, ctx) {
            ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}`);
            // html hander
            ctx.body = '<h3>error</h3>';
            ctx.status = 500;
        },
        json(err, ctx) {
            ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}`);
            // json hander
            ctx.body = {message: 'error'};
            ctx.status = 500;
        },
        jsonp(err, ctx) {
            // 一般来说，不需要特殊针对 jsonp 进行错误定义，jsonp 的错误处理会自动调用 json 错误处理，并包装成 jsonp 的响应格式
        },

    };

    config.default = {
        user: {password: '123456'},
    };

    config.multipart = {
        whitelist: () => true,
    };

    config.oss = {
        client: {
            accessKeyId: 'LTAIJ29Z6eh3ibgX',
            accessKeySecret: 'xGpWm9wQhnaRO38K0bfVj9zRQL8uvZ',
            bucket: 'hcc-sms-node',
            endpoint: 'oss-cn-shenzhen-internal.aliyuncs.com',
            timeout: '10s',
        },
        // client: {
        //   sts: true,
        //   accessKeyId: 'LTAIlJfjilwFnKog',
        //   accessKeySecret: 'ab6MgTSZUVMUPyCixCVMMz9xHHUqzD',
        // },

        useAgent: true,
    };

    config.redis = {
        client: {
            port: 6379, // Redis port
            host: '127.0.0.1', // Redis host
            password: 'yljk123',
            db: 0,
        },
    };

    config.io = {
        init: {}, // passed to engine.io
        namespace: {
            '/': {
                connectionMiddleware: [],
                packetMiddleware: [],
            },
        },
        // redis: {
        //   host: '127.0.0.1',
        //   port: 6379
        // }
    };

    return config;
};
