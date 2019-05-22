'use strict';

const Service = require('egg').Service;
const moment = require('moment');

class StatisticBusinessService extends Service {

  /**
   * 商家流水统计
   * @param {*} search 
   */
  async running(search) {
    if (!search.metric) {
      search.metric = {};
    }
    const metric = search.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      const business = await this.service.business.find(result, { _id: 1 });
      const ids = business.map(b => b._id.toHexString())
      search.eqs = { ...search.eqs, 'business._id': { $in: ids } }
    }

    let query = this.service.orders.queryCriteria(search);

    // let total = await this.ctx.model.BusinesOrders.aggregate([{
    //   $match: query
    // },
    // { $unwind: "$service" },
    // {
    //   $group: {
    //     _id: { businessId: '$business._id', isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' },
    //     money: { $sum: '$price.value' }, returnPoint: { $sum: '$price.returnPoint' }, point: { $sum: '$price.point' }
    //   }
    // },
    // ]);
    // total.forEach(t => {
    //   t.money = this.ctx.helper.toFloat(t.money);
    // })

    // const notHCSOrder = total.filter(t => t._id.isHCS === false);

    // const HCSOrder = total.filter(t => t._id.isHCS === true || t._id.isHCS === undefined);
    // const HCSOrderResult = [];
    // HCSOrder.forEach(o => {
    //   o._id.isHCS = true;
    //   const record = HCSOrderResult.find(h => h._id.category == o._id.category && h._id.serviceCategory === o._id.serviceCategory);
    //   if (record) {
    //     record.money = record.money + o.money;
    //     record.returnPoint = record.returnPoint + o.returnPoint;
    //   } else {
    //     HCSOrderResult.push(o);
    //   }
    // })

