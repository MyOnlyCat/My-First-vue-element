'use strict';
const DaoService = require('./daoService');

class CodesService extends DaoService {
  init() {
    this.model = this.ctx.model.Codes;
  }
}
module.exports = CodesService;
