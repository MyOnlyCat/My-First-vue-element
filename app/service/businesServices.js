'use strict';
const DaoService = require('./daoService');

class BusinesServicesService extends DaoService {
  init() {
    this.model = this.ctx.model.BusinesServices;
  }
}
module.exports = BusinesServicesService;
