'use strict';
const DaoService = require('./daoService');

class ServicesService extends DaoService {
  init() {
    this.model = this.ctx.model.Services;
  }

  async searchByAdCode(query, pagin) {
    const queryCriteria = this.queryCriteria(query);
    const sort = this.sort(query);
    const adcode = query.metric.adcode;

    const district = await this.service.districts.findOne({adcode});
    let districtSql = this.service.districts.getDistrictAncestorSQL(district);
    districtSql = {'district.adcode': { $in: districtSql }}
    let result = await this.findByPage({...queryCriteria, ...districtSql}, pagin, undefined, sort);

    return result;
  }
}
module.exports = ServicesService;
