'use strict';
const DaoService = require('./daoService');

class RecordsService extends DaoService {
  init() {
    this.model = this.ctx.model.Records;
  }
}
module.exports = RecordsService;
