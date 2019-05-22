'use strict';
const CommonController = require('./commonController');
//暂时没有用
class OrderByTargetsController extends CommonController {
  init() {
    this.daoService = this.service.orderByTargets;
  }

  async statisticByTarget(ctx) {
    ctx.body = await this.daoService.statisticByTarget(ctx.request.body);
  }
}
module.exports = OrderByTargetsController;
