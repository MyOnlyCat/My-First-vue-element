'use strict';
const Service = require('egg').Service;
const moment = require('moment');

class StatisticService extends Service {

  async statisticLifeCondition(query) {
    const searchCriteria = this.service.orders.queryCriteria(query)
    const year = query.metric.year ? Number.parseInt(query.metric.year) : moment().year();
    let start = moment({ year: year });
    let end = moment(start).add(1, 'year');

    const matchCriteria = { ...searchCriteria, role: 'USER', created: { $lt: end.valueOf() } }
    const beforeYearMatchCriteria = { ...searchCriteria, role: 'USER', created: { $lt: start.valueOf() } }
    let sexResults = await this.ctx.model.Users.aggregate([{
      $match: matchCriteria
    },
    { $group: { _id: '$sex', count: { $sum: 1 } } },
    ]);

    let lifeResults = await this.ctx.model.Users.aggregate([{
      $match: matchCriteria
    },
    { $group: { _id: '$lifeCondition', count: { $sum: 1 } } },
    ]);

    let beforeYearlifeResults = await this.ctx.model.Users.aggregate([{
      $match: beforeYearMatchCriteria
    },
    { $group: { _id: '$lifeCondition', count: { $sum: 1 } } },
    ]);

    const searchByAges = async (start, end) => {
      const dateRange = { dob: {} };
      if (start) {
        let now = moment();
        dateRange.dob['$lte'] = now.subtract(start, 'year').valueOf();
      }
      if (end) {
        let now = moment();
        dateRange.dob['$gt'] = now.subtract(end, 'year').valueOf();
      }
      return await this.service.users.count({ ...matchCriteria, ...dateRange })
    }
    const age6Results = await searchByAges(null, 60);
    const age67Results = await searchByAges(60, 70);
    const age78Results = await searchByAges(70, 80);
    const age8Results = await searchByAges(80, null);

    const sexR = sexResults.map(sex => {
      return { [sex._id]: sex.count };
    }).reduce((a, b) => { return { ...a, ...b } }, {});
    const lifeR = lifeResults.map(m => {
      return { [m._id]: m.count };
    })
    const beforeYearLifeR = beforeYearlifeResults.map(r => {
      return { [r._id]: r.count };
    })

    const result = {
      ...sexR,
      chooseYear: lifeR,
      beforeYear: beforeYearLifeR,
      before60: age6Results,
      6070: age67Results,
      7080: age78Results,
      after80: age8Results,
    }

    return result;
  }



  async statisticOrderItem(query, pagin) {
    const page = Number(pagin.page || 1);
    const pageSize = Number(pagin.pageSize || 10);
    const from = (page - 1) * pageSize;

    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }

    let queryCriteria = this.service.projects.queryCriteria(query);
    const yearRange = this.yearRangeCriteria(query, 'created');
    queryCriteria = { ...queryCriteria, ...yearRange }

