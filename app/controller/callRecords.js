'use strict';
const CommonController = require('./commonController');
class CallRecordsController extends CommonController {
  init() {
    this.daoService = this.service.callRecords;
  }
}
module.exports = CallRecordsController;
