'use strict';
const Service = require('egg').Service;
const JPush = require('jpush-sdk');

const API = 'https://api.im.jpush.cn';
const appKey = 'e5960325ed6948858ea30e03';
const masterSecret = 'ddca594a915934ac850e1b49';
const client = JPush.buildClient(appKey, masterSecret);
const authorization = 'Basic ' + new Buffer(appKey + ':' + masterSecret).toString('base64');
class PushService extends Service {
  async sendExtra(pushObject) {
    let audience;
    if (pushObject.audiences) {
      audience = JPush.alias(pushObject.audiences);
    } else {
      audience = JPush.ALL;
    }
    client.push().setPlatform(JPush.ALL)
      .setAudience(audience)
      .setMessage(pushObject.message)
      .send((err, res) => {
        if (err) {
          console.log(err.message);
        } else {
          console.log('Sendno: ' + res.sendno);
          console.log('Msg_id: ' + res.msg_id);
        }
      });
  }

  async register(user) {
    const params = [{ username: user.phone, password: '123456' }];
    return await this.ctx.curl(API + '/v1/users/', {
      method: 'POST',
      data: params,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      contentType: 'json',
    });
  }

  async removeUser(userName) {
    await this.ctx.curl(API + '/v1/users/' + userName, {
      method: 'DELETE',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      dataType: 'json',
    });
  }

  async createGroup(groupInfo) {
    const user = await this.ctx.curl(API + '/v1/users/15828080772', {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      dataType: 'json',
    });
    return await this.ctx.curl(API + '/v1/groups/', {
      method: 'POST',
      data: groupInfo,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      dataType: 'json',
    });
  }

  async updateGroup(gid, name, desc) {
    const requestParams = {};
    if (name) { requestParams.name = name; }
    if (desc) { requestParams.desc = desc; }
    return await this.ctx.curl(API + '/v1/groups/' + gid, {
      method: 'PUT',
      data: requestParams,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      contentType: 'json',
    });
  }

  async deleteGroup(gid) {
    return await this.ctx.curl(API + '/v1/groups/' + gid, {
      method: 'DELETE',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      contentType: 'json',
    });
  }

  async updateGroupMemeber(gid, members) {
    return await this.ctx.curl(API + '/v1/groups/' + gid + '/members', {
      method: 'POST',
      data: members,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      contentType: 'json',
    });
  }
}
module.exports = PushService;
