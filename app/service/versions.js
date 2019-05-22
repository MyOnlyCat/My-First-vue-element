'use strict';
const DaoService = require('./daoService');

class VersionsService extends DaoService {
  init() {
    this.model = this.ctx.model.Versions;
  }
}
module.exports = VersionsService;
