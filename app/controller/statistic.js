'use strict';
const Controller = require('egg').Controller;

class StatisticController extends Controller {

  async statisticAges(ctx) {
    ctx.body = await this.service.statistic.statisticAges(ctx.request.body);
  }

  async statisticOrderItem(ctx) {
    ctx.body = await this.service.statistic.statisticOrderItem(ctx.request.body, ctx.query);
  }

  async statisticOrderUser(ctx) {
    ctx.body = await this.service.statistic.statisticOrderUser(ctx.request.body, ctx.query);
  }

  async statisticOrganization(ctx) {
    ctx.body = await this.service.statistic.statisticOrganization(ctx.request.body, ctx.query);
  }

  async statisticOrganizationServer(ctx) {
    ctx.body = await this.service.statistic.statisticOrganizationServer(this.service.orders.queryCriteria(ctx.request.body), ctx.query);
  }

  async statisticDistrictReport(ctx) {
    ctx.body = await this.service.statistic.statisticDistrictReport(ctx.request.body);
  }

  async statisticByProvider(ctx) {
    ctx.body = await this.service.statistic.statisticByProvider(ctx.request.body, ctx.query);
  }

  async statisticOrderByProject(ctx) {
    ctx.body = await this.service.statistic.statisticOrderByProject(ctx.request.body);
  }

  async orderByTimeCompare(ctx) {
    ctx.body = await this.service.statistic.orderByTimeCompare(ctx.request.body);
  }

  async orderByYearMonth(ctx) {
    ctx.body = await this.service.statistic.orderByYearMonth(ctx.request.body);
  }

}

module.exports = StatisticController;
