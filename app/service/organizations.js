'use strict';
const DaoService = require('./daoService');

class OrganizationsService extends DaoService {
  init() {
    this.model = this.ctx.model.Organizations;
  }
}
module.exports = OrganizationsService;
