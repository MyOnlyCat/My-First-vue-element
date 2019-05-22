'use strict';
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const cors = require('kcors');
// const redis = require("redis");
// const bluebird = require("bluebird");

module.exports = app => {
  app.mongoose.connection.on('connected', () => {
    console.log(`mongooose key ${JSON.stringify(Object.keys(app.mongooseDB))}`);
    const bucket = new mongoose.mongo.GridFSBucket(app.mongooseDB.db);
    console.log(`mongooose bucket ${JSON.stringify(Object.keys(bucket))}`);
    const gfs = Grid(app.mongooseDB.db, mongoose.mongo);
    app.bucket = bucket;
    app.gfs = gfs;
  });
  app.use(cors());

  // bluebird.promisifyAll(redis.RedisClient.prototype);
  // bluebird.promisifyAll(redis.Multi.prototype);
  // app.redis = redis.createClient();
  // app.redis.auth(app.config.redis.password);

/*   class CustomController extends app.Controller {
    success(result) {
      this.ctx.body = {
        success: true,
        result,
      };
    }

    fail(message = undefined, status = 200) {
      this.ctx.status = status;
      this.ctx.body = {
        success: false,
        message,
      };
    }
  }

  app.Controller = CustomController; */
};
