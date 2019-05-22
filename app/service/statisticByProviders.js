'use strict';
const DaoService = require('./daoService');

class StatisticByProviderService extends DaoService {
  init() {
    this.model = this.ctx.model.StatisticByProviders;
  }

  /**
   * 按服务人员统计
   * @param {*} query 
   */
  async statisticByProvider(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);

    const result = await this.model.aggregate([{
      $match: queryCriteria
    },
    {
      $group: {
        _id: '$provider._id',
        evaluation: { $sum: { $multiply: ["$evaluation", "$orderCount"] } },
        orderCount: { $sum: '$orderCount' },
        orderItemCount: { $sum: '$orderItemCount' },
        totalMoney: { $sum: '$totalMoney' }
      }
    },
    {
      $group: {
        _id: null,
        evaluation: { $sum: "$evaluation" },
        providerCount: { $sum: 1 },
        orderCount: { $sum: '$orderCount' },
        orderItemCount: { $sum: '$orderItemCount' },
        totalMoney: { $sum: '$totalMoney' }
      }
    },
    { $project: { providerCount: 1, orderCount:1, orderItemCount:1, totalMoney:1, evaluation: { $divide: [ "$evaluation", '$orderCount' ] } } }
    ]);
    result.forEach(r=> r.totalMoney = this.ctx.helper.toFloat(r.totalMoney));
    return result;
  }

  /**
   * 按服务项目统计
   * @param {*} query 
   */
  async statisticByServiceItem(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);

    return await this.model.aggregate([{
      $match: queryCriteria
    },
    {$unwind: '$service'},
    {
      $group: {
        _id: '$service.name',
        serviceItemCount: { $sum: '$service.count' },
      }
    },
    ]);
  }

  /**
   * 点服务人员,返回这个服务人员做的订单
   * @param {*} query 
   * @param {*} param1 
   */
  async getProviders(query, { page = 1, pageSize = 10 } = { page: 1, pageSize: 10 }) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);
    let sort = this.service.orders.sort(query) || { orderCount: -1 };
    const from = (page - 1) * pageSize;
    let count = await this.model.aggregate([{
      $match: queryCriteria
    },
    {
      $group: {
        _id: '$provider._id',
      }
    },
    { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    const content = await this.model.aggregate([{
      $match: queryCriteria
    },
    {
      $group: {
        _id: '$provider._id',
        provider: { $first: '$provider' },
        evaluation: { $sum: { $multiply: ["$evaluation", "$orderCount"] } },
        orderCount: { $sum: '$orderCount' },
        orderItemCount: { $sum: '$orderItemCount' },
        totalMoney: { $sum: '$totalMoney' }
      }
    },
    { $project: { provider: 1, orderCount:1, orderItemCount:1, totalMoney:1, evaluation: { $divide: [ "$evaluation", '$orderCount' ] } } },
    { $sort: sort },
    { $skip: from },
    { $limit: pageSize }
    ]);
    content.forEach(r=> r.totalMoney = this.ctx.helper.toFloat(r.totalMoney));
    const result = {
      count,
      page,
      pageSize,
      content,
    };
    return result;

  }


}
module.exports = StatisticByProviderService;
