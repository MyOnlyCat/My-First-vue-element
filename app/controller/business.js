'use strict';
const CommonController = require('./commonController');
class BusinessController extends CommonController {
  init() {
    this.daoService = this.service.business;
  }
}
module.exports = BusinessController;
