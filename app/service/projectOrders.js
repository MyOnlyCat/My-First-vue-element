'use strict';
const DaoService = require('./daoService');

class ProjectOrdersService extends DaoService {
  init() {
    this.model = this.ctx.model.ProjectOrders;
  }
}
module.exports = ProjectOrdersService;
