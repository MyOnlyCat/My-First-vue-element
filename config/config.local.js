'use strict';

module.exports = appInfo => {
    const config = exports = {};

    config.mongoose = {
        client: {
            // url: 'mongodb://192.168.0.111/hcc_sms',
            url: 'mongodb://hcc:Yilunjk123@112.74.88.166:3308/hcc_sms?authMode=scram-sha1&rm.keepAlive=true&rm.tcpNoDelay=true&rm.nbChannelsPerNode=10',
            options: {
                useMongoClient: true,
                reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
                reconnectInterval: 500, // Reconnect every 500ms
                poolSize: 10, // Maintain up to 10 socket connections
                // If not connected, return errors immediately rather than waiting for reconnect
                bufferMaxEntries: 0,
                heartbeatInterval: 300,
            },
        },
        // url: 'mongodb://127.0.0.1/hcc_sms',
        // url: 'mongodb://hcc:Yilunjk123@112.74.88.166:3308/hcc_sms?authMode=scram-sha1&rm.keepAlive=true&rm.tcpNoDelay=true&rm.nbChannelsPerNode=10',
        // options: {
        //   useMongoClient: true,
        //   reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        //   reconnectInterval: 500, // Reconnect every 500ms
        //   poolSize: 10, // Maintain up to 10 socket connections
        //   // If not connected, return errors immediately rather than waiting for reconnect
        //   bufferMaxEntries: 0
        // },
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

    config.onerror = {
        html(err, ctx) {
            ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}, \n header: ${JSON.stringify(ctx.request.header)}`);
            // html hander
            ctx.body = `<h3>error: ${JSON.stringify(err.stack)}</h3>`;
            ctx.status = 500;
        },
        json(err, ctx) {
            ctx.logger.error(`error for href: ${ctx.href}, \n body: ${JSON.stringify(ctx.request.body)}, \n header: ${JSON.stringify(ctx.request.header)}`);
            // json hander
            ctx.body = {message: 'error'};
            ctx.status = 500;
        },
        jsonp(err, ctx) {
            // 一般来说，不需要特殊针对 jsonp 进行错误定义，jsonp 的错误处理会自动调用 json 错误处理，并包装成 jsonp 的响应格式
        },

    };

    config.redis = {
        client: {
            port: 6379, // Redis port
            host: '112.74.88.166', // Redis host
            password: 'yljk123',
            db: 0,
        },
    };

    exports.alinode = {
        server: 'wss://agentserver.node.aliyun.com:8080',
        appid: '40757',
        secret: '32cb9eca1d3c34916695fcbce722fef1acf5a075',
    };

    exports.mysql = {
        // 单数据库信息配置
        client: {
            // host
            host: '127.0.0.1',
            // 端口号
            port: '3306',
            // 用户名
            user: 'root',
            // 密码
            password: 'root',
            // 数据库名
            database: 'rbac1',
        },
        // 是否加载到 app 上，默认开启
        app: true,
        // 是否加载到 agent 上，默认关闭
        agent: false,
    };

    return config;
};