    // const result = [...notHCSOrder, ...HCSOrderResult];
    const total = await this.orderByCriteria(query);
    return total;
  }


  async orderByCriteria(query) {
    let queryCriteria = {
      ...query, 'price.category': 'money',
      'target.isHCS': false
    }
    let totalCMoneyNotHCS = await this.ctx.model.BusinesOrders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: "$service" },
    {
      $group: {
        _id: { isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' }, money: {
          $sum: { $multiply: ["$service.prices.value", "$service.count"] }
        }, returnPoint: { $sum: { $multiply: ["$service.prices.returnPoint", "$service.count"] } }
      }
    },
    ]);

    queryCriteria = {
      ...query, 'price.category': 'money',
      'target.isHCS': { $ne: false }
    }
    let totalCMoneyHCS = await this.ctx.model.BusinesOrders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: "$service" },
    {
      $group: {
        _id: { isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' }, money: {
          $sum: { $multiply: ["$service.prices.memberValue", "$service.count"] }
        }, returnPoint: { $sum: { $multiply: ["$service.prices.returnPoint", "$service.count"] } }
      }
    },
    ]);

    queryCriteria = {
      ...query, 'price.category': 'hybrid',
      'target.isHCS': false
    }
    let totalCHybridNotHCS = await this.ctx.model.BusinesOrders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: "$service" },
    {
      $group: {
        _id: { isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' },
        money: { $sum: { $multiply: ["$service.prices.hybrid.value", "$service.count"] } },
        returnPoint: { $sum: { $multiply: ["$service.prices.hybrid.returnPoint", "$service.count"] } },
        point: { $sum: { $multiply: ["$service.prices.hybrid.point", "$service.count"] } }
      }
    },
    ]);

    queryCriteria = {
      ...query, 'price.category': 'hybrid',
      'target.isHCS': { $ne: false }
    }
    let totalCHybridHCS = await this.ctx.model.BusinesOrders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: "$service" },
    {
      $group: {
        _id: { isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' },
        money: { $sum: { $multiply: ["$service.prices.hybrid.memberValue", "$service.count"] } },
        returnPoint: { $sum: { $multiply: ["$service.prices.hybrid.returnPoint", "$service.count"] } },
        point: { $sum: { $multiply: ["$service.prices.hybrid.point", "$service.count"] } }
      }
    },
    ]);

    queryCriteria = {
      ...query, 'price.category': 'point',
    }
    let totalCPoint = await this.ctx.model.BusinesOrders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: "$service" },
    {
      $group: {
        _id: { isHCS: '$target.isHCS', category: '$category', serviceCategory: '$service.category' },
        point: { $sum: { $multiply: ["$service.prices.point.point", "$service.count"] } }
      }
    },
    ]);

    let result = [];

    totalCMoneyNotHCS.forEach(s => {
      s._id.isHCS = false;
      this.calculateS(result, s);
    })

    totalCMoneyHCS.forEach(s => {
      s._id.isHCS = true;
      this.calculateS(result, s);
    })

    totalCHybridNotHCS.forEach(s => {
      s._id.isHCS = false;
      this.calculateS(result, s);
    })

    totalCHybridHCS.forEach(s => {
      s._id.isHCS = true;
      this.calculateS(result, s);
    })

    totalCPoint.forEach(s => {
      if (s._id.isHCS !== false) {
        s._id.isHCS = true;
      }
      this.calculateS(result, s);
    })

    return result;
  }

  calculateS(result, s) {
    s.money = s.money || 0;
    s.returnPoint = s.returnPoint || 0;
    s.point = s.point || 0;
    const r = result.find(r => r._id.isHCS == s._id.isHCS && r._id.category == s._id.category && r._id.serviceCategory == s._id.serviceCategory)
    if (r) {
      r.money = r.money + s.money;
      r.returnPoint = r.returnPoint + s.returnPoint;
      r.point = r.point + s.point;
    } else {
      result.push(s);
    }
  }

  /**
   * 商家和会员情况
   * @param {*} query 
   */
  async info(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.business.queryCriteria(query);
    const businessCount = await this.service.business.count(queryCriteria);
    queryCriteria.isHCS = false;
    let isNotHCS = await this.service.users.count(queryCriteria); //注册会员数
    return { businessCount, isNotHCS }
  }

  /**
   * 按月来统计
   * @param {*} query 
   */
  async orderByYearMonth(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.businesOrders.queryCriteria(query);

    const year = query.metric.year ? Number.parseInt(query.metric.year) : moment().year();
    const allPromises = [];
    const month = moment().month();
    for (let i = 0; i <= month; i++) {
      const monthRange = this.monthTimeRangeCriteria(year, i, 'created');
      queryCriteria = { ...queryCriteria, ...monthRange };
      allPromises.push(this.orderByCriteria(queryCriteria));
    }

    return await Promise.all(allPromises);
  }

  monthTimeRangeCriteria(year, month, fieldName) {
    let start = moment({ year, month });
    let end = moment(start).add(1, 'month');
    return { [fieldName]: { $lte: end.valueOf(), $gte: start.valueOf() } };
  }

  /**
   * 按一周来统计
   * @param {*} query 
   */
  async orderByWeekDay(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.businesOrders.queryCriteria(query);

    const allPromises = [];

    let beginDate = moment({hour: 0}).add(1-7, "day");
    for (let i = 0; i < 7; i++) {
      const start = moment(beginDate).add(i, "day")
      const dayRange = this.dayEndCriteria(start, 'created');
      queryCriteria = { ...queryCriteria, ...dayRange };
      allPromises.push(this.orderByCriteria(queryCriteria));
    }

    let result = await Promise.all(allPromises);
    result = result.map((r,i)=> {
      const date = moment(beginDate).add(i, "day");
      return {[date.format('YYYY-MM-DD')]: r};
    }).reduce((a,b)=>({...a, ...b}), {});

    return result;
  }

  dayEndCriteria(start, fieldName) {
    let end = moment(start).add(1, 'day');
    return { [fieldName]: { $lte: end.valueOf(), $gte: start.valueOf() } };
  }

}
module.exports = StatisticBusinessService;
