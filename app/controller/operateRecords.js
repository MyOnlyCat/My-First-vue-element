'use strict';
const CommonController = require('./commonController');
//暂时没有用
class OperateRecordsController extends CommonController {
  init() {
    this.daoService = this.service.operateRecords;
  }
}
module.exports = OperateRecordsController;
