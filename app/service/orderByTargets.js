'use strict';
const DaoService = require('./daoService');

class OrderByTargetsService extends DaoService {
  init() {
    this.model = this.ctx.model.OrderByTargets;
  }

  async statisticByTarget(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric, 'target.');
      query.eqs = { ...query.eqs, ...result }
    }

    let dateQuery;
    let dateFilterQuery = [];
    if (metric.date) {
      dateQuery = metric.date;

      dateFilterQuery;
      for (let [key, value] of Object.entries(dateQuery)) {
        dateFilterQuery.push({ [key]: ["$$order.date", value] })
      }

    }
    query.eqs = { ...query.eqs, ...{'orders.date': dateQuery} }
    let queryCriteria = this.service.orders.queryCriteria(query);


    const aggregateQuerys = [{
      $match: queryCriteria
    }];
    if (metric.date) {
      aggregateQuerys.push({
        $project: {
          orders: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: {
                $and: dateFilterQuery
              }
            }
          }
        }
      });
    }
    aggregateQuerys.push({
      $project: {
        //evaluation: { $sum: { $multiply: ["$orders.evaluation", "$orders.orderCount"] } },
        orderCount: { $sum: '$orders.orderCount' },
        orderItemCount: { $sum: '$orders.orderItemCount' },
        totalMoney: { $sum: '$orders.totalMoney' }
      }
    })

    aggregateQuerys.push({
      $group: {
        _id: null,
        targetCount: { $sum: 1 },
        orderCount: { $sum: '$orderCount' },
        orderItemCount: { $sum: '$orderItemCount' },
        totalMoney: { $sum: '$totalMoney' }
      }
    })
    return await this.model.aggregate(aggregateQuerys);

  }
}
module.exports = OrderByTargetsService;
