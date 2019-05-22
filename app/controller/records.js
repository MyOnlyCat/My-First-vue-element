'use strict';
const CommonController = require('./commonController');
class RecordsController extends CommonController {
  init() {
    this.daoService = this.service.records;
  }
}
module.exports = RecordsController;
