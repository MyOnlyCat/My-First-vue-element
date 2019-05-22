'use strict';
const DaoService = require('./daoService');

class FingerPrintRecordService extends DaoService {
  init() {
    this.model = this.ctx.model.FingerPrintRecord;
  }
}
module.exports = FingerPrintRecordService;
