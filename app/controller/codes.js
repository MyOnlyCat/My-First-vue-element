'use strict';
const CommonController = require('./commonController');
class CodesController extends CommonController {
  init() {
    this.daoService = this.service.codes;
  }

  async findByType(ctx) {
    ctx.body = await this.daoService.find({ codeType: ctx.params.codeType });
  }

}
module.exports = CodesController;
