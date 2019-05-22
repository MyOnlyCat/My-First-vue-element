'use strict';
const DaoService = require('./daoService');

class CommunitiesService extends DaoService {
  init() {
    this.model = this.ctx.model.Communities;
  }
}
module.exports = CommunitiesService;
