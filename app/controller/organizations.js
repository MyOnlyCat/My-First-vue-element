'use strict';
const CommonController = require('./commonController');
class OrganizationsController extends CommonController {
  init() {
    this.daoService = this.service.organizations;
  }

}
module.exports = OrganizationsController;
