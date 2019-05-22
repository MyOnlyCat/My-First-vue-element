'use strict';
const Service = require('egg').Service;
const username = 'yilunjk';
const userkey = 'Yilunjk123';

class SmsService extends Service {
  async send(phoneNo, content) {
    const md5Pass = this.ctx.helper.md5(userkey + username);
    const params = `?ac=send&uid=${username}&pwd=${md5Pass}&mobile=${phoneNo}&encode=utf-8&content=${encodeURIComponent(content)}`;

    this.app.logger.info(`send sms ${phoneNo}: ${content}`);
    const result = await this.ctx.curl('http://api.sms.cn/sms/' + params, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
    return result;
  }

}
module.exports = SmsService;
