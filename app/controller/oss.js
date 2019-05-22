'use strict';
const Controller = require('egg').Controller;
const OSS = require('ali-oss');
const co = require('co');


class OssController extends Controller {

  /**
   * 返回阿里OSS的STS token
   * @param {*} ctx 
   */
  async getStsToken(ctx) {
    const STS = OSS.STS;
    const sts = new STS({
      accessKeyId: 'LTAIlJfjilwFnKog',
      accessKeySecret: 'ab6MgTSZUVMUPyCixCVMMz9xHHUqzD'
    });

    ctx.body = await new Promise(resolve => {
      co(function* () {
        const token = yield sts.assumeRole(
          'acs:ram::1227366205767013:role/aliyunosstokengeneratorrole', null, null, null);
        resolve(token);
      }).catch(function (err) {
        console.log(err);
      });

    })



  }

}
module.exports = OssController;
