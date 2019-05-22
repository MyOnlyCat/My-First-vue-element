'use strict';
const CommonController = require('./commonController');
class VersionsController extends CommonController {
  init() {
    this.daoService = this.service.versions;
  }

  async findByVersion(ctx) {
    if (!this.ctx.helper.isNumber(ctx.params.versionCode)) {
      this.fail('版本格式不对', 417);
      return;
    }
    ctx.body = await this.service.versions.find({ appName: ctx.params.appName, platform: ctx.params.platform, versionCode: { $gt: ctx.params.versionCode } });
  }
}
module.exports = VersionsController;