    let content = await this.ctx.model.Orders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: '$service' },
    { $group: { _id: { service: '$service.name' }, service: { $first: '$service' }, orderItemCount: { $sum: 1 } } },
    { $sort: { orderItemCount: -1 } },
    { $skip: from },
    { $limit: pageSize }
    ]);
    let count = await this.ctx.model.Orders.aggregate([{
      $match: queryCriteria
    },
    { $unwind: '$service' },
    { $group: { _id: '$service.name' } },
    { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    const result = {
      count,
      page,
      pageSize,
      content,
    };
    return result;
  }

  async statisticByOrderTarget(query, pagin) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.projects.queryCriteria(query);

    const page = Number(pagin.page || 1);
    const pageSize = Number(pagin.pageSize || 10);
    const from = (page - 1) * pageSize;

    let content = await this.ctx.model.Orders.aggregate([{
      $match: queryCriteria
    },
    { $project: { organization: 1, target: 1, orderMoney: { $sum: '$service.price.value' } } },
    { $group: { _id: { organization: '$organization._id', target: '$target._id' }, orderCount: { $sum: 1 }, totalMoney: { $sum: '$orderMoney' } } },
    { $skip: from },
    { $limit: pageSize }
    ]);

    let count = await this.ctx.model.Orders.aggregate([{
      $match: queryCriteria
    },
    { $group: { _id: { organization: '$organization._id', target: '$target._id' } } },
    { $group: { _id: '$_id.organization', count: { $sum: 1 } } },
    ]);
    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    const result = {
      count,
      page,
      pageSize,
      content,
    };
    return result;
  }

  async statisticByOrganization(query, pagin) {
    const page = Number(pagin.page || 1);
    const pageSize = Number(pagin.pageSize || 10);
    const from = (page - 1) * pageSize;

    let total = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $unwind: '$service' },
    { $group: { _id: '$organization._id', orderCount: { $sum: 1 }, totalMoney: { $sum: '$service.price.value' }, orderItemCount: { $sum: 1 }, evaluation: { $avg: '$evaluation' } } },
    { $sort: { orderItemCount: -1 } },
    { $skip: from },
    { $limit: pageSize }
    ]);

    let targetCount = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$organization._id', targets: { $addToSet: '$target' }, orderCount: { $sum: 1 } } },
    { $unwind: '$targets' },
    { $group: { _id: { _id: '$_id', sex: '$targets.sex' }, targetCount: { $sum: 1 }, orderCount: { $first: '$orderCount' } } },
    ]);
    const targetCountResult = [];
    targetCount.forEach(t => {
      const record = targetCountResult.find(h => h._id == t._id._id);
      if (record) {
        if (t._id.sex) {
          record.male = t.targetCount;
        } else { 
          record.female = t.targetCount;
        }
        record.targetCount = record.targetCount + t.targetCount;
      } else {
        const r = { _id: t._id._id, targetCount: t.targetCount, orderCount: t.orderCount };
        if (t._id.sex) {
          r.male = t.targetCount;
        } else {
          r.female = t.targetCount;
        }
        targetCountResult.push(r);
      }
    })

    let count = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$organization._id' } },
    { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    total = total.map(itema => {
      const itemb = targetCountResult.find(itemb => {
        return itema._id == itemb._id
      })
      itema.totalMoney = this.ctx.helper.toFloat(itema.totalMoney);
      return { ...itema, ...itemb }
    })

    const result = {
      count,
      page,
      pageSize,
      content: total,
    };
    return result;
  }

  async totalMoney(query) {
    let total = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $unwind: '$service' },
    { $group: { _id: null, totalMoney: { $sum: '$service.price.value' } } },
    ]);
    if (!total.totalMoney) {
      total = { totalMoney: 0 };
    }
    return total;
  }

  async statisticByDistrict(query, groupBy) {
    let total = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $unwind: '$service' },
    { $group: { _id: '$' + groupBy, totalMoney: { $sum: '$service.price.value' }, count: { $sum: 1 } } },
    ]);
    total = total.map(t => { return { district: t._id, totalMoney: t.totalMoney, count: t.count } })
    return total;
  }


  async statisticByServer(search, pagin) {
    const metric = search.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      search.eqs = { ...search.eqs, ...result }
    }
    let query = this.service.orders.queryCriteria(search);
    let sort = this.service.orders.sort(search);
    if (!sort) {
      sort = { orderCount: -1 }
    }


    const yearRange = this.yearRangeCriteria(search, 'created');
    query = { ...query, ...yearRange }

    const page = Number(pagin.page || 1);
    const pageSize = Number(pagin.pageSize || 10);
    const from = (page - 1) * pageSize;

    let totalMoneyResults = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$provider', orderCount: { $sum: 1 }, evaluation: { $avg: '$evaluation' } } },
    { $sort: sort },
    { $skip: from },
    { $limit: pageSize }
    ]);

    const contentPromises = totalMoneyResults.map(async r => {
      const selectorCriteriaUser = { ...query, 'provider._id': r._id._id }
      const results = await this.ctx.model.Orders.aggregate([{
        $match: selectorCriteriaUser
      },
      { $unwind: '$service' },
      { $group: { _id: '$service._id', name: { $first: '$service.name' }, count: { $sum: 1 }, totalMoney: { $sum: '$service.price.value' } } },
      ]);

      return {
        ...r,
        service: results.map(x => { return { [x.name]: x.count } }),
        orderItemCount: results.map(x => x.count).reduce((x, c) => x + c, 0),
        totalMoney: results.map(x => x.totalMoney).reduce((x, c) => x + c, 0),
      };
    })

    const content = await Promise.all(contentPromises);


    let count = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$provider' } },
    { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    const result = {
      count,
      page,
      pageSize,
      content,
    };
    return result;
  }


  async statisticByUser(query, pagin) {
    const page = Number(pagin.page || 1);
    const pageSize = Number(pagin.pageSize || 10);
    const from = (page - 1) * pageSize;

    let totalMoneyResults = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $unwind: '$service' },
    { $group: { _id: 'target', count: { $sum: 1 }, totalMoney: { $sum: '$service.price.value' } } },
    { $sort: { count: -1 } },
    { $skip: from },
    { $limit: pageSize }
    ]);

    const content = await totalMoneyResults.map(async r => {
      const selectorCriteriaUser = { ...selectorCriteria, 'target._id': r._id._id }
      const results = await this.ctx.model.Orders.aggregate([{
        $match: selectorCriteriaUser
      },
      { $unwind: '$service' },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      ]);

      return {
        ...r,
        service: results.map(x => { return { [x._id.name]: x.count } }),
      };
    })


    let count = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$target' } },
    { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    if (count.length == 0) {
      count = 0;
    } else {
      count = count[0].count;
    }

    const result = {
      count,
      page,
      pageSize,
      content,
    };
    return result;
  }

  // TODO GOV角色下参数的处理, 下面是原来的GOV角色请求参数
  //{"eqs":{"status":"COMPLETE"},"metric":{"govLevel":"districtAdCode","govAdCode":"513401"},"ins":{},"likes":{},"times":{}}
  async statisticOrderUser(query, pagin) {
    const pageObjects = await this.statisticByOrderTarget(query, pagin);
    const ids = pageObjects.content.map(j => j._id.target);
    const users = await this.service.users.find({ _id: { $in: ids } });
    pageObjects.content.map(j => {
      j.target = users.find(u => u._id.toHexString() == j._id.target)
    });
    return pageObjects;
  }

  async statisticOrganization(query, pagin) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);
    const yearRange = this.yearRangeCriteria(query, 'created');
    queryCriteria = { ...queryCriteria, ...yearRange };

    const pageObjects = await this.statisticByOrganization(queryCriteria, pagin);
    let contents = pageObjects.content.map(async j => {
      const organization = await this.service.organizations.show(j._id);
      const serverCount = await this.service.users.count({ role: 'SERVER', 'organization._id': j._id });
      j.organization = organization;
      j.serverCount = serverCount;
      return j;
    });
    pageObjects.content = await Promise.all(contents);
    return pageObjects;
  }

  async statisticOrganizationServer(query, pagin) {
    const pageObjects = await this.service.organizations.findByPage(query, pagin);
    const resultPromises = pageObjects.content.map(async j => {
      const serverCount = await this.service.users.count({ role: 'SERVER', 'organization._id': j._id.toHexString() });
        return { organization: j, serverCount: serverCount }
    });
    pageObjects.content = await Promise.all(resultPromises);
    return pageObjects;
  }

  /*   async statisticCommunity(query) {
      const pageObjects = await this.statisticByCommunity(query);
      await pageObjects.content.map(async j => {
        const serverCount = await this.service.users.count({role: 'SERVER', 'organization._id': j._id})
        return {organization:j, serverCount: serverCount}
      })
      return pageObjects;
    } */

  async statisticByProvider(query, pagin) {


    const pageObjects = await this.statisticByServer(query, pagin);
    const ids = pageObjects.content.map(j => j._id._id);
    const users = await this.service.users.find({ _id: { $in: ids } });
    pageObjects.content.map(j => {
      j.user = users.find(u => u._id.toHexString() == j._id._id)
    })
    return pageObjects;
  }

  async statisticAges(query, pagin) {
    if (!query.eqs) {
      query.eqs = {};
    }
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    const organizationId = metric['organization._id'];
    if (organizationId) {
      const projects = await this.service.projects.find({ 'organization._id': organizationId });
      // const organization = await this.service.organizations.show(organizationId);
      const area = projects.map(a => {
        let result = {};
        switch (a.district.level) {
          case 'village':
            result = { 'district.adcode': a.district.adcode }
            break;
          default:
            result = { [`district.ancestors.${a.district.level}AdCode`]: a.district.adcode }
            break;
        }
        return result;
      });

      query.eqs.$or = area;
    }

    if (metric.govLevel) {
      let result = {};
      switch (metric.govLevel) {
        case 'village':
          result = { 'district.adcode': metric.govAdCode }
          break;
        default:
          result = { [`district.ancestors.${metric.govLevel}`]: metric.govAdCode }
          break;
      }
      query.eqs = { ...query.eqs, ...result }
    }
    const pageObjects = await this.statisticLifeCondition(query);

    return pageObjects;
  }

  async statisticDistrictReport(query) {
    const queryCriteria = this.service.orders.queryCriteria(query);
    const districts = await this.service.districts.find({ parentAdcode: query.metric.govAdCode });
    const districtQuerys = districts.map(this.service.districts.getDistrictSQL);
    queryCriteria['$or'] = districtQuerys
    if (query.metric.project) {
      queryCriteria['project._id'] = query.metric.project
    }
    let groupBy = 'district';
    if (districts.length > 0) {
      const d = districts[0];
      switch (d.level) {
        case 'village':
          groupBy = 'district.adcode'
          break;
        default:
          groupBy = `district.ancestors.${d.level}AdCode`
          break;
      }
    }
    let result = await this.statisticByDistrict(queryCriteria, groupBy);
    const promises = result.map(async r => {
      const district = districts.find(d => d.adcode == r.district);
      r.district = district;
      const searchUser = this.service.districts.getDistrictSQL(district);
      searchUser.role = 'USER';
      if (query.metric.project) {
        searchUser[`subsidy.projectId`] = query.metric.project
      }
      const u = await this.statisticUserByDistrict(searchUser, query.metric.project)
      return { ...u[0], ...r }
    })
    result = await Promise.all(promises);
    return result;
  }

  async statisticUserByDistrict(matchCriteria, projectId) {
    if (projectId) {
      let results = await this.ctx.model.Users.aggregate([{
        $match: matchCriteria
      },
      { $unwind: "$subsidy" },
      { $match: { 'subsidy.projectId': projectId } },
      { $group: { _id: null, subsidy: { $sum: '$subsidy.value.value' }, userCount: { $sum: 1 } } }
      ]);

      return results
    } else {
      let results = await this.ctx.model.Users.aggregate([{
        $match: matchCriteria
      },
      { $unwind: "$subsidy" },
      { $group: { _id: '$_id', subsidy: { $sum: '$subsidy.value.value' } } },
      { $group: { _id: null, subsidy: { $sum: '$subsidy' }, userCount: { $sum: 1 } } }
      ]);

      return results
    }
  }

  yearProjectCriteria(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const year = query.metric.year ? Number.parseInt(query.metric.year) : moment().year();
    let start = moment({ year: year });
    let end = moment(start).add(1, 'year');
    const timeCriteria = {};
    timeCriteria.start = { $lte: end.valueOf() };
    timeCriteria.end = { $gte: start.valueOf() };
    return timeCriteria;
  }

  yearRangeCriteria(query, fieldName) {
    if (!query.metric || !query.metric.year) {
      return {};
    }

    const year = query.metric.year ? Number.parseInt(query.metric.year) : moment().year();
    let start = moment({ year: year });
    let end = moment(start).add(1, 'year');
    const timeCriteria = {};
    timeCriteria[fieldName] = { $lte: end.valueOf(), $gte: start.valueOf() };
    return timeCriteria;
  }

  monthRangeCriteria(query, fieldName) {
    if (!query.metric || !query.metric.month) {
      return {};
    }

    const month = Number.parseInt(query.metric.month);
    let start = moment({ month: month });
    let end = moment(start).add(1, 'month');
    const timeCriteria = {};
    timeCriteria[fieldName] = { $lte: end.valueOf(), $gte: start.valueOf() };
    return timeCriteria;
  }

  async statisticOrderByProject(query) {

    const metric = query.metric;
    if (metric && metric.govLevel) {
      let result = {};
      switch (metric.govLevel) {
        case 'village':
          result = { 'district.adcode': metric.govAdCode }
          break;
        default:
          result = {
            "$or": [
              {
                [`district.ancestors.${metric.govLevel}`]: metric.govAdCode
              },
              {
                "district.adcode": metric.govAdCode
              }
            ]
          }
          break;
      }
      query.eqs = { ...query.eqs, ...result }
    }

    const timeProjectCriteria = this.yearProjectCriteria(query);

    let queryCriteria = this.service.projects.queryCriteria(query);
    queryCriteria = { ...queryCriteria, ...timeProjectCriteria }

    let projects = await this.service.projects.find(queryCriteria);

    const yearRange = this.yearRangeCriteria(query, 'created');

    const promises = projects.map(async project => {
      let orderCriteria = this.service.districts.getDistrictSQL(project.district)
      orderCriteria = { 'project._id': project._id.toHexString(), ...yearRange }
      const totalMoney = await this.service.orders.totalMoney(orderCriteria);
      return {
        _id: project._id, name: project.name, district: project.district, organization: project.organization, contract: project.contract,
        start: project.start, end: project.end, price: project.price, location: project.location, nodeNumbers: project.nodeNumbers, status: project.status,
        totalMoney: totalMoney.totalMoney, created: project.created, updated: project.updated
      }
    })
    const results = await Promise.all(promises);
    console.log('')
    return results;
  }

  async orderByTimeCompare(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);

    const allPromises = [];
    // const yearRange = this.yearEndCriteria(year, 'created');
    // queryCriteria = { ...queryCriteria, ...yearRange };
    // allPromises.push(this.orderByTimeQuery(queryCriteria));

    // const beforeYearRange = this.yearEndCriteria(year - 1, 'created');
    // queryCriteria = { ...queryCriteria, ...beforeYearRange };
    // allPromises.push(this.orderByTimeQuery(queryCriteria));

    let beginMonth = moment({day: 0});
    const monthRange = this.monthEndCriteria(beginMonth, 'created');
    let queryCrit = { ...queryCriteria, ...monthRange };
    allPromises.push(this.orderByTimeQuery(queryCrit));
    
    const beforeMonthStart = moment(beginMonth).add(-1, "month");
    const beforemonthRange = this.monthEndCriteria(beforeMonthStart, 'created');
    queryCrit = { ...queryCriteria, ...beforemonthRange };
    allPromises.push(this.orderByTimeQuery(queryCrit));

    const day = query.metric.day ? Number.parseInt(query.metric.day) : moment().date();
    let beginDay = moment({hour: 0});
    const dayRange = this.dayEndCriteria(beginDay, 'created');
    queryCrit = { ...queryCriteria, ...dayRange };
    allPromises.push(this.orderByTimeQuery(queryCrit));

    const beforeDayStart = moment(beginDay).add(-1, "day");
    const beforedayRange = this.dayEndCriteria(beforeDayStart, 'created');
    queryCrit = { ...queryCriteria, ...beforedayRange };
    allPromises.push(this.orderByTimeQuery(queryCrit));

    const [thismonthResult, beforemonthResult, thisDayResult, beforeDayResult] = await Promise.all(allPromises)

    return {
      // year: { [year]: thisYearResult, [year - 1]: beforeYearResult },
      month: { [beginMonth.format('YYYY-MM')]: thismonthResult, [beforeMonthStart.format('YYYY-MM')]: beforemonthResult },
      day: { [beginDay.format('YYYY-MM-DD')]: thisDayResult, [beforeDayStart.format('YYYY-MM-DD')]: beforeDayResult },
    };
  }


  async orderByYearMonth(query) {
    if (!query.metric) {
      query.metric = {};
    }
    const metric = query.metric;
    if (metric.govLevel) {
      let result = this.service.districts.getMetricSQL(metric);
      query.eqs = { ...query.eqs, ...result }
    }
    let queryCriteria = this.service.orders.queryCriteria(query);

    const year = query.metric.year ? Number.parseInt(query.metric.year) : moment().year();
    const allPromises = [];
    const month = moment().month();
    for (let i = 0; i <= month; i++) {
      const monthRange = this.monthTimeRangeCriteria(year, i, 'created');
      queryCriteria = { ...queryCriteria, ...monthRange };
      allPromises.push(this.orderByTimeQuery(queryCriteria));
    }

    return await Promise.all(allPromises);
  }

  yearEndCriteria(year, fieldName) {
    let start = moment({ year: year });
    let end = moment(start).add(1, 'year');
    return { [fieldName]: { $lte: end.valueOf() } };
  }

  monthEndCriteria(start, fieldName) {
    let end = moment(start).add(1, 'month');
    return { [fieldName]: { $lte: end.valueOf() } };
  }

  dayEndCriteria(start, fieldName) {
    let end = moment(start).add(1, 'day');
    return { [fieldName]: { $lte: end.valueOf() } };
  }

  yearTimeRangeCriteria(year, fieldName) {
    let start = moment({ year: year });
    let end = moment(start).add(1, 'year');
    return { [fieldName]: { $lte: end.valueOf(), $gte: start.valueOf() } };
  }

  monthTimeRangeCriteria(year, month, fieldName) {
    let start = moment({ year, month });
    let end = moment(start).add(1, 'month');
    return { [fieldName]: { $lte: end.valueOf(), $gte: start.valueOf() } };
  }

  async orderByTimeQuery(query, selectFields) {
    let total = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $unwind: '$service' },
    { $group: { _id: '$organization._id', orderCount: { $sum: 1 }, totalMoney: { $sum: '$service.price.value' }, orderItemCount: { $sum: 1 }, evaluation: { $avg: '$evaluation' } } },
    { $sort: { orderItemCount: -1 } },
    ]);

    let targetCount = await this.ctx.model.Orders.aggregate([{
      $match: query
    },
    { $group: { _id: '$organization._id', targets: { $addToSet: '$target' }, orderCount: { $sum: 1 } } },
    { $unwind: '$targets' },
    { $group: { _id: { _id: '$_id', sex: '$targets.sex' }, targetCount: { $sum: 1 }, orderCount: { $first: '$orderCount' } } },
    ]);
    const targetCountResult = [];
    targetCount.forEach(t => {
      const record = targetCountResult.find(h => h._id == t._id._id);
      if (record) {
        if (t._id.sex) {
          record.male = t.targetCount;
        } else {
          record.female = t.targetCount;
        }
        record.targetCount = record.targetCount + t.targetCount;
      } else {
        const r = { _id: t._id._id, targetCount: t.targetCount, orderCount: t.orderCount };
        if (t._id.sex) {
          r.male = t.targetCount;
        } else {
          r.female = t.targetCount;
        }
        targetCountResult.push(r);
      }
    })

    total = total.map(itema => {
      const itemb = targetCountResult.find(itemb => {
        return itema._id == itemb._id
      })
      itema.totalMoney = this.ctx.helper.toFloat(itema.totalMoney);
      return { ...itema, ...itemb }
    })

    return total;
  }

}
module.exports = StatisticService;
