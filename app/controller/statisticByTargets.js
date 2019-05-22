'use strict';
const CommonController = require('./commonController');
class StatisticByTargetController extends CommonController {
  init() {
    this.daoService = this.service.statisticByTargets;
  }

  /**
   * 被服务人员统计
   * @param {*} ctx 
   */
  async statisticByTarget(ctx) {
    ctx.body = await this.daoService.statisticByTarget(ctx.request.body);
  }

  /**
   * 按天来统计
   * @param {*} ctx 
   */
  async statisticByDays(ctx) {
    ctx.body = await this.daoService.statisticByDays(ctx.request.body);
  }
  
  /**
   * 点老人,返回这个老人的订单
   * @param {*} ctx 
   */
  async getTargets(ctx) {
    ctx.body = await this.daoService.getTargets(ctx.request.body, ctx.query);
  }

  /**
   * 区域来统计
   * @param {*} ctx 
   */
  async statisticByDistrict(ctx) {
    ctx.body = await this.daoService.statisticByDistrict(ctx.request.body);
  }

  /**
   * 合同来统计
   * @param {*} ctx 
   */
  async statisticByProject(ctx) {
    ctx.body = await this.daoService.statisticByProject(ctx.request.body);
  }

  /**
   * 老人性别,年龄来统计
   * @param {*} ctx 
   */
  async statisticByTargetAgeSex(ctx) {
    ctx.body = await this.daoService.statisticByTargetAgeSex(ctx.request.body);
  }

  /**
   * 从order表里面生成statisticByTargets数据
   * @param {*} ctx 
   */
  async convertFromOrder(ctx) {
    const search = ctx.request.body;
    const metric = search.metric;
    if (metric && metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      search.eqs = { ...search.eqs, ...result, status: 'COMPLETE' }
    } else {
      search.eqs = { status: 'COMPLETE' }
    }

    let queryCriteria = this.service.orders.queryCriteria(search);

    const pagin = { page: 1, pageSize: 500 };
    let first = true;
    let results;
    while (first || ((pagin.page - 1) * pagin.pageSize) < results.count) {
      results = await this.service.orders.findByPage(queryCriteria, pagin);
      await this.convertParts(results);
      pagin.page = pagin.page + 1;
      first = false;
    }
    console.log('convertFromOrder: finished');

  }

  async convertParts(results) {
    console.log(`convertParts: page: ${results.page} - pageSize: ${results.pageSize} - count: ${results.count}`);
    // let resultPromises = results.map(async myDoc=>{
    //   convertToStatisticByTarget()
    // })
    for (let r of results.content) {
      await this.daoService.convertToStatisticByTarget(r)
      // await this.daoService.convertToOrderByTargets(r)
      await this.daoService.convertToStatisticByProvider(r)
    }
  }



}
module.exports = StatisticByTargetController;
