'use strict';
const CommonController = require('./commonController');
class StatisticByProviderController extends CommonController {
  init() {
    this.daoService = this.service.statisticByProviders;
  }

  /**
   * 按服务人员统计
   * @param {*} ctx 
   */
  async statisticByProvider(ctx) {
    ctx.body = await this.daoService.statisticByProvider(ctx.request.body);
  }

  /**
   * 按服务项目统计
   * @param {*} ctx 
   */
  async statisticByServiceItem(ctx) {
    ctx.body = await this.daoService.statisticByServiceItem(ctx.request.body);
  }

  /**
   * 点服务人员,返回这个服务人员做的订单
   * @param {*} ctx 
   */
  async getProviders(ctx) {
    ctx.body = await this.daoService.getProviders(ctx.request.body, ctx.query);
  }
}
module.exports = StatisticByProviderController;
