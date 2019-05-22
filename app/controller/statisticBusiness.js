'use strict';
const Controller = require('egg').Controller;

class StatisticBusinessController extends Controller {

    /**
   * 商家流水统计
   * @param {*} search 
   */
  async running(ctx) {
    ctx.body = await this.service.statisticBusiness.running(ctx.request.body);
  }

  /**
   * 商家和会员情况
   * @param {*} ctx 
   */
  async info(ctx) {
    ctx.body = await this.service.statisticBusiness.info(ctx.request.body);
  }

  /**
   * 按月来统计
   * @param {*} ctx 
   */
  async orderByYearMonth(ctx) {
    ctx.body = await this.service.statisticBusiness.orderByYearMonth(ctx.request.body);
  }

  /**
   * 按一周来统计
   * @param {*} ctx 
   */
  async orderByWeekDay(ctx) {
    ctx.body = await this.service.statisticBusiness.orderByWeekDay(ctx.request.body);
  }
}

module.exports = StatisticBusinessController;
