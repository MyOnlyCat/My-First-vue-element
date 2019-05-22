'use strict';
const CommonController = require('./commonController');

class FingerPrintRecordController extends CommonController {
  init() {
    this.daoService = this.service.fingerPrintRecord;
  }

  async findBy(ctx) {
    const queryParams = this.daoService.queryCriteria(ctx.request.body);
    const count = await this.daoService.count(queryParams);
    if (count > 1000) {
      this.fail('数据大于1000，请缩小搜索范围', 417);
      return;
    }
    const content = await this.daoService.find(queryParams);
    ctx.body = { count, content };
  }

}

module.exports = FingerPrintRecordController;
