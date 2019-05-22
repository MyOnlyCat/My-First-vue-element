'use strict';
const DaoService = require('./daoService');

class DistrictsService extends DaoService {

  init() {
    this.model = this.ctx.model.Districts;
    this.defaultSort = { _id: 1 };
  }

  getDistrictSQL(d) {
    switch (d.level) {
      case 'village':
        return { 'district.adcode': d.adcode };
        break;
      default:
        return { [`district.ancestors.${d.level}AdCode`]: d.adcode };
        break;
    }
  }

  getMetricSQL(d, prefix='') {
    switch (d.govLevel) {
      case 'village':
      case 'villageAdCode':
        return { [`${prefix}district.adcode`]: d.govAdCode };
        break;
      default:
        return { $or: [{[`${prefix}district.ancestors.${d.govLevel}`]: d.govAdCode }, { [`${prefix}district.adcode`]: d.govAdCode }]};
        break;
    }
  }

  getDistrictAncestorSQL(district) {
    const adcodes = [];
    adcodes.push(district.adcode);
    if (district.ancestors) {
      if (district.ancestors.streetAdCode) {
        adcodes.push(district.ancestors.streetAdCode);
      }
      if (district.ancestors.districtAdCode) {
        adcodes.push(district.ancestors.districtAdCode);
      }
      if (district.ancestors.cityAdCode) {
        adcodes.push(district.ancestors.cityAdCode);
      }
    }
    return adcodes;
  }
}
module.exports = DistrictsService;
