'use strict';

const Controller = require('egg').Controller;

/**
 * 主要为option请求返回200
 */
class HomeController extends Controller {
  async index() {
    this.ctx.status = 200;
    this.ctx.body = null;
  }
}

module.exports = HomeController;
