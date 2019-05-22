'use strict';
const CommonController = require('./commonController');
class BusinesServicesController extends CommonController {
  init() {
    this.daoService = this.service.businesServices;
  }
}
module.exports = BusinesServicesController;
