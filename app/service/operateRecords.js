'use strict';
const DaoService = require('./daoService');

class OperateRecordsService extends DaoService {
  init() {
    this.model = this.ctx.model.OperateRecords;
  }
}
module.exports = OperateRecordsService;
