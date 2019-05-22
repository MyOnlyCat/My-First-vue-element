'use strict';
const CommonController = require('./commonController');
class CommunitiesController extends CommonController {
  init() {
    this.daoService = this.service.communities;
  }
}
module.exports = CommunitiesController;
