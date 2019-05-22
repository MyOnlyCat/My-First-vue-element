'use strict';
const DaoService = require('./daoService');

class CallRecordsService extends DaoService {
  init() {
    this.model = this.ctx.model.CallRecords;
  }
}
module.exports = CallRecordsService;
